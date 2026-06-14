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
    const staffRecord = await db.staff.findUnique({
      where: { userId },
      include: { club: true }
    })
    if (staffRecord) {
      club = staffRecord.club
    }
  }

  if (!club) {
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

  const clubInfo = {
    name: club.name,
    logo: club.logo || null,
    creationDate: club.creationDate ? new Date(club.creationDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Non spécifiée"
  }

  // Fetch categories
  const teamCategories = await db.teamCategory.findMany({
    where: { clubId },
    orderBy: { name: "asc" }
  })

  let dbPlayers: any[] = []
  let dbStaff: any[] = []

  if (userRole === "JOUEUR") {
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
    const categoryIds = staff?.categories.map((c: any) => c.id) || []

    dbPlayers = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
    dbStaff = await db.staff.findMany({
      where: { clubId },
      include: { categories: true, user: { include: { role: true } } },
      orderBy: { user: { name: "asc" } }
    })
  } else {
    dbPlayers = await db.player.findMany({
      where: { clubId },
      include: { teamCategory: true, user: true },
      orderBy: { user: { name: "asc" } }
    })
    dbStaff = await db.staff.findMany({
      where: { clubId },
      include: { categories: true, user: { include: { role: true } } },
      orderBy: { user: { name: "asc" } }
    })
  }

  const mappedPlayers = dbPlayers.map((p) => ({
    id: p.id,
    userId: p.userId,
    name: p.user?.name || "Joueur Inconnu",
    type: "JOUEUR" as const,
    roleLabel: "Joueur",
    teamCategoryName: p.teamCategory?.name || "Sans Équipe",
    teamCategoryId: p.teamCategoryId,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    lastCheckup: p.lastCheckup,
    clearance: p.clearance,
    medicalNotes: p.medicalNotes,
    number: p.number,
    position: p.position,
    age: p.age || null,
    nationality: p.nationality || null,
    birthDate: p.birthDate || null,
    medicalTreatment: p.medicalTreatment || null,
    medication: p.medication || null
  }))

  const mappedStaff = dbStaff.map((s) => ({
    id: s.id,
    userId: s.userId,
    name: s.user?.name || "Staff Inconnu",
    type: "STAFF" as const,
    roleLabel: s.title || s.user?.role?.name || "Staff",
    teamCategoryName: s.categories.map((c: any) => c.name).join(", ") || "Toutes",
    teamCategoryId: s.categories[0]?.id || null,
    bloodGroup: s.bloodGroup,
    allergies: s.allergies,
    lastCheckup: s.lastCheckup,
    clearance: s.clearance,
    medicalNotes: s.medicalNotes,
    number: null,
    position: null,
    age: s.age || null,
    nationality: s.nationality || null,
    birthDate: s.birthDate || null,
    medicalTreatment: s.medicalTreatment || null,
    medication: s.medication || null
  }))

  const allRecords = [...mappedPlayers, ...mappedStaff]

  return (
    <DossierMedicalClient
      initialRecords={allRecords}
      teamCategories={teamCategories}
      userRole={userRole}
      clubInfo={clubInfo}
    />
  )
}
