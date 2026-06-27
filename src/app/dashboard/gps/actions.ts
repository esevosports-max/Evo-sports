"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const ALLOWED_STAFF_ROLES = [
  "PRESIDENT",
  "MANAGER_EVO_SPORTS",
  "ENTRAINEUR_PRINCIPAL",
  "ENTRAINEUR_ADJOINT",
  "PREPARATEUR_PHYSIQUE"
]

async function verifyStaff() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error("Non autorisé")
  }
  const userRole = session.user.role?.name
  if (!userRole || !ALLOWED_STAFF_ROLES.includes(userRole)) {
    throw new Error("Action réservée aux membres autorisés du staff")
  }
  return session.user.id
}

// 1. Create a Manual GPS Data Sheet
export async function createGPSData(
  playerId: string,
  eventId: string | null,
  dateStr: string,
  metrics: any
) {
  try {
    await verifyStaff()
    const data = await db.playerGPSData.create({
      data: {
        playerId,
        eventId,
        date: new Date(dateStr),
        ...metrics
      }
    })
    revalidatePath("/dashboard/gps")
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("Error creating GPS data:", error)
    return { success: false, error: error.message || "Erreur de création de la fiche GPS" }
  }
}

// 2. Delete a Manual GPS Data Sheet
export async function deleteGPSData(id: string) {
  try {
    await verifyStaff()
    await db.playerGPSData.delete({
      where: { id }
    })
    revalidatePath("/dashboard/gps")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting GPS data:", error)
    return { success: false, error: error.message || "Erreur de suppression" }
  }
}

// 3. Create a GPS Device
export async function createGpsDevice(id: string) {
  try {
    await verifyStaff()
    const trimmedId = id.trim()
    if (!trimmedId) {
      throw new Error("L'identifiant du boîtier ne peut pas être vide.")
    }

    // Check if already exists
    const existing = await db.gpsDevice.findUnique({
      where: { id: trimmedId }
    })
    if (existing) {
      throw new Error(`Un boîtier avec l'identifiant "${trimmedId}" existe déjà.`)
    }

    await db.gpsDevice.create({
      data: {
        id: trimmedId,
        battery: 100
      }
    })

    revalidatePath("/dashboard/gps")
    return { success: true }
  } catch (error: any) {
    console.error("Error in createGpsDevice:", error)
    return { success: false, error: error.message || "Erreur lors de la création du boîtier." }
  }
}

// 4. Delete a GPS Device
export async function deleteGpsDevice(id: string) {
  try {
    await verifyStaff()
    await db.gpsDevice.delete({
      where: { id }
    })

    // Invalidate local cache
    const globalAny = global as any
    if (globalAny.trackerToPlayerMap) {
      delete globalAny.trackerToPlayerMap[id]
    }

    revalidatePath("/dashboard/gps")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteGpsDevice:", error)
    return { success: false, error: error.message || "Erreur lors de la suppression." }
  }
}

// 5. Associate/Dissociate GPS Device to/from a player
export async function associateGpsDevice(deviceId: string, playerId: string | null) {
  try {
    await verifyStaff()

    // If binding to a player, first disconnect any other device from that player
    if (playerId) {
      await db.gpsDevice.updateMany({
        where: { playerId },
        data: { playerId: null }
      })
    }

    // Update target device
    await db.gpsDevice.update({
      where: { id: deviceId },
      data: { playerId }
    })

    // Update global tracker cache directly
    const globalAny = global as any
    globalAny.trackerToPlayerMap = globalAny.trackerToPlayerMap || {}
    if (playerId) {
      globalAny.trackerToPlayerMap[deviceId] = playerId
    } else {
      delete globalAny.trackerToPlayerMap[deviceId]
    }

    revalidatePath("/dashboard/gps")
    return { success: true }
  } catch (error: any) {
    console.error("Error in associateGpsDevice:", error)
    return { success: false, error: error.message || "Erreur lors de l'association." }
  }
}

// 6. Update a Manual GPS Data Sheet
export async function updateGPSData(
  id: string,
  playerId: string,
  eventId: string | null,
  dateStr: string,
  metrics: any
) {
  try {
    await verifyStaff()
    const data = await db.playerGPSData.update({
      where: { id },
      data: {
        playerId,
        eventId,
        date: new Date(dateStr),
        ...metrics
      }
    })
    revalidatePath("/dashboard/gps")
    return { success: true }
  } catch (error: any) {
    console.error("Error updating GPS data:", error)
    return { success: false, error: error.message || "Erreur de modification de la fiche GPS" }
  }
}

// 7. Get Telemetry Points for a player in a session
export async function getTelemetryForRecord(
  playerId: string,
  eventId: string | null,
  dateStr: string
) {
  try {
    await verifyStaff()
    const date = new Date(dateStr)
    const whereClause: any = { playerId }

    if (eventId) {
      whereClause.eventId = eventId
    } else {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      whereClause.timestamp = {
        gte: startDate,
        lte: endDate
      }
    }

    const points = await db.telemetry.findMany({
      where: whereClause,
      orderBy: { timestamp: "asc" }
    })

    return {
      success: true,
      points: points.map((p) => ({
        x: p.x,
        y: p.y,
        speed: p.speed,
        heartRate: p.heartRate,
        timestamp: p.timestamp.toISOString()
      }))
    }
  } catch (error: any) {
    console.error("Error loading telemetry for record:", error)
    return { success: false, error: error.message || "Erreur de chargement" }
  }
}

// 8. Get the local IP address of the PC/Server hosting the app on the WiFi network
export async function getServerLocalIp() {
  try {
    const os = await import("os")
    const interfaces = os.networkInterfaces()
    const ips: string[] = []
    
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name]
      if (iface) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            ips.push(alias.address)
          }
        }
      }
    }
    
    return { success: true, ip: ips[0] || "127.0.0.1" }
  } catch (err: any) {
    console.error("Error getting server local IP:", err)
    return { success: false, ip: "127.0.0.1" }
  }
}
