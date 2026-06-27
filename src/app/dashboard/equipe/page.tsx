import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import EquipeClient from "@/components/EquipeClient"

export default async function EquipePage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const roleName = session.user.role?.name || "No Role"
  const canEdit = roleName === "PRESIDENT" || roleName === "MANAGER_EVO_SPORTS" || roleName === "DIRECTEUR_SPORTIF"

  // Fetch Club details based on user role
  let clubData = null
  let clubId: string | null = null
  let subscriptionPlan = "Club"

  try {
    if (roleName === "PRESIDENT") {
      // Find the Club record linked to this President
      const club = await db.club.findUnique({
        where: { presidentId: userId }
      })

      if (club) {
        clubId = club.id
        subscriptionPlan = club.subscriptionPlan || "Club"
        clubData = {
          name: club.name,
          logo: club.logo,
          creationDate: club.creationDate.toISOString(),
          address: club.address,
          stadiumName: club.stadiumName,
          stadiumCapacity: club.stadiumCapacity || "5 000 places",
          phone: club.phone || "+33 6 12 34 56 78"
        }
      } else {
        // Fallback: check if they have a registration request
        const request = await db.clubRegistrationRequest.findUnique({
          where: { userId }
        })
        if (request) {
          subscriptionPlan = request.chosenPlan || "Club"
          clubData = {
            name: request.clubName,
            logo: request.clubLogo,
            creationDate: request.creationDate.toISOString(),
            address: request.address,
            stadiumName: request.stadiumName,
            stadiumCapacity: "5 000 places", // default
            phone: request.phone || "+33 6 12 34 56 78"
          }
        }
      }
    } else if (roleName === "MANAGER_EVO_SPORTS") {
      // General platform manager can view the first club in DB or demo
      const club = await db.club.findFirst()
      if (club) {
        clubId = club.id
        subscriptionPlan = club.subscriptionPlan || "Club"
        clubData = {
          name: club.name,
          logo: club.logo,
          creationDate: club.creationDate.toISOString(),
          address: club.address,
          stadiumName: club.stadiumName,
          stadiumCapacity: club.stadiumCapacity || "5 000 places",
          phone: club.phone || "+33 6 12 34 56 78"
        }
      }
    } else {
      // For Staff roles (DIRECTEUR_SPORTIF, ENTRAINEUR_PRINCIPAL, ENTRAINEUR_ADJOINT, etc.)
      const staffMember = await db.staff.findUnique({
        where: { userId },
        include: { club: true }
      })
      if (staffMember && staffMember.club) {
        clubId = staffMember.club.id
        const club = staffMember.club
        subscriptionPlan = club.subscriptionPlan || "Club"
        clubData = {
          name: club.name,
          logo: club.logo,
          creationDate: club.creationDate.toISOString(),
          address: club.address,
          stadiumName: club.stadiumName,
          stadiumCapacity: club.stadiumCapacity || "5 000 places",
          phone: club.phone || "+33 6 12 34 56 78"
        }
      } else {
        // For players
        const playerMember = await db.player.findUnique({
          where: { userId },
          include: { club: true }
        })
        if (playerMember && playerMember.club) {
          clubId = playerMember.club.id
          const club = playerMember.club
          subscriptionPlan = club.subscriptionPlan || "Club"
          clubData = {
            name: club.name,
            logo: club.logo,
            creationDate: club.creationDate.toISOString(),
            address: club.address,
            stadiumName: club.stadiumName,
            stadiumCapacity: club.stadiumCapacity || "5 000 places",
            phone: club.phone || "+33 6 12 34 56 78"
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching club details in EquipePage:", error)
  }

  // Final fallback to mock data if no club data was resolved
  if (!clubData) {
    clubData = {
      name: "EVO FC",
      logo: null,
      creationDate: "2018-05-15T00:00:00.000Z",
      address: "Paris, France",
      stadiumName: "Stade Municipal de l'Émerauderie",
      stadiumCapacity: "5 000 places",
      phone: "+33 6 12 34 56 78"
    }
  }
  // 1. Fetch Categories / Teams details
  let dbCategories: any[] = []
  if (clubId) {
    try {
      if (roleName === "ENTRAINEUR_PRINCIPAL" || roleName === "ENTRAINEUR_ADJOINT") {
        const staff = await db.staff.findUnique({
          where: { userId },
          include: { categories: true }
        })
        const categoryIds = staff?.categories.map(c => c.id) || []
        dbCategories = await db.teamCategory.findMany({
          where: { id: { in: categoryIds } },
          include: { 
            staffMembers: { include: { user: true } },
            _count: { select: { players: true } }
          },
          orderBy: { createdAt: "asc" }
        })
      } else {
        dbCategories = await db.teamCategory.findMany({
          where: { clubId },
          include: { 
            staffMembers: { include: { user: true } },
            _count: { select: { players: true } }
          },
          orderBy: { createdAt: "asc" }
        })
      }
    } catch (e) {
      console.error("Error loading team categories:", e)
    }
  } else {
    // Mock category fallback for mock club
    dbCategories = []
  }

  let categories = dbCategories.map(cat => {
    const coaches = cat.staffMembers
      ? cat.staffMembers.filter((sm: any) => {
          const roleName = sm.user?.role?.name || ""
          const title = sm.title || ""
          return (
            roleName.startsWith("ENTRAINEUR") ||
            title.toLowerCase().includes("entraineur") ||
            title.toLowerCase().includes("entraîneur") ||
            title.toLowerCase().includes("coach")
          )
        })
      : []

    const assignedCoach = coaches.length > 0
      ? coaches.map((sm: any) => sm.user?.name).filter(Boolean).join(", ")
      : (cat.coach || "Non attribué")

    return {
      id: cat.id,
      name: cat.name,
      coach: assignedCoach,
      league: cat.league,
      maxPlayers: cat.maxPlayers !== undefined ? cat.maxPlayers : (cat.playersCount || 0),
      playerCount: cat._count?.players || 0,
      color: cat.name.includes("Séniors A") ? "border-emerald-500 bg-emerald-50/10" :
             cat.name.includes("Séniors B") ? "border-teal-500 bg-teal-50/10" :
             cat.name.includes("U19") ? "border-blue-500 bg-blue-5/10" :
             "border-purple-500 bg-purple-5/10"
    }
  })

  // 2. Fetch Staff roles and counts dynamically
  const roleMap: Record<string, string> = {
    PRESIDENT: "Président",
    DIRECTEUR_SPORTIF: "Directeur Sportif",
    SECRETAIRE_GENERAL: "Secrétaire Général",
    ENTRAINEUR_PRINCIPAL: "Entraîneur Principal",
    ENTRAINEUR_ADJOINT: "Entraîneur Adjoint",
    PREPARATEUR_PHYSIQUE: "Préparateur Physique",
    ENTRAINEUR_GARDIENS: "Entraîneur des Gardiens",
    MEDECIN: "Médecin du Club",
  }

  let staffRoles = [
    { roleName: "Président", count: 1, names: [session.user.name || "Président"] }
  ]

  let totalStaffCount = 1

  if (clubId) {
    try {
      const dbStaff = await db.staff.findMany({
        where: { clubId },
        include: { user: { include: { role: true } } }
      })

      // Fetch the president (owner) user of this club
      const clubOwner = await db.user.findFirst({
        where: {
          OR: [
            { clubRequest: { status: "APPROVED", clubName: clubData.name } },
            { club: { id: clubId } }
          ]
        }
      })

      const groups: Record<string, { count: number; names: string[] }> = {
        "Président": {
          count: clubOwner ? 1 : 0,
          names: clubOwner ? [clubOwner.name || "Président"] : []
        }
      }

      // Initialize all roles
      Object.values(roleMap).forEach(title => {
        if (title !== "Président") {
          groups[title] = { count: 0, names: [] }
        }
      })

      // Group staff members from database
      dbStaff.forEach(member => {
        const roleLabel = member.title || (member.user.role ? roleMap[member.user.role.name] : null) || "Autre Rôle"
        if (!groups[roleLabel]) {
          groups[roleLabel] = { count: 0, names: [] }
        }
        groups[roleLabel].count += 1
        if (member.user.name) {
          groups[roleLabel].names.push(member.user.name)
        }
      })

      // Map back to format
      staffRoles = Object.entries(groups)
        .map(([roleName, data]) => ({
          roleName,
          count: data.count,
          names: data.names
        }))
        .filter(g => g.count > 0)

      totalStaffCount = staffRoles.reduce((sum, item) => sum + item.count, 0)
    } catch (e) {
      console.error("Error fetching db staff roles:", e)
    }
  }

  return (
    <EquipeClient
      club={clubData}
      categories={categories}
      staffRoles={staffRoles}
      totalStaffCount={totalStaffCount}
      canEdit={canEdit}
      subscriptionPlan={subscriptionPlan}
    />
  )
}
