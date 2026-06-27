import { NextResponse } from "next/server"
import { auth } from "@/auth"
import Pusher from "pusher"

let pusher: Pusher | null = null

if (
  process.env.PUSHER_APP_ID &&
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  })
}

// In-memory buffer fallback
const globalAny = global as any
globalAny.gpsBuffer = globalAny.gpsBuffer || []
globalAny.lastSessionActivity = globalAny.lastSessionActivity || {}

async function checkAndCloseInactiveSessions() {
  const now = Date.now()
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

  for (const eventId in globalAny.lastSessionActivity) {
    const lastActive = globalAny.lastSessionActivity[eventId]
    if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
      console.log(`[Auto-Close] Session ${eventId} has been inactive for >30 mins. Flushing to DB...`)
      
      const buffer = globalAny.gpsBuffer || []
      const pointsToInsert = eventId === "general"
        ? buffer.filter((p: any) => !p.eventId)
        : buffer.filter((p: any) => p.eventId === eventId)

      if (pointsToInsert.length > 0) {
        try {
          const { db } = await import("@/lib/db")
          await db.telemetry.createMany({
            data: pointsToInsert.map((p: any) => ({
              playerId: p.playerId,
              eventId: p.eventId === "general" ? null : p.eventId,
              x: p.x,
              y: p.y,
              speed: p.speed,
              heartRate: p.heartRate,
              timestamp: p.timestamp
            })),
            skipDuplicates: true
          })
          
          if (eventId === "general") {
            globalAny.gpsBuffer = buffer.filter((p: any) => p.eventId)
          } else {
            globalAny.gpsBuffer = buffer.filter((p: any) => p.eventId !== eventId)
          }
          console.log(`[Auto-Close] Successfully saved ${pointsToInsert.length} points for event ${eventId}.`)
        } catch (dbErr) {
          console.error(`[Auto-Close] Failed to save telemetry for event ${eventId}:`, dbErr)
        }
      }
      delete globalAny.lastSessionActivity[eventId]
    }
  }
}

// Background auto-close loop (checks every 1 minute)
if (!globalAny.autoCloseIntervalInitialized) {
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      checkAndCloseInactiveSessions().catch(err => console.error("Error in background auto-close check:", err))
    }, 60000)
    globalAny.autoCloseIntervalInitialized = true
  }
}

export async function POST(req: Request) {
  try {
    // Optionally check authentication, but allow raw pings for hardware or simulations if authorized
    const session = await auth()
    
    const body = await req.json()
    const { playerId: directPlayerId, trackerId, eventId, x, y, speed, heartRate, timestamp } = body

    // Track activity timestamp on the server
    const activeKey = eventId || "general"
    globalAny.lastSessionActivity[activeKey] = Date.now()

    // Clean up any other inactive sessions (older than 30 mins)
    await checkAndCloseInactiveSessions()

    let resolvedPlayerId = directPlayerId

    // Map physical trackerId to internal playerId if present
    if (trackerId) {
      // Lazy load global cache map
      if (!globalAny.trackerToPlayerMapInitialized) {
        const { db } = await import("@/lib/db")
        const devices = await db.gpsDevice.findMany({
          where: { playerId: { not: null } }
        })
        globalAny.trackerToPlayerMap = {}
        for (const dev of devices) {
          if (dev.playerId) {
            globalAny.trackerToPlayerMap[dev.id] = dev.playerId
          }
        }
        globalAny.trackerToPlayerMapInitialized = true
      }

      const cachedPlayerId = globalAny.trackerToPlayerMap[trackerId]
      if (cachedPlayerId) {
        resolvedPlayerId = cachedPlayerId
      } else {
        // Direct DB fallback for dynamic un-cached bindings
        const { db } = await import("@/lib/db")
        const dev = await db.gpsDevice.findUnique({
          where: { id: trackerId }
        })
        if (dev && dev.playerId) {
          globalAny.trackerToPlayerMap[trackerId] = dev.playerId
          resolvedPlayerId = dev.playerId
        }
      }
    }

    if (!resolvedPlayerId || x === undefined || y === undefined) {
      return NextResponse.json({ error: "playerId ou trackerId valide, x, et y sont requis." }, { status: 400 })
    }

    const telemetryPoint = {
      playerId: resolvedPlayerId,
      eventId: eventId || null,
      x: parseFloat(x),
      y: parseFloat(y),
      speed: parseFloat(speed || 0.0),
      heartRate: heartRate ? parseInt(heartRate) : null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    }

    // 1. Broadcast to Pusher (real-time channel)
    const channelName = eventId ? `live-tracking-${eventId}` : "live-tracking-general"
    if (pusher) {
      await pusher.trigger(channelName, "player-moved", telemetryPoint)
    } else {
      // In local/mock mode, we can log or just let the client loopback
      console.log(`[GPS Mock Broadcast] Channel: ${channelName}, Event: player-moved`, telemetryPoint)
    }

    // 2. Cache in global memory buffer
    globalAny.gpsBuffer.push(telemetryPoint)

    return NextResponse.json({ 
      success: true, 
      broadcast: pusher ? "pusher" : "mock",
      bufferSize: globalAny.gpsBuffer.length 
    })
  } catch (error: any) {
    console.error("Error in gps-receiver API:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
