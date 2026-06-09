import { auth } from "@/auth"
import { db } from "@/lib/db"
import CompositionClient from "@/components/CompositionClient"

export default async function CompositionPage() {
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

  // Fetch Team Categories and Players for this club
  let dbCategories = []
  let dbPlayers = []

  if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staff?.categories.map((c) => c.id) || []

    dbCategories = await db.teamCategory.findMany({
      where: { id: { in: categoryIds } }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: { teamCategory: true, user: true }
    })
  } else {
    dbCategories = await db.teamCategory.findMany({
      where: { clubId }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId },
      include: { teamCategory: true, user: true }
    })
  }

  // Format categories
  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  // Fetch Compositions for these categories
  const dbCompositions = await db.composition.findMany({
    where: {
      teamCategoryId: { in: categories.map((c) => c.id) }
    }
  })

  // Format compositions
  const initialCompositions = dbCompositions.map((comp) => ({
    teamCategoryId: comp.teamCategoryId,
    formation: comp.formation as any,
    slots: comp.slots as any,
    substitutes: comp.substitutes as any
  }))

  // Format players for the client component
  const players = dbPlayers.map((p) => ({
    id: p.id,
    name: p.user?.name || "Joueur Inconnu",
    number: p.number || 0,
    position: p.position || "Milieu",
    teamCategoryId: p.teamCategoryId,
    teamCategoryName: p.teamCategory?.name || null,
  }))

  return (
    <CompositionClient
      initialPlayers={players}
      categories={categories}
      initialCompositions={initialCompositions}
    />
  )
}
