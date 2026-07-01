"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getClubIdForUser } from "../planning/actions"

export async function getPresenceDataAction() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, players: [], events: [], presences: [], teamCategories: [] }
    }

    // 1. Fetch team categories
    const teamCategories = await db.teamCategory.findMany({
      where: { clubId },
      orderBy: { name: "asc" }
    })

    // 2. Fetch players with user profiles and categories
    const players = await db.player.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        teamCategory: true
      },
      orderBy: {
        user: {
          name: "asc"
        }
      }
    })

    // 3. Fetch all calendar events for the club
    const events = await db.calendarEvent.findMany({
      where: { clubId },
      orderBy: [
        { date: "desc" },
        { time: "desc" }
      ]
    })

    // 4. Fetch all presence records for this club's players
    const presences = await db.presence.findMany({
      where: {
        player: {
          clubId
        }
      }
    })

    return {
      success: true,
      players: JSON.parse(JSON.stringify(players)),
      events: JSON.parse(JSON.stringify(events)),
      presences: JSON.parse(JSON.stringify(presences)),
      teamCategories: JSON.parse(JSON.stringify(teamCategories))
    }
  } catch (error: any) {
    console.error("Error in getPresenceDataAction:", error)
    return { success: false, error: error.message || "Erreur de chargement des données de présence" }
  }
}

export async function saveEventAttendanceAction(data: {
  eventId: string
  eventType: string // "MATCH" | "TRAINING" | "CONVOCATION"
  dateStr: string
  attendances: { playerId: string; status: "PRESENT" | "ABSENT" }[]
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      throw new Error("Club introuvable")
    }

    const allowedRoles = [
      "PRESIDENT",
      "MANAGER_EVO_SPORTS",
      "DIRECTEUR_SPORTIF",
      "SECRETAIRE_GENERAL",
      "ENTRAINEUR_PRINCIPAL",
      "ENTRAINEUR_ADJOINT",
      "PREPARATEUR_PHYSIQUE",
      "ENTRAINEUR_GARDIENS",
      "MEDECIN"
    ]
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Vous n'êtes pas autorisé à marquer les présences.")
    }

    // Parse event date
    let eventDate = new Date()
    if (data.dateStr) {
      try {
        eventDate = new Date(data.dateStr)
      } catch {}
    }

    // Use a transaction to delete and insert
    await db.$transaction(async (tx) => {
      // Delete existing records for this event
      await tx.presence.deleteMany({
        where: {
          eventId: data.eventId,
          eventType: data.eventType
        }
      })

      // Insert new records
      if (data.attendances.length > 0) {
        await tx.presence.createMany({
          data: data.attendances.map((att) => ({
            playerId: att.playerId,
            eventId: data.eventId,
            eventType: data.eventType,
            status: att.status,
            date: eventDate
          }))
        })
      }
    })

    revalidatePath("/dashboard/presence")
    return { success: true }
  } catch (error: any) {
    console.error("Error saving event attendance:", error)
    return { success: false, error: error.message || "Erreur lors de l'enregistrement des présences" }
  }
}
