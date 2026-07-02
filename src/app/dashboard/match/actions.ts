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

    // Check expiration rule (120 minutes for normal N/A, 24 hours for EXPIRE)
    for (const match of activeMatches) {
      // Parse match.date (YYYY-MM-DD) and match.time (HH:MM)
      // E.g. "2026-06-03T07:30:00"
      const matchStart = new Date(`${match.date}T${match.time}:00`)
      const diffMs = now.getTime() - matchStart.getTime()
      const diffMins = diffMs / (1000 * 60)

      if (diffMs > 24 * 60 * 60 * 1000 && match.status === "PROGRAMME") {
        await db.calendarEvent.update({
          where: { id: match.id },
          data: {
            status: "EXPIRE",
            score: "N/A"
          }
        })
        updatedAny = true
      } else if (diffMins >= 120) {
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

    // Check if already expired
    const diffMs = now.getTime() - matchStart.getTime()
    const diffMins = diffMs / (1000 * 60)

    if (diffMs > 24 * 60 * 60 * 1000) {
      await db.calendarEvent.update({
        where: { id: matchId },
        data: {
          status: "EXPIRE",
          score: "N/A"
        }
      })
      revalidatePath("/dashboard/match")
      throw new Error("Ce match a expiré (plus de 24 heures écoulées sans coup d'envoi).")
    } else if (diffMins >= 120) {
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

export async function recordMatchResult(
  matchId: string,
  score: string,
  opponentName?: string,
  attendances?: { playerId: string; status: "PRESENT" | "ABSENT" }[],
  details?: string
) {
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
    if (match.status === "N_A" || match.status === "EXPIRE") {
      throw new Error("Ce match a expiré et ne peut plus être modifié.")
    }

    // Determine the new title
    let newTitle = match.title
    if (opponentName) {
      newTitle = `Match contre ${opponentName.trim()}`
    }

    const updated = await db.calendarEvent.update({
      where: { id: matchId },
      data: {
        status: "TERMINE",
        score,
        title: newTitle,
        details
      }
    })

    // Delete existing match presences to avoid duplicates
    await db.presence.deleteMany({
      where: {
        eventId: match.id,
        eventType: "MATCH"
      }
    })

    if (attendances && attendances.length > 0) {
      // Insert custom presence records
      await db.presence.createMany({
        data: attendances.map((att) => ({
          playerId: att.playerId,
          eventId: match.id,
          eventType: "MATCH",
          status: att.status,
          date: new Date(match.date)
        }))
      })
    } else if (match.assignedTeam) {
      // Fallback: default to PRESENT for all squad players
      const teamCategory = await db.teamCategory.findFirst({
        where: { name: match.assignedTeam, clubId: match.clubId }
      })
      if (teamCategory) {
        const players = await db.player.findMany({
          where: { teamCategoryId: teamCategory.id }
        })

        if (players.length > 0) {
          await db.presence.createMany({
            data: players.map((p) => ({
              playerId: p.id,
              eventId: match.id,
              eventType: "MATCH",
              status: "PRESENT",
              date: new Date(match.date)
            }))
          })
        }
      }
    }

    revalidatePath("/dashboard/match")
    revalidatePath("/dashboard/presence")
    revalidatePath("/dashboard/planning")

    return { success: true, match: JSON.parse(JSON.stringify(updated)) }
  } catch (error: any) {
    console.error("Error recording match result:", error)
    return { success: false, error: error.message || "Erreur lors de l'enregistrement" }
  }
}
