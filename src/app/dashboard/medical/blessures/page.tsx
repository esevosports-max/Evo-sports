import { auth } from "@/auth"
import { db } from "@/lib/db"
import BlessuresClient from "@/components/BlessuresClient"

export default async function BlessuresPage() {
  const session = await auth()
  if (!session || !session.user) {
    return (
      <div className="p-8 text-center font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl">
        Vous devez être connecté pour accéder à cette page.
      </div>
    )
  }

  const userId = session.user.id
  const userRole = session.user.role?.name

  // Determine club context
  let club = await db.club.findUnique({
    where: { presidentId: userId }
  })

  if (!club && userRole === "MANAGER_EVO_SPORTS") {
    club = await db.club.findFirst()
  }

  if (!club) {
    const staffMember = await db.staff.findUnique({
      where: { userId },
      include: { club: true }
    })
    if (staffMember) {
      club = staffMember.club
    }
  }

  if (!club) {
    const playerMember = await db.player.findUnique({
      where: { userId },
      include: { club: true }
    })
    if (playerMember) {
      club = playerMember.club
    }
  }

  if (!club) {
    return (
      <div className="p-8 text-center font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        Veuillez d&apos;abord créer un club ou contacter l&apos;administration.
      </div>
    )
  }

  const clubId = club.id

  // 1. Fetch Categories and Players
  let dbCategories = []
  let dbPlayers = []

  if (userRole === "JOUEUR") {
    const playerMember = await db.player.findUnique({
      where: { userId }
    })

    if (!playerMember || !playerMember.isInjured) {
      return (
        <div className="p-8 text-center font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          Accès restreint. Vous n&apos;avez aucune blessure active déclarée.
        </div>
      )
    }

    dbCategories = await db.teamCategory.findMany({
      where: { clubId }
    })

    // Automatically transition expired return dates to "Expiré" in the DB
    await db.player.updateMany({
      where: {
        userId,
        isInjured: true,
        injuryStatus: "Actif",
        injuryReturn: { lte: new Date() }
      },
      data: {
        injuryStatus: "Expiré"
      }
    })

    dbPlayers = await db.player.findMany({
      where: { userId },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
  } else if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staff?.categories.map((c) => c.id) || []

    dbCategories = await db.teamCategory.findMany({
      where: { id: { in: categoryIds } }
    })

    // 1.5 Automatically transition expired return dates to "Expiré" in the DB
    await db.player.updateMany({
      where: {
        clubId,
        teamCategoryId: { in: categoryIds },
        isInjured: true,
        injuryStatus: "Actif",
        injuryReturn: { lte: new Date() }
      },
      data: {
        injuryStatus: "Expiré"
      }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
  } else {
    dbCategories = await db.teamCategory.findMany({
      where: { clubId }
    })

    // 1.5 Automatically transition expired return dates to "Expiré" in the DB
    await db.player.updateMany({
      where: {
        clubId,
        isInjured: true,
        injuryStatus: "Actif",
        injuryReturn: { lte: new Date() }
      },
      data: {
        injuryStatus: "Expiré"
      }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
  }

  const players = dbPlayers.map((p) => ({
    id: p.id,
    name: p.user?.name || "Joueur Inconnu",
    teamCategoryId: p.teamCategoryId,
    teamCategoryName: p.teamCategory?.name || null,
    isInjured: p.isInjured,
    injuryType: p.injuryType,
    injurySeverity: p.injurySeverity,
    injuryDuration: p.injuryDuration,
    injuryDate: p.injuryDate,
    injuryReturn: p.injuryReturn,
    injuryStatus: p.injuryStatus,
    injuryProgress: p.injuryProgress,
    injuryDeclaredBy: p.injuryDeclaredBy
  }))

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name
  }))

  return (
    <BlessuresClient initialPlayers={players} categories={categories} userRole={userRole} />
  )
}
