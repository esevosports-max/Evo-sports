import { auth } from "@/auth"
import { db } from "@/lib/db"
import DossierMedicalClient from "@/components/DossierMedicalClient"

export default async function DossierMedicalPage() {
  const session = await auth()
  if (!session || !session.user) {
    return (
      <div className="p-8 text-center font-bold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl">
        Vous devez être connecté pour accéder à cette page.
      </div>
    )
  }

  const userId = session.user.id
  const userRole = session.user.role?.name || "JOUEUR"

  // Determine club context
  let club = await db.club.findUnique({
    where: { presidentId: userId }
  })

  if (!club && userRole === "MANAGER_EVO_SPORTS") {
    club = await db.club.findFirst()
  }

  if (!club) {
    // If it's a staff member, retrieve their club
    const staffRecord = await db.staff.findUnique({
      where: { userId },
      include: { club: true }
    })
    if (staffRecord) {
      club = staffRecord.club
    }
  }

  if (!club) {
    // If it's a player, retrieve their club
    const playerRecord = await db.player.findUnique({
      where: { userId },
      include: { club: true }
    })
    if (playerRecord) {
      club = playerRecord.club
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

  // Fetch players with medical details
  let dbPlayers = []

  if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staff?.categories.map((c) => c.id) || []

    dbPlayers = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
  } else {
    dbPlayers = await db.player.findMany({
      where: { clubId },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
  }

  const players = dbPlayers.map((p) => ({
    id: p.id,
    name: p.user?.name || "Joueur Inconnu",
    number: p.number,
    position: p.position,
    teamCategoryName: p.teamCategory?.name || null,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    lastCheckup: p.lastCheckup,
    clearance: p.clearance,
    medicalNotes: p.medicalNotes
  }))

  return (
    <DossierMedicalClient initialPlayers={players} userRole={userRole} />
  )
}
