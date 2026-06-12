import { auth } from "@/auth"
import { db } from "@/lib/db"
import EffectifsClient from "@/components/EffectifsClient"

export default async function EffectifsPage() {
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

  if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staff?.categories.map((c) => c.id) || []

    dbCategories = await db.teamCategory.findMany({
      where: { id: { in: categoryIds } },
      include: { players: true }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: {
        teamCategory: true,
        user: true,
        physicalIndices: {
          orderBy: { date: "desc" },
          take: 1
        },
        physicalTests: {
          orderBy: { date: "desc" },
          take: 1
        }
      }
    })
  } else {
    dbCategories = await db.teamCategory.findMany({
      where: { clubId },
      include: { players: true }
    })

    dbPlayers = await db.player.findMany({
      where: { clubId },
      include: {
        teamCategory: true,
        user: true,
        physicalIndices: {
          orderBy: { date: "desc" },
          take: 1
        },
        physicalTests: {
          orderBy: { date: "desc" },
          take: 1
        }
      }
    })
  }

  // Format players and categories for the client component
  const players = dbPlayers.map((p: any) => {
    const latestIndex = p.physicalIndices?.[0] || null
    const latestTest = p.physicalTests?.[0] || null
    return {
      id: p.id,
      name: p.user?.name || "Joueur Inconnu",
      email: p.user?.email || "",
      password: p.user?.password || "",
      isBlocked: p.user?.blocked || false,
      number: p.number || 0,
      position: p.position || "Milieu",
      age: p.age ?? 23,
      height: p.height ?? "180cm",
      weight: p.weight ?? "75kg",
      foot: (p.foot || "Droitier") as any,
      teamCategoryId: p.teamCategoryId,
      teamCategoryName: p.teamCategory?.name || null,
      isInjured: p.isInjured,
      injuryReturn: p.injuryReturn,
      gpsStats: {
        maxSpeed: "En attente",
        distance: "En attente"
      },
      latestIndex: latestIndex ? {
        sleepHours: latestIndex.sleepHours,
        sleepQuality: latestIndex.sleepQuality,
        stress: latestIndex.stress,
        soreness: latestIndex.soreness,
        fatigue: latestIndex.fatigue,
        rpe: latestIndex.rpe,
        heartRate: latestIndex.heartRate,
        date: latestIndex.date.toISOString()
      } : null,
      latestTest: latestTest ? {
        vma: latestTest.vma,
        vo2Max: latestTest.vo2Max,
        sprint10m: latestTest.sprint10m,
        sprint30m: latestTest.sprint30m,
        cmj: latestTest.cmj,
        sj: latestTest.sj,
        illinois: latestTest.illinois,
        fat: latestTest.fat,
        date: latestTest.date.toISOString()
      } : null
    }
  })

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    maxPlayers: c.maxPlayers,
    playersCount: c.players?.length || 0
  }))

  return (
    <EffectifsClient initialPlayers={players} categories={categories} />
  )
}
