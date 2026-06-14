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

    // Fetch club's questionnaire template
    const dbClub = await db.club.findUnique({
      where: { id: clubId },
      select: { questionnaireTemplate: true }
    })

    const defaultTemplate = [
      { id: "sleep", text: "Qualité du sommeil (cette nuit)", type: "SCALE", key: "sleepQuality", active: true },
      { id: "fatigue", text: "Niveau de Fatigue Générale", type: "SCALE", key: "fatigue", active: true },
      { id: "stress", text: "Niveau de Stress / Anxiété", type: "SCALE", key: "stress", active: true },
      { id: "soreness", text: "Douleurs Musculaires / Courbatures", type: "SCALE", key: "soreness", active: true },
      { id: "heartRate", text: "Fréquence cardiaque au repos", type: "NUMBER", key: "heartRate", active: true }
    ]

    const templateQuestions = (dbClub?.questionnaireTemplate as any[]) || defaultTemplate
    const activeQuestions = templateQuestions.filter(q => q.active)

    await db.dailyQuestionnaire.create({
      data: {
        clubId,
        teamCategoryId,
        timeLimit: timeLimitMinutes,
        createdAt: now,
        scheduledFor,
        expiresAt,
        active: true,
        isApplied: false,
        questions: activeQuestions
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
  answers: Record<string, any>
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

    // Backward compatibility for standard fields
    const sleepQuality = typeof answers.sleepQuality === 'number' ? answers.sleepQuality : 4
    const fatigue = typeof answers.fatigue === 'number' ? answers.fatigue : 4
    const stress = typeof answers.stress === 'number' ? answers.stress : 4
    const soreness = typeof answers.soreness === 'number' ? answers.soreness : 4
    const heartRate = typeof answers.heartRate === 'number' ? answers.heartRate : 70

    // Save response
    await db.dailyResponse.create({
      data: {
        questionnaireId,
        playerId: player.id,
        sleepQuality,
        fatigue,
        stress,
        soreness,
        heartRate,
        answers: answers
      }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error submitting wellness:", e)
    return { success: false, error: e.message || "Erreur de soumission du test" }
  }
}

export async function saveQuestionnaireTemplate(template: any[]) {
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

    await db.club.update({
      where: { id: clubId },
      data: {
        questionnaireTemplate: template
      }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error saving questionnaire template:", e)
    return { success: false, error: e.message || "Erreur lors de la sauvegarde de la configuration" }
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

export async function deleteQuestionnaire(questionnaireId: string) {
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

    // 1. Delete physical indices associated with this questionnaire
    await db.physicalIndex.deleteMany({
      where: { questionnaireId }
    })

    // 2. Delete the questionnaire itself (daily responses will cascade delete)
    await db.dailyQuestionnaire.delete({
      where: { id: questionnaireId }
    })

    revalidatePath("/dashboard/quotidienne")
    return { success: true }
  } catch (e: any) {
    console.error("Error deleting questionnaire:", e)
    return { success: false, error: e.message || "Erreur lors de la suppression du questionnaire" }
  }
}
