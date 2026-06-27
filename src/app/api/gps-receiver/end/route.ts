import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

const ALLOWED_STAFF_ROLES = [
  "PRESIDENT",
  "MANAGER_EVO_SPORTS",
  "ENTRAINEUR_PRINCIPAL",
  "ENTRAINEUR_ADJOINT",
  "PREPARATEUR_PHYSIQUE"
]

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  const userRole = session.user.role?.name || ""
  if (!ALLOWED_STAFF_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Rôle non autorisé à clore la session." }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { eventId } = body

    const globalAny = global as any
    const buffer = globalAny.gpsBuffer || []

    if (buffer.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "Aucune donnée dans le cache." })
    }

    // Filter points matching this eventId (or retrieve all if eventId is not provided)
    const pointsToInsert = eventId 
      ? buffer.filter((p: any) => p.eventId === eventId)
      : buffer

    if (pointsToInsert.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "Aucune donnée trouvée pour cette session." })
    }

    // Prisma bulk insert
    const result = await db.telemetry.createMany({
      data: pointsToInsert.map((p: any) => ({
        playerId: p.playerId,
        eventId: p.eventId,
        x: p.x,
        y: p.y,
        speed: p.speed,
        heartRate: p.heartRate,
        timestamp: p.timestamp
      })),
      skipDuplicates: true
    })

    // Clean inserted points from the global buffer
    if (eventId) {
      globalAny.gpsBuffer = buffer.filter((p: any) => p.eventId !== eventId)
      if (globalAny.lastSessionActivity) {
        delete globalAny.lastSessionActivity[eventId]
      }
    } else {
      globalAny.gpsBuffer = []
      globalAny.lastSessionActivity = {}
    }

    console.log(`[GPS Session Close] ${result.count} points GPS enregistrés avec succès.`)

    return NextResponse.json({ 
      success: true, 
      count: result.count, 
      message: `${result.count} points de télémétrie enregistrés.` 
    })
  } catch (error: any) {
    console.error("Error in gps-receiver/end API:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue lors de la sauvegarde." }, { status: 500 })
  }
}
