"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Shared helper to retrieve the clubId for any logged-in user
export async function getClubIdForUser(userId: string, roleName: string): Promise<string | null> {
  try {
    if (roleName === "PRESIDENT") {
      const club = await db.club.findUnique({
        where: { presidentId: userId }
      })
      if (club) return club.id

      // Fallback: look up in clubRegistrationRequest
      const req = await db.clubRegistrationRequest.findUnique({
        where: { userId }
      })
      if (req && req.status === "APPROVED") {
        // Find club by name or create one
        const clubByName = await db.club.findFirst({
          where: { name: req.clubName }
        })
        if (clubByName) return clubByName.id
      }
    } else if (roleName === "MANAGER_EVO_SPORTS") {
      const club = await db.club.findFirst()
      return club ? club.id : null
    } else {
      // Staff
      const staffMember = await db.staff.findUnique({
        where: { userId },
        select: { clubId: true }
      })
      if (staffMember) return staffMember.clubId

      // Player
      const playerMember = await db.player.findUnique({
        where: { userId },
        select: { clubId: true }
      })
      if (playerMember) return playerMember.clubId
    }
  } catch (error) {
    console.error("Error in getClubIdForUser helper:", error)
  }
  return null
}

export async function getEvents() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, events: [] }
    }

    // Retrieve events
    let events = await db.calendarEvent.findMany({
      where: { clubId },
      orderBy: [
        { date: "asc" },
        { time: "asc" }
      ]
    })

    return { success: true, events: JSON.parse(JSON.stringify(events)) }
  } catch (error: any) {
    console.error("Error fetching/seeding calendar events:", error)
    return { success: false, error: error.message || "Erreur de chargement" }
  }
}

export async function createEvent(data: {
  title: string
  type: string
  date: string
  time: string
  location: string
  details?: string
  assignedTeam?: string
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
      throw new Error("Club introuvable pour l'utilisateur")
    }

    const newEvent = await db.calendarEvent.create({
      data: {
        title: data.title,
        type: data.type,
        date: data.date,
        time: data.time,
        location: data.location,
        details: data.details,
        assignedTeam: data.assignedTeam,
        creatorName: session.user.name || "Utilisateur",
        creatorRole: roleName,
        status: data.type === "MATCH" ? "PROGRAMME" : undefined,
        clubId,
      }
    })

    revalidatePath("/dashboard/planning")
    revalidatePath("/dashboard/match")

    return { success: true, event: JSON.parse(JSON.stringify(newEvent)) }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { success: false, error: error.message || "Erreur lors de la création" }
  }
}

export async function deleteEvent(id: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    await db.calendarEvent.delete({
      where: { id }
    })

    revalidatePath("/dashboard/planning")
    revalidatePath("/dashboard/match")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return { success: false, error: error.message || "Erreur lors de la suppression" }
  }
}
