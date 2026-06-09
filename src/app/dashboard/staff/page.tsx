import { auth } from "@/auth"
import { db } from "@/lib/db"
import StaffClient from "@/components/StaffClient"

export default async function StaffPage() {
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
      <StaffClient initialStaff={[]} categories={[]} currentUserRole={userRole} noClub={true} />
    )
  }

  const clubId = club.id

  // Fetch Categories
  const dbCategories = await db.teamCategory.findMany({
    where: { clubId }
  })

  // Fetch Staff
  let dbStaff = await db.staff.findMany({
    where: { clubId },
    include: {
      user: {
        include: { role: true }
      },
      categories: true
    }
  })

  // Map to client format
  const roleMapLabels: Record<string, string> = {
    PRESIDENT: "Président de Club",
    DIRECTEUR_SPORTIF: "Directeur Sportif",
    SECRETAIRE_GENERAL: "Secrétaire Général",
    ENTRAINEUR_PRINCIPAL: "Entraîneur Principal",
    ENTRAINEUR_ADJOINT: "Entraîneur Adjoint",
    PREPARATEUR_PHYSIQUE: "Préparateur Physique",
    ENTRAINEUR_GARDIENS: "Entraîneur des Gardiens",
    MEDECIN: "Médecin du Club"
  }

  const colorMap: Record<string, string> = {
    PRESIDENT: "bg-red-600",
    DIRECTEUR_SPORTIF: "bg-amber-500",
    SECRETAIRE_GENERAL: "bg-teal-500",
    ENTRAINEUR_PRINCIPAL: "bg-blue-600",
    ENTRAINEUR_ADJOINT: "bg-indigo-500",
    PREPARATEUR_PHYSIQUE: "bg-fuchsia-500",
    ENTRAINEUR_GARDIENS: "bg-orange-500",
    MEDECIN: "bg-rose-500"
  }

  const staff = dbStaff.map((s) => {
    const roleTag = s.user?.role?.name || "ENTRAINEUR_ADJOINT"
    return {
      id: s.id,
      name: s.user?.name || "Membre Inconnu",
      role: roleMapLabels[roleTag] || s.title || "Staff",
      roleTag,
      email: s.user?.email || "email@example.com",
      phone: "+33 6 -- -- -- --", // Field not on DB Staff yet, default or placeholder
      joined: s.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      avatarColor: colorMap[roleTag] || "bg-zinc-500",
      assignedTeams: s.categories.map((c) => c.name),
      assignedTeamIds: s.categories.map((c) => c.id)
    }
  })

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name
  }))

  return (
    <StaffClient initialStaff={staff} categories={categories} currentUserRole={userRole} />
  )
}
