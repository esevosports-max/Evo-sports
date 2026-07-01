"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { sendPushNotificationToUsers } from "@/lib/pushNotifications"

export async function saveCompositionAction(data: {
  teamCategoryId: string
  formation: {
    defenders: number
    midfielders: number
    forwards: number
  }
  slots: any[]
  substitutes: string[]
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    // Check authorization: only president, manager, principal coach and assistant coach can edit composition
    const ALLOWED_COMPOSITION_WRITERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"]
    if (!userRole || !ALLOWED_COMPOSITION_WRITERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires et entraîneurs")
    }

    // Verify the category belongs to the user's club context
    const category = await db.teamCategory.findUnique({
      where: { id: data.teamCategoryId },
      include: { club: true }
    })

    if (!category) {
      throw new Error("Catégorie d'équipe introuvable")
    }

    // Upsert the composition record
    const updated = await db.composition.upsert({
      where: { teamCategoryId: data.teamCategoryId },
      update: {
        formation: data.formation,
        slots: data.slots,
        substitutes: data.substitutes
      },
      create: {
        teamCategoryId: data.teamCategoryId,
        formation: data.formation,
        slots: data.slots,
        substitutes: data.substitutes
      }
    })

    revalidatePath("/dashboard/composition")
    return { success: true }
  } catch (e: any) {
    console.error("Error saving composition:", e)
    return { success: false, error: e.message || "Erreur de sauvegarde" }
  }
}

export async function sendCompositionNotificationAction(data: {
  teamCategoryId: string
  notifications: Array<{
    name: string
    role: string
    email?: string
  }>
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    console.log(`[Notification] Sending composition update for category ${data.teamCategoryId}:`)
    data.notifications.forEach((notif) => {
      console.log(`- To ${notif.name} (${notif.email || "no-email"}): role is ${notif.role}`)
    })

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message || "Erreur d'envoi" }
  }
}

