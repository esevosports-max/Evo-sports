import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const globalAny = global as any
globalAny.gpsBuffer = globalAny.gpsBuffer || []

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { trackerId, battery, telemetryPoints } = body

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

    const resolvedPlayerId = device.playerId
    let pointsAdded = 0

    if (telemetryPoints && Array.isArray(telemetryPoints) && resolvedPlayerId) {
      // Lazy load Pusher
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

      for (const pt of telemetryPoints) {
        const telemetryPoint = {
          playerId: resolvedPlayerId,
          eventId: pt.eventId || null,
          x: parseFloat(pt.x),
          y: parseFloat(pt.y),
          speed: parseFloat(pt.speed || 0.0),
          heartRate: pt.heartRate ? parseInt(pt.heartRate) : null,
          timestamp: pt.timestamp ? new Date(pt.timestamp) : new Date()
        }

        const channelName = pt.eventId ? `live-tracking-${pt.eventId}` : "live-tracking-general"
        if (pusher) {
          await pusher.trigger(channelName, "player-moved", telemetryPoint)
        }

        globalAny.gpsBuffer.push(telemetryPoint)
        pointsAdded++
      }
    }

    return NextResponse.json({
      success: true,
      deviceId: device.id,
      playerId: resolvedPlayerId,
      pointsAdded
    })
  } catch (error: any) {
    console.error("Error in Bluetooth GPS API:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
