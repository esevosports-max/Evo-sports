"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { sendPushNotificationToUsers } from "@/lib/pushNotifications"

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

    let whereClause: any = { clubId }

    if (roleName === "JOUEUR") {
      const player = await db.player.findUnique({
        where: { userId },
        include: { teamCategory: true }
      })
      const teamName = player?.teamCategory?.name
      if (teamName) {
        whereClause.OR = [
          { assignedTeam: teamName },
          { assignedTeam: null }
        ]
      } else {
        whereClause.assignedTeam = null
      }
    }

    // Retrieve events
    let events = await db.calendarEvent.findMany({
      where: whereClause,
      orderBy: [
        { date: "asc" },
        { time: "asc" }
      ]
    })

    const now = new Date()
    let updatedAny = false

    for (const event of events) {
      if ((event.type === "MATCH" || event.type === "TRAINING") && event.status === "PROGRAMME") {
        const eventStart = new Date(`${event.date}T${event.time}:00`)
        if (!isNaN(eventStart.getTime())) {
          const diffMs = now.getTime() - eventStart.getTime()
          if (diffMs > 24 * 60 * 60 * 1000) {
            await db.calendarEvent.update({
              where: { id: event.id },
              data: { status: "EXPIRE" }
            })
            event.status = "EXPIRE"
            updatedAny = true
          }
        }
      }
    }

    if (updatedAny) {
      revalidatePath("/dashboard/planning")
      revalidatePath("/dashboard/match")
      revalidatePath("/dashboard/entrainement")
    }

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

    const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MEDECIN"]
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Vous n'êtes pas autorisé à créer des événements.")
    }

    if (roleName === "SECRETAIRE_GENERAL" && !["EXCURSION", "MEETING"].includes(data.type)) {
      throw new Error("Vous n'êtes autorisé qu'à planifier des excursions et des réunions.")
    }

    if (["ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "ENTRAINEUR_GARDIENS"].includes(roleName) && !["TRAINING", "MATCH"].includes(data.type)) {
      throw new Error("Vous n'êtes autorisé qu'à planifier des entraînements et des matchs.")
    }

    if (roleName === "MEDECIN" && data.type !== "MEDICAL_EXAM") {
      throw new Error("Vous n'êtes autorisé qu'à planifier des examens médicaux.")
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

    // Fetch all staff members, players and the club owner/president to send notifications
    try {
      const [staff, players, club] = await Promise.all([
        db.staff.findMany({
          where: { clubId },
          select: { userId: true }
        }),
        db.player.findMany({
          where: {
            clubId,
            ...(data.assignedTeam
              ? { teamCategory: { name: data.assignedTeam } }
              : {})
          },
          select: { userId: true }
        }),
        db.club.findUnique({
          where: { id: clubId },
          select: { presidentId: true }
        })
      ])

      const recipientIds = new Set<string>()
      if (club?.presidentId) {
        recipientIds.add(club.presidentId)
      }
      staff.forEach(s => {
        if (s.userId) recipientIds.add(s.userId)
      })
      players.forEach(p => {
        if (p.userId) recipientIds.add(p.userId)
      })

      // Exclude the event creator so they don't notify themselves
      recipientIds.delete(userId)

      if (recipientIds.size > 0) {
        let formattedDate = data.date
        try {
          const d = new Date(data.date)
          if (!isNaN(d.getTime())) {
            formattedDate = d.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            })
          }
        } catch {}

        const typeLabels: Record<string, string> = {
          MATCH: "Match ⚽",
          TRAINING: "Entraînement 🏃‍♂️",
          MEETING: "Réunion 🤝",
          EXCURSION: "Sortie / Déplacement 🚌",
          MEDICAL_EXAM: "Examen Médical 🩺",
        }
        const eventLabel = typeLabels[data.type] || "Événement 📅"

        const notificationTitle = `📅 Nouvel Événement : ${data.title}`
        const notificationMessage = `Un nouvel événement de type "${eventLabel}" a été programmé.\n\n📅 Date : ${formattedDate}\n⏰ Heure : ${data.time}\n📍 Lieu : ${data.location}${data.assignedTeam ? `\n👥 Équipe : ${data.assignedTeam}` : ""}${data.details ? `\n📝 Détails : ${data.details}` : ""}`

        let expiresAt: Date | null = null
        try {
          const eventDateTime = new Date(`${data.date}T${data.time}:00`)
          if (!isNaN(eventDateTime.getTime())) {
            expiresAt = new Date(eventDateTime.getTime() + 48 * 60 * 60 * 1000)
          }
        } catch {}

        await db.notification.createMany({
          data: Array.from(recipientIds).map(recId => ({
            userId: recId,
            title: notificationTitle,
            message: notificationMessage,
            type: "EVENT",
            read: false,
            expiresAt
          }))
        })

        const recList = Array.from(recipientIds)
        if (recList.length > 0) {
          await sendPushNotificationToUsers(recList, {
            title: notificationTitle,
            body: `Un nouvel événement "${data.title}" est programmé le ${formattedDate} à ${data.time}.`,
            data: {
              url: "/dashboard/planning",
              eventId: newEvent.id
            }
          })
        }
      }
    } catch (notificationError) {
      console.error("Error creating notifications for calendar event:", notificationError)
    }

    revalidatePath("/dashboard")
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

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const userName = session.user.name || ""

    const event = await db.calendarEvent.findUnique({
      where: { id }
    })
    if (!event) {
      throw new Error("Événement introuvable")
    }

    // Check if event is expired (more than 24 hours past scheduled date and time and not started/completed)
    let isExpired = event.status === "EXPIRE"
    if (!isExpired && (event.type === "MATCH" || event.type === "TRAINING") && event.status === "PROGRAMME") {
      const eventStart = new Date(`${event.date}T${event.time}:00`)
      if (!isNaN(eventStart.getTime())) {
        const diffMs = Date.now() - eventStart.getTime()
        if (diffMs > 24 * 60 * 60 * 1000) {
          isExpired = true
        }
      }
    }

    if (isExpired) {
      if (roleName !== "PRESIDENT" && roleName !== "MANAGER_EVO_SPORTS") {
        throw new Error("Cet événement a expiré. Seul le Président du club peut le supprimer.")
      }
    } else {
      const isPresidentOrManager = ["PRESIDENT", "MANAGER_EVO_SPORTS"].includes(roleName)
      const isCreator = event.creatorName === userName

      if (!isPresidentOrManager && !isCreator) {
        throw new Error("Vous n'êtes pas autorisé à supprimer cet événement.")
      }
    }

    await db.calendarEvent.delete({
      where: { id }
    })

    revalidatePath("/dashboard/planning")
    revalidatePath("/dashboard/match")
    revalidatePath("/dashboard/entrainement")

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return { success: false, error: error.message || "Erreur lors de la suppression" }
  }
}