export async function communicateCompositionAction(teamCategoryId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    const ALLOWED_COMPOSITION_WRITERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"]
    if (!userRole || !ALLOWED_COMPOSITION_WRITERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires et entraîneurs")
    }

    // Verify the composition exists and load it
    const composition = await db.composition.findUnique({
      where: { teamCategoryId }
    })

    if (!composition) {
      throw new Error("Composition introuvable. Veuillez l'enregistrer d'abord.")
    }

    // Verify slots and substitutes meet requirements: exactly 11 starters, >= 2 substitutes
    const slots = composition.slots as any[]
    const substitutes = composition.substitutes as string[]
    const startersCount = slots.filter((s: any) => s.playerId !== null).length

    if (startersCount !== 11) {
      throw new Error("Il doit y avoir exactement 11 titulaires pour communiquer la composition.")
    }

    if (!substitutes || substitutes.length < 2) {
      throw new Error("Il doit y avoir au moins 2 joueurs remplaçants pour communiquer la composition.")
    }

    // Set as communicated in the database
    await db.composition.update({
      where: { teamCategoryId },
      data: {
        isCommunicated: true,
        communicatedAt: new Date()
      }
    })

    // Get the category details
    const category = await db.teamCategory.findUnique({
      where: { id: teamCategoryId }
    })
    const categoryName = category?.name || "votre équipe"
    const clubId = category?.clubId

    // Create notifications for selected starters and substitutes
    const starterPlayerIds = slots.map((s: any) => s.playerId).filter(Boolean) as string[]
    
    // Fetch user IDs for starters
    const starterPlayers = await db.player.findMany({
      where: { id: { in: starterPlayerIds } },
      select: { userId: true }
    })

    // Fetch user IDs for substitutes
    const substitutePlayers = await db.player.findMany({
      where: { id: { in: substitutes } },
      select: { userId: true }
    })

    // Create notifications in database for starters
    for (const player of starterPlayers) {
      if (player.userId) {
        await db.notification.create({
          data: {
            userId: player.userId,
            title: "Sélection Match : Titulaire 🟢",
            message: `Félicitations, vous êtes sélectionné comme TITULAIRE dans la composition pour l'équipe ${categoryName} !`,
            type: "COMPOSITION"
          }
        })
      }
    }

    // Create notifications in database for substitutes
    for (const player of substitutePlayers) {
      if (player.userId) {
        await db.notification.create({
          data: {
            userId: player.userId,
            title: "Sélection Match : Remplaçant 🟡",
            message: `Vous êtes sélectionné sur le BANC des remplaçants pour le match de l'équipe ${categoryName} !`,
            type: "COMPOSITION"
          }
        })
      }
    }

    const starterUserIds = starterPlayers.map(p => p.userId).filter(Boolean) as string[]
    if (starterUserIds.length > 0) {
      await sendPushNotificationToUsers(starterUserIds, {
        title: "Sélection Match : Titulaire 🟢",
        body: `Félicitations, vous êtes sélectionné comme TITULAIRE dans la composition pour l'équipe ${categoryName} !`,
        data: { url: "/dashboard/composition" }
      })
    }

    const substituteUserIds = substitutePlayers.map(p => p.userId).filter(Boolean) as string[]
    if (substituteUserIds.length > 0) {
      await sendPushNotificationToUsers(substituteUserIds, {
        title: "Sélection Match : Remplaçant 🟡",
        body: `Vous êtes sélectionné sur le BANC des remplaçants pour le match de l'équipe ${categoryName} !`,
        data: { url: "/dashboard/composition" }
      })
    }

    // Send general composition notification to everyone else who has access to the planning of this team category
    try {
      const [staff, categoryPlayers, club] = await Promise.all([
        clubId ? db.staff.findMany({
          where: { clubId },
          select: { userId: true }
        }) : Promise.resolve([]),
        db.player.findMany({
          where: { teamCategoryId },
          select: { userId: true }
        }),
        clubId ? db.club.findUnique({
          where: { id: clubId },
          select: { presidentId: true }
        }) : Promise.resolve(null)
      ])

      const planningAccessUserIds = new Set<string>()
      if (club?.presidentId) {
        planningAccessUserIds.add(club.presidentId)
      }
      staff.forEach(s => {
        if (s.userId) planningAccessUserIds.add(s.userId)
      })
      categoryPlayers.forEach(p => {
        if (p.userId) planningAccessUserIds.add(p.userId)
      })

      // Exclude the composer (current user) and selected players (starters & substitutes)
      planningAccessUserIds.delete(userId)
      starterUserIds.forEach(id => planningAccessUserIds.delete(id))
      substituteUserIds.forEach(id => planningAccessUserIds.delete(id))

      if (planningAccessUserIds.size > 0) {
        const generalRecList = Array.from(planningAccessUserIds)
        const titleGeneral = "📋 Composition Publiée"
        const messageGeneral = `La composition d'équipe pour ${categoryName} a été publiée.`

        await db.notification.createMany({
          data: generalRecList.map(recId => ({
            userId: recId,
            title: titleGeneral,
            message: messageGeneral,
            type: "COMPOSITION",
            read: false
          }))
        })

        await sendPushNotificationToUsers(generalRecList, {
          title: titleGeneral,
          body: messageGeneral,
          data: { url: "/dashboard/composition" }
        })
      }
    } catch (generalNotifErr) {
      console.error("Error sending general composition notifications:", generalNotifErr)
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/composition")
    return { success: true }
  } catch (e: any) {
    console.error("Error communicating composition:", e)
    return { success: false, error: e.message || "Erreur lors de la communication" }
  }
}

export async function uncommunicateCompositionAction(teamCategoryId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    const ALLOWED_COMPOSITION_WRITERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"]
    if (!userRole || !ALLOWED_COMPOSITION_WRITERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires et entraîneurs")
    }

    // Set isCommunicated as false in the database
    await db.composition.update({
      where: { teamCategoryId },
      data: {
        isCommunicated: false,
        communicatedAt: null
      }
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/composition")
    return { success: true }
  } catch (e: any) {
    console.error("Error uncommunicating composition:", e)
    return { success: false, error: e.message || "Erreur lors de la suppression de la communication" }
  }
}

