import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import QuotidienneClient from "@/components/QuotidienneClient"

export default async function QuotidiennePage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const userRole = session.user.role?.name || "JOUEUR"

  const allowedRoles = [
    "PRESIDENT",
    "DIRECTEUR_SPORTIF",
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "PREPARATEUR_PHYSIQUE",
    "JOUEUR",
    "MANAGER_EVO_SPORTS"
  ]
  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard")
  }

  const isStaff = userRole !== "JOUEUR"

  // 1. Fetch club details
  let clubId = ""
  let playerProfile = null

  if (isStaff) {
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
    clubId = club?.id || staff?.clubId || ""
  } else {
    playerProfile = await db.player.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true, email: true } },
        teamCategory: true
      }
    })
    clubId = playerProfile?.clubId || ""
  }

  if (!clubId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
        Vous n&apos;avez pas de club associé à votre compte. Veuillez contacter votre administrateur.
      </div>
    )
  }

  // Fetch questionnaire template
  let clubTemplate: any = null
  try {
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { questionnaireTemplate: true }
    })
    clubTemplate = club?.questionnaireTemplate || null
  } catch (e) {
    console.error("Error loading club template:", e)
  }

  // 2. Fetch categories, players, and history
  let categories = []
  let players = []
  let questionnairesHistory = []

  if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staff?.categories.map((c) => c.id) || []

    categories = await db.teamCategory.findMany({
      where: { id: { in: categoryIds } },
      orderBy: { name: "asc" }
    })

    players = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: {
        user: { select: { name: true, email: true } },
        teamCategory: true
      },
      orderBy: { user: { name: "asc" } }
    })

    questionnairesHistory = await db.dailyQuestionnaire.findMany({
      where: {
        clubId,
        OR: [
          { teamCategoryId: null },
          { teamCategoryId: { in: categoryIds } }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        teamCategory: true,
        responses: {
          where: {
            player: { teamCategoryId: { in: categoryIds } }
          },
          include: {
            player: {
              include: {
                user: { select: { name: true } },
                teamCategory: true
              }
            }
          }
        }
      }
    })
  } else {
    categories = await db.teamCategory.findMany({
      where: { clubId },
      orderBy: { name: "asc" }
    })

    players = await db.player.findMany({
      where: { clubId },
      include: {
        user: { select: { name: true, email: true } },
        teamCategory: true
      },
      orderBy: { user: { name: "asc" } }
    })

    questionnairesHistory = await db.dailyQuestionnaire.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
      include: {
        teamCategory: true,
        responses: {
          include: {
            player: {
              include: {
                user: { select: { name: true } },
                teamCategory: true
              }
            }
          }
        }
      }
    })
  }

  // 5. Fetch active questionnaire for players
  let activeQuestionnaire = null
  let hasResponded = false
  let draftResponse = null

  if (playerProfile) {
    activeQuestionnaire = await db.dailyQuestionnaire.findFirst({
      where: {
        clubId,
        active: true,
        scheduledFor: { lte: new Date() },
        expiresAt: { gt: new Date() },
        OR: [
          { teamCategoryId: null },
          { teamCategoryId: playerProfile.teamCategoryId }
        ]
      },
      include: {
        responses: {
          where: { playerId: playerProfile.id }
        }
      }
    })

    if (activeQuestionnaire && activeQuestionnaire.responses.length > 0) {
      hasResponded = true
      draftResponse = activeQuestionnaire.responses[0]
    }
  }

  // Clean data structure to pass to client component safely
  const clientCategories = categories.map((c) => ({
    id: c.id,
    name: c.name
  }))

  const clientPlayers = players.map((p) => ({
    id: p.id,
    name: p.user?.name || "Joueur sans nom",
    email: p.user?.email || "",
    teamCategoryId: p.teamCategoryId,
    teamCategoryName: p.teamCategory?.name || "Sans équipe"
  }))

  const clientHistory = questionnairesHistory.map((q) => ({
    id: q.id,
    teamCategoryId: q.teamCategoryId,
    teamCategoryName: q.teamCategory?.name || "Tout le club",
    timeLimit: q.timeLimit,
    createdAt: q.createdAt.toISOString(),
    scheduledFor: q.scheduledFor.toISOString(),
    expiresAt: q.expiresAt.toISOString(),
    active: q.active,
    isApplied: q.isApplied,
    questions: (q.questions as any[]) || null,
    responses: q.responses.map((r) => ({
      id: r.id,
      playerId: r.playerId,
      playerName: r.player?.user?.name || "Joueur sans nom",
      sleepQuality: r.sleepQuality,
      fatigue: r.fatigue,
      stress: r.stress,
      soreness: r.soreness,
      heartRate: r.heartRate,
      answers: (r.answers as Record<string, any>) || null,
      createdAt: r.createdAt.toISOString()
    }))
  }))

  const clientActiveQuestionnaire = activeQuestionnaire
    ? {
        id: activeQuestionnaire.id,
        teamCategoryId: activeQuestionnaire.teamCategoryId,
        timeLimit: activeQuestionnaire.timeLimit,
        createdAt: activeQuestionnaire.createdAt.toISOString(),
        scheduledFor: activeQuestionnaire.scheduledFor.toISOString(),
        expiresAt: activeQuestionnaire.expiresAt.toISOString(),
        active: activeQuestionnaire.active,
        questions: (activeQuestionnaire.questions as any[]) || null
      }
    : null

  const clientDraftResponse = draftResponse
    ? {
        sleepQuality: draftResponse.sleepQuality,
        fatigue: draftResponse.fatigue,
        stress: draftResponse.stress,
        soreness: draftResponse.soreness,
        heartRate: draftResponse.heartRate,
        answers: (draftResponse.answers as Record<string, any>) || null
      }
    : null

  return (
    <QuotidienneClient
      isStaff={isStaff}
      categories={clientCategories}
      players={clientPlayers}
      history={clientHistory}
      activeQuestionnaire={clientActiveQuestionnaire}
      hasResponded={hasResponded}
      draftResponse={clientDraftResponse}
      currentPlayerId={playerProfile?.id || null}
      currentPlayerName={playerProfile?.user?.name || ""}
      clubTemplate={clubTemplate}
    />
  )
}