export async function getClubTeams() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, allTeams: [], myTeams: [] }
    }

    // Get all categories/teams created in the club
    const allCategories = await db.teamCategory.findMany({
      where: { clubId },
      select: { name: true }
    })
    const allTeams = allCategories.map(c => c.name)

    // For staff, get their assigned categories/teams
    let myTeams: string[] = []
    if (!["PRESIDENT", "MANAGER_EVO_SPORTS", "SECRETAIRE_GENERAL"].includes(roleName)) {
      const staffMember = await db.staff.findUnique({
        where: { userId },
        include: { categories: { select: { name: true } } }
      })
      if (staffMember) {
        myTeams = staffMember.categories.map(c => c.name)
      }
    } else {
      myTeams = allTeams
    }

    // If myTeams is empty (e.g. staff not assigned to any category yet), fall back to allTeams
    if (myTeams.length === 0) {
      myTeams = allTeams
    }

    return { success: true, allTeams, myTeams }
  } catch (error: any) {
    console.error("Error in getClubTeams:", error)
    return { success: false, error: error.message || "Erreur de chargement" }
  }
}

export async function completeTraining(id: string, details?: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const roleName = session.user.role?.name || ""
    const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS"]
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Vous n'êtes pas autorisé à modifier cet événement.")
    }

    const updated = await db.calendarEvent.update({
      where: { id },
      data: {
        status: "TERMINE",
        details
      }
    })

    revalidatePath("/dashboard/entrainement")
    revalidatePath("/dashboard/planning")
    revalidatePath("/dashboard")

    return { success: true, event: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error("Error completing training:", error)
    return { success: false, error: error.message || "Erreur lors de la clôture" }
  }
}

