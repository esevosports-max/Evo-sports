"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getClubIdForUser } from "../planning/actions"

export async function getMatches() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, matches: [] }
    }

    const now = new Date()

    // 1. Fetch matches with active status (PROGRAMME or EN_COURS) to check for expiration
    const activeMatches = await db.calendarEvent.findMany({
      where: {
        clubId,
        type: "MATCH",
        status: { in: ["PROGRAMME", "EN_COURS"] }
      }
    })

    let updatedAny = false

    // Check expiration rule (120 minutes)
    for (const match of activeMatches) {
      // Parse match.date (YYYY-MM-DD) and match.time (HH:MM)
      // E.g. "2026-06-03T07:30:00"
      const matchStart = new Date(`${match.date}T${match.time}:00`)
      const diffMs = now.getTime() - matchStart.getTime()
      const diffMins = diffMs / (1000 * 60)

      if (diffMins >= 120) {
        await db.calendarEvent.update({
          where: { id: match.id },
          data: {
            status: "N_A",
            score: "N/A"
          }
        })
        updatedAny = true
      }
    }

    // 2. Fetch all matches for display
    const matches = await db.calendarEvent.findMany({
      where: {
        clubId,
        type: "MATCH"
      },
      orderBy: [
        { date: "asc" },
        { time: "asc" }
      ]
    })

    if (updatedAny) {
      revalidatePath("/dashboard/match")
      revalidatePath("/dashboard/planning")
    }

    return { success: true, matches: JSON.parse(JSON.stringify(matches)) }
  } catch (error: any) {
    console.error("Error fetching matches:", error)
    return { success: false, error: error.message || "Erreur de chargement des matchs" }
  }
}

export async function startMatch(matchId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const match = await db.calendarEvent.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      throw new Error("Match introuvable")
    }

    const matchStart = new Date(`${match.date}T${match.time}:00`)
    const now = new Date()

    if (now < matchStart) {
      throw new Error("Le match n'a pas encore commencé. Attendez l'heure du coup d'envoi.")
    }

    // Check if already expired
    const diffMs = now.getTime() - matchStart.getTime()
    const diffMins = diffMs / (1000 * 60)

    if (diffMins >= 120) {
      // Auto-expire instead
      await db.calendarEvent.update({
        where: { id: matchId },
        data: {
          status: "N_A",
          score: "N/A"
        }
      })
      revalidatePath("/dashboard/match")
      throw new Error("Ce match a expiré (plus de 120 minutes écoulées depuis le début).")
    }

    const updated = await db.calendarEvent.update({
      where: { id: matchId },
      data: {
        status: "EN_COURS"
      }
    })

    revalidatePath("/dashboard/match")
    revalidatePath("/dashboard/planning")

    return { success: true, match: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error("Error starting match:", error)
    return { success: false, error: error.message || "Impossible de démarrer le match" }
  }
}

export async function recordMatchResult(matchId: string, score: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const match = await db.calendarEvent.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      throw new Error("Match introuvable")
    }

    // If already expired, don't allow modification
    if (match.status === "N_A") {
      throw new Error("Ce match est marqué N/A et ne peut plus être modifié.")
    }

    const updated = await db.calendarEvent.update({
      where: { id: matchId },
      data: {
        status: "TERMINE",
        score
      }
    })

    revalidatePath("/dashboard/match")
    revalidatePath("/dashboard/planning")

    return { success: true, match: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error("Error recording match result:", error)
    return { success: false, error: error.message || "Erreur lors de l'enregistrement" }
  }
}
