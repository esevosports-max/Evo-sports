"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function declareInjury(
  playerId: string,
  data: {
    injuryType: string
    severity: string
    durationValue: number
    durationUnit: "days" | "weeks" | "months"
    dateDeclared: string
  }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MEDECIN" && userRole !== "PREPARATEUR_PHYSIQUE") {
      throw new Error("Action réservée au président, médecin et préparateur physique")
    }

    // Verify player exists
    const player = await db.player.findUnique({
      where: { id: playerId }
    })

    if (!player) {
      throw new Error("Joueur introuvable")
    }

    // Calculate return date
    const date = new Date(data.dateDeclared)
    if (isNaN(date.getTime())) {
      throw new Error("Date de blessure invalide")
    }

    if (data.durationUnit === "days") {
      date.setDate(date.getDate() + data.durationValue)
    } else if (data.durationUnit === "weeks") {
      date.setDate(date.getDate() + data.durationValue * 7)
    } else if (data.durationUnit === "months") {
      date.setMonth(date.getMonth() + data.durationValue)
    }

    const durationLabel = `${data.durationValue} ${
      data.durationUnit === "days"
        ? data.durationValue > 1 ? "jours" : "jour"
        : data.durationUnit === "weeks"
        ? data.durationValue > 1 ? "semaines" : "semaine"
        : "mois"
    }`

    const staffName = session.user.name || session.user.email || "Staff Evo Sports"

    await db.player.update({
      where: { id: playerId },
      data: {
        isInjured: true,
        injuryType: data.injuryType,
        injurySeverity: data.severity,
        injuryDuration: durationLabel,
        injuryDate: new Date(data.dateDeclared),
        injuryReturn: date,
        injuryStatus: "Actif",
        injuryProgress: 5,
        injuryDeclaredBy: staffName
      }
    })

    revalidatePath("/dashboard/medical/blessures")
    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error declaring injury:", e)
    return { success: false, error: e.message || "Erreur de déclaration de la blessure" }
  }
}

export async function healPlayer(playerId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MEDECIN" && userRole !== "PREPARATEUR_PHYSIQUE") {
      throw new Error("Action réservée au président, médecin et préparateur physique")
    }

    await db.player.update({
      where: { id: playerId },
      data: {
        isInjured: false,
        injuryStatus: "Rétabli",
        injuryProgress: 100
      }
    })

    revalidatePath("/dashboard/medical/blessures")
    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error healing player:", e)
    return { success: false, error: e.message || "Erreur lors du rétablissement" }
  }
}
