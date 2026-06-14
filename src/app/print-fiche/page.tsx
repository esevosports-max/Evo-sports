import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import EquipePrintClient from "@/components/EquipePrintClient"

export default async function PrintFichePage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const roleName = session.user.role?.name || "No Role"

  // Fetch Club details based on user role
  let clubData = null
  let clubId: string | null = null

  try {
    if (roleName === "PRESIDENT") {
      const club = await db.club.findUnique({
        where: { presidentId: userId }
      })

      if (club) {
        clubId = club.id
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
        const request = await db.clubRegistrationRequest.findUnique({
          where: { userId }
        })
        if (request) {
          clubData = {
            name: request.clubName,
            logo: request.clubLogo,
            creationDate: request.creationDate.toISOString(),
            address: request.address,
            stadiumName: request.stadiumName,
            stadiumCapacity: "5 000 places",
            phone: request.phone || "+33 6 12 34 56 78"
          }
        }
      }
    } else if (roleName === "MANAGER_EVO_SPORTS") {
      const club = await db.club.findFirst()
      if (club) {
        clubId = club.id
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
      const staffMember = await db.staff.findUnique({
        where: { userId },
        include: { club: true }
      })
      if (staffMember && staffMember.club) {
        clubId = staffMember.club.id
        const club = staffMember.club
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
        const playerMember = await db.player.findUnique({
          where: { userId },
          include: { club: true }
        })
        if (playerMember && playerMember.club) {
          clubId = playerMember.club.id
          const club = playerMember.club
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
    console.error("Error fetching club details in PrintFichePage:", error)
  }

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

  // Fetch Categories
  let dbCategories: any[] = []
  if (clubId) {
    try {
      dbCategories = await db.teamCategory.findMany({
        where: { clubId },
        include: { 
          staffMembers: { include: { user: true } },
          _count: { select: { players: true } }
        },
        orderBy: { createdAt: "asc" }
      })
    } catch (e) {
      console.error("Error loading team categories in print-fiche:", e)
    }
  } else {
    dbCategories = []
  }

  const categories = dbCategories.map(cat => {
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
      name: cat.name,
      coach: assignedCoach,
      league: cat.league,
      maxPlayers: cat.maxPlayers !== undefined ? cat.maxPlayers : (cat.playersCount || 0),
      playerCount: cat._count?.players || 0
    }
  })

  // Fetch Staff roles
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

      Object.values(roleMap).forEach(title => {
        if (title !== "Président") {
          groups[title] = { count: 0, names: [] }
        }
      })

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
    <EquipePrintClient
      club={clubData}
      categories={categories}
      staffRoles={staffRoles}
      totalStaffCount={totalStaffCount}
    />
  )
}
