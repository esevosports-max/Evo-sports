import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import TestClient from "@/components/TestClient"

export default async function TestPage() {
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
    "ENTRAINEUR_GARDIENS",
    "JOUEUR",
    "MANAGER_EVO_SPORTS"
  ]
  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard")
  }

  const isStaff = userRole !== "JOUEUR"

  let clubId = ""
  let playerProfile: any = null

  let physicalTestTemplate: any = null

  if (isStaff) {
    const staff = await db.staff.findUnique({
      where: { userId }
    })
    physicalTestTemplate = staff?.physicalTestTemplate || null
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
    if (clubId) {
      const staffList = await db.staff.findMany({
        where: { clubId }
      })
      const staffTemplate = staffList.find((s) => s.physicalTestTemplate !== null)
      physicalTestTemplate = staffTemplate?.physicalTestTemplate || null
    }
  }

  if (!clubId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
        Vous n&apos;avez pas de club associé à votre compte. Veuillez contacter votre administrateur.
      </div>
    )
  }

  // 1. Fetch categories, players, and tests
  let categories = []
  let players = []
  let physicalTestsData: any[] = []

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
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { name: true } },
        teamCategory: true
      }
    })

    physicalTestsData = await db.physicalTest.findMany({
      where: { player: { clubId, teamCategoryId: { in: categoryIds } } },
      orderBy: { createdAt: "desc" },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            teamCategory: true
          }
        }
      }
    })
  } else {
    categories = await db.teamCategory.findMany({
      where: { clubId },
      orderBy: { name: "asc" }
    })

    players = isStaff
      ? await db.player.findMany({
          where: { clubId },
          orderBy: { user: { name: "asc" } },
          include: {
            user: { select: { name: true } },
            teamCategory: true
          }
        })
      : []

    if (isStaff) {
      physicalTestsData = await db.physicalTest.findMany({
        where: { player: { clubId } },
        orderBy: { createdAt: "desc" },
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              teamCategory: true
            }
          }
        }
      })
    } else if (playerProfile) {
      physicalTestsData = await db.physicalTest.findMany({
        where: { playerId: playerProfile.id },
        orderBy: { createdAt: "desc" },
        include: {
          player: {
            include: {
              user: { select: { name: true } },
              teamCategory: true
            }
          }
        }
      })
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
    teamCategoryId: p.teamCategoryId,
    teamCategoryName: p.teamCategory?.name || "Sans équipe"
  }))

  const clientTests = physicalTestsData.map((t: any) => ({
    id: t.id,
    playerId: t.playerId,
    playerName: t.player?.user?.name || playerProfile?.user?.name || "Joueur",
    playerCategoryName: t.player?.teamCategory?.name || playerProfile?.teamCategory?.name || "Sans équipe",
    playerCategoryId: t.player?.teamCategoryId || playerProfile?.teamCategoryId || null,
    vma: t.vma,
    vo2Max: t.vo2Max,
    sprint10m: t.sprint10m,
    sprint30m: t.sprint30m,
    cmj: t.cmj,
    sj: t.sj,
    illinois: t.illinois,
    fat: t.fat,
    customValues: t.customValues,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString()
  }))

  const clientPlayerProfile = playerProfile
    ? {
        id: playerProfile.id,
        name: playerProfile.user?.name || "Joueur",
        position: playerProfile.position || "Non spécifié",
        number: playerProfile.number || null,
        teamCategoryName: playerProfile.teamCategory?.name || "Sans équipe"
      }
    : null

  return (
    <TestClient
      isStaff={isStaff}
      categories={clientCategories}
      players={clientPlayers}
      tests={clientTests}
      playerProfile={clientPlayerProfile}
      initialTemplate={physicalTestTemplate}
    />
  )
}
