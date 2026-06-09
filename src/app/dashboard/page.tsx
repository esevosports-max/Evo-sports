import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ROLE_LABELS } from "@/lib/rbac"
import { db } from "@/lib/db"
import ManagerRequestsList from "@/components/ManagerRequestsList"
import DashboardSummaryClient from "@/components/DashboardSummaryClient"

export default async function Dashboard() {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  const user = session.user
  const roleName = user.role?.name || "No Role assigned"
  const userPermissions = user.role?.permissions || []

  // Check registration status for Presidents
  if (roleName === "PRESIDENT") {
    const request = await db.clubRegistrationRequest.findUnique({
      where: { userId: user.id },
    })

    if (!request) {
      redirect("/complete-registration")
    }

    if (request.status !== "APPROVED") {
      redirect("/waiting-validation")
    }
  }

  // Check subscription status
  let isRestricted = false
  if (roleName === "PRESIDENT") {
    const userClub = await db.club.findUnique({
      where: { presidentId: user.id }
    })
    if (userClub) {
      const status = userClub.subscriptionStatus || ""
      const expires = userClub.subscriptionExpires
      const now = new Date()
      
      const isExpired = expires && new Date(expires) < now
      const isBlocked = status === "Bloqué" || status === "Expiré"
      const isPending = status === "EnAttente" || status === "En attente"
      
      if (isBlocked || isExpired || isPending) {
        isRestricted = true
      }
    }
  } else if (roleName !== "MANAGER_EVO_SPORTS") {
    let userClub = null
    const staffMember = await db.staff.findUnique({
      where: { userId: user.id },
      include: { club: true }
    })
    if (staffMember && staffMember.club) {
      userClub = staffMember.club
    } else {
      const playerMember = await db.player.findUnique({
        where: { userId: user.id },
        include: { club: true }
      })
      if (playerMember && playerMember.club) {
        userClub = playerMember.club
      }
    }

    if (userClub) {
      const status = userClub.subscriptionStatus || ""
      const expires = userClub.subscriptionExpires
      const now = new Date()
      
      const isExpired = expires && new Date(expires) < now
      const isBlocked = status === "Bloqué" || status === "Expiré"
      const isPending = status === "EnAttente" || status === "En attente"
      
      if (isBlocked || isExpired || isPending) {
        isRestricted = true
      }
    }
  }

  if (isRestricted) {
    redirect("/dashboard/paiement")
  }
  
  // Custom French label
  const roleLabel = ROLE_LABELS[roleName as keyof typeof ROLE_LABELS] || roleName

  // Tailored color gradients for each of the 9 football club roles
  const roleGradients: Record<string, string> = {
    MANAGER_EVO_SPORTS: "from-emerald-600 via-teal-500 to-cyan-500 text-white shadow-emerald-500/25",
    PRESIDENT: "from-red-600 via-orange-500 to-amber-500 text-white shadow-orange-500/25",
    DIRECTEUR_SPORTIF: "from-amber-500 via-yellow-500 to-orange-400 text-zinc-950 shadow-yellow-500/25",
    SECRETAIRE_GENERAL: "from-teal-500 via-cyan-500 to-blue-500 text-white shadow-cyan-500/25",
    ENTRAINEUR_PRINCIPAL: "from-blue-600 via-indigo-600 to-purple-600 text-white shadow-indigo-600/25",
    ENTRAINEUR_ADJOINT: "from-indigo-500 via-purple-500 to-pink-500 text-white shadow-purple-500/25",
    PREPARATEUR_PHYSIQUE: "from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-pink-500/25",
    ENTRAINEUR_GARDIENS: "from-orange-500 to-yellow-500 text-white shadow-orange-500/25",
    MEDECIN: "from-rose-600 to-red-500 text-white shadow-rose-500/25",
    JOUEUR: "from-emerald-500 to-green-500 text-white shadow-emerald-500/25",
  }

  const currentGradient = roleGradients[roleName] || "from-zinc-500 to-zinc-700 text-white"

  // Fetch pending/all requests if MANAGER_EVO_SPORTS
  let initialRequests: unknown[] = []
  let subscriptionData = null
  let metricsData = null

  if (roleName === "MANAGER_EVO_SPORTS") {
    initialRequests = await db.clubRegistrationRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })
  } else {
    let userClub = null
    if (roleName === "PRESIDENT") {
      userClub = await db.club.findUnique({
        where: { presidentId: user.id }
      })
    } else {
      const staffMember = await db.staff.findUnique({
        where: { userId: user.id },
        include: { club: true }
      })
      if (staffMember && staffMember.club) {
        userClub = staffMember.club
      } else {
        const playerMember = await db.player.findUnique({
          where: { userId: user.id },
          include: { club: true }
        })
        if (playerMember && playerMember.club) {
          userClub = playerMember.club
        }
      }
    }

    if (userClub) {
      subscriptionData = {
        plan: userClub.subscriptionPlan || "Club",
        status: userClub.subscriptionStatus || "Bloqué",
        expires: userClub.subscriptionExpires ? userClub.subscriptionExpires.toISOString() : null
      }

      const clubPlayers = await db.player.findMany({
        where: { clubId: userClub.id }
      })
      const injuredCount = clubPlayers.filter(p => p.isInjured).length
      const rehabCount = clubPlayers.filter(p => p.isInjured && (
        p.injuryStatus?.toLowerCase().includes("rehab") || 
        p.injuryStatus?.toLowerCase().includes("rééduc") || 
        p.injuryStatus?.toLowerCase().includes("réath") || 
        p.injuryStatus?.toLowerCase().includes("reval")
      )).length

      metricsData = {
        teamsCount: await db.teamCategory.count({ where: { clubId: userClub.id } }),
        playersCount: clubPlayers.length,
        injuriesCount: injuredCount,
        availableCount: clubPlayers.length - injuredCount,
        unavailableCount: injuredCount - rehabCount,
        rehabCount: rehabCount,
        staffCount: await db.staff.count({ where: { clubId: userClub.id } }),
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {roleName === "MANAGER_EVO_SPORTS" ? (
        <div className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
          <ManagerRequestsList initialRequests={JSON.parse(JSON.stringify(initialRequests))} />
        </div>
      ) : (
        <DashboardSummaryClient
          user={{ name: user.name ?? null, email: user.email ?? null }}
          roleLabel={roleLabel}
          currentGradient={currentGradient}
          permissionsCount={userPermissions.length}
          subscription={subscriptionData}
          metrics={metricsData}
        />
      )}
    </div>
  )
}
