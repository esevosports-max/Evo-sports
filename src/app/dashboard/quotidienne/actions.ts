"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createQuestionnaire(
  teamCategoryId: string | null,
  timeLimitMinutes: number,
  scheduledDate?: string
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Action réservée aux gestionnaires (Staff)")
    }

    // Get the staff's clubId
    const staff = await db.staff.findUnique({
      where: { userId }
    })
    const club = await db.club.findFirst({
      where: {
        OR: [
          { presidentId: userId },
          { staff: { some: { userId } } }
        ]
      }
    })

    const clubId = club?.id || staff?.clubId
    if (!clubId) {
      throw new Error("Club introuvable")
    }

    const now = new Date()
    let scheduledFor = now
    if (scheduledDate) {
      const parsedDate = new Date(scheduledDate)
      if (!isNaN(parsedDate.getTime())) {
        scheduledFor = parsedDate
      }
    }

    const expiresAt = new Date(scheduledFor.getTime() + timeLimitMinutes * 60 * 1000)

    // Deactivate previous active questionnaires if the new one is sent immediately
    if (scheduledFor <= now) {
      await db.dailyQuestionnaire.updateMany({
        where: { clubId, active: true },
        data: { active: false }
      })
    }

    await db.dailyQuestionnaire.create({
      data: {
        clubId,
        teamCategoryId,
        timeLimit: timeLimitMinutes,
        createdAt: now,
        scheduledFor,
        expiresAt,
        active: true,
        isApplied: false
      }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error creating questionnaire:", e)
    return { success: false, error: e.message || "Erreur lors de la création du questionnaire" }
  }
}

export async function submitDailyWellness(
  questionnaireId: string,
  data: { sleepQuality: number; fatigue: number; stress: number; soreness: number; heartRate: number }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id

    // Fetch player profile associated with this user
    const player = await db.player.findUnique({
      where: { userId }
    })

    if (!player) {
      throw new Error("Profil joueur introuvable")
    }

    // Verify questionnaire is active and not expired
    const questionnaire = await db.dailyQuestionnaire.findUnique({
      where: { id: questionnaireId }
    })

    if (!questionnaire) {
      throw new Error("Questionnaire introuvable")
    }

    if (!questionnaire.active) {
      throw new Error("Ce questionnaire n'est plus actif")
    }

    if (new Date(questionnaire.expiresAt) < new Date()) {
      throw new Error("Le temps limite pour répondre à ce questionnaire est écoulé !")
    }

    // Check if player has already responded
    const existingResponse = await db.dailyResponse.findUnique({
      where: {
        questionnaireId_playerId: {
          questionnaireId,
          playerId: player.id
        }
      }
    })

    if (existingResponse) {
      throw new Error("Vous avez déjà répondu à ce questionnaire")
    }

    // Save draft response
    await db.dailyResponse.create({
      data: {
        questionnaireId,
        playerId: player.id,
        sleepQuality: data.sleepQuality,
        fatigue: data.fatigue,
        stress: data.stress,
        soreness: data.soreness,
        heartRate: data.heartRate
      }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error submitting wellness:", e)
    return { success: false, error: e.message || "Erreur de soumission du test" }
  }
}

export async function applyQuestionnaireIndices(questionnaireId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Action réservée aux gestionnaires")
    }

    const questionnaire = await db.dailyQuestionnaire.findUnique({
      where: { id: questionnaireId },
      include: { responses: true }
    })

    if (!questionnaire) {
      throw new Error("Questionnaire introuvable")
    }

    if (questionnaire.isApplied) {
      throw new Error("Les indices de ce questionnaire ont déjà été appliqués")
    }

    // Insert a PhysicalIndex for each player who responded
    const promises = questionnaire.responses.map((resp) => {
      return db.physicalIndex.create({
        data: {
          playerId: resp.playerId,
          questionnaireId: questionnaire.id,
          sleepQuality: resp.sleepQuality,
          fatigue: resp.fatigue,
          stress: resp.stress,
          soreness: resp.soreness,
          heartRate: resp.heartRate,
          date: new Date()
        }
      })
    })

    await Promise.all(promises)

    // Mark the questionnaire indices as applied
    await db.dailyQuestionnaire.update({
      where: { id: questionnaireId },
      data: {
        isApplied: true,
        active: false // Deactivate when indices are committed
      }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error applying indices:", e)
    return { success: false, error: e.message || "Erreur lors de la mise à jour des indices" }
  }
}
