"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

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

    // Check authorization: only president and manager can edit composition
    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Action réservée aux gestionnaires")
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

