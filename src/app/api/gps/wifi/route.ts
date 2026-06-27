import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const globalAny = global as any
globalAny.gpsBuffer = globalAny.gpsBuffer || []

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { trackerId, battery, x, y, speed, heartRate, eventId, timestamp } = body

    if (!trackerId) {
      return NextResponse.json({ error: "trackerId est requis." }, { status: 400 })
    }

    // Upsert the GPS Device in database
    const device = await db.gpsDevice.upsert({
      where: { id: trackerId },
      create: {
        id: trackerId,
        battery: battery !== undefined ? parseInt(battery) : 100,
      },
      update: {
        battery: battery !== undefined ? parseInt(battery) : undefined,
      }
    })

    let telemetrySaved = false
    const resolvedPlayerId = device.playerId

    if (x !== undefined && y !== undefined) {
      if (resolvedPlayerId) {
        const telemetryPoint = {
          playerId: resolvedPlayerId,
          eventId: eventId || null,
          x: parseFloat(x),
          y: parseFloat(y),
          speed: parseFloat(speed || 0.0),
          heartRate: heartRate ? parseInt(heartRate) : null,
          timestamp: timestamp ? new Date(timestamp) : new Date()
        }

        // Broadcast to Pusher (real-time channel)
        let pusher = null
        if (
          process.env.PUSHER_APP_ID &&
          process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
          process.env.PUSHER_SECRET &&
          process.env.NEXT_PUBLIC_PUSHER_CLUSTER
        ) {
          const Pusher = (await import("pusher")).default
          pusher = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
          })
        }

        const channelName = eventId ? `live-tracking-${eventId}` : "live-tracking-general"
        if (pusher) {
          await pusher.trigger(channelName, "player-moved", telemetryPoint)
        } else {
          console.log(`[WiFi GPS Sync] Broadcast to channel ${channelName}`, telemetryPoint)
        }

        // Add to active session telemetry queue
        globalAny.gpsBuffer.push(telemetryPoint)
        telemetrySaved = true
      }
    }

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      playerId: resolvedPlayerId,
      telemetrySaved
    })
  } catch (error: any) {
    console.error("Error in WiFi GPS API:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
