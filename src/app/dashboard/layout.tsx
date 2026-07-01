import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ROLE_LABELS } from "@/lib/rbac"
import DashboardNavbarClient from "@/components/DashboardNavbarClient"
import SubscriptionGuard from "@/components/SubscriptionGuard"
import DashboardHeaderClient from "@/components/DashboardHeaderClient"
import PushNotificationRegister from "@/components/PushNotificationRegister"
import { getClubSubscriptionFeatures } from "@/lib/subscription"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const user = session.user

  // Check if the user is deleted, blocked or modified during this active session
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { blocked: true, modifiedAt: true }
  })

  if (!dbUser) {
    redirect("/login?reason=deleted")
  }

  if (dbUser.blocked) {
    redirect("/login?reason=blocked")
  }

  if (dbUser.modifiedAt && session.user.iat) {
    const sessionTime = (session.user.iat * 1000) + 5000 // 5s grace period
    if (dbUser.modifiedAt.getTime() > sessionTime) {
      redirect("/login?reason=modified")
    }
  }
  const roleName = user.role?.name || "No Role assigned"
  const roleLabel = ROLE_LABELS[roleName as keyof typeof ROLE_LABELS] || roleName

  // Fetch Club details based on role and check subscription
  let clubName = "EVO SPORTS CLUB"
  let clubLogo: string | null = null
  let isRestricted = false
  let planFeatures = {
    hasDashboard: true,
    hasPayment: true,
    hasPlanning: true,
    hasMessaging: true,
    hasPolls: true,
    hasStructure: true,
    hasStaff: true,
    hasPlayers: true,
    hasTactical: true,
    hasTrainings: true,
    hasMatches: true,
    hasInjuries: true,
    hasMedical: true,
    hasTests: true,
    hasWelfare: true,
    hasGPS: true,
    hasRbac: true,
    hasSupport: true,
  }

  try {
    let activeClub = null

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
      
      clubName = request.clubName
      clubLogo = request.clubLogo

      activeClub = await db.club.findUnique({
        where: { presidentId: user.id }
      })
    } else if (roleName === "MANAGER_EVO_SPORTS") {
      clubName = "EVO SPORTS ADMIN"
    } else {
      // For Staff roles (DIRECTEUR_SPORTIF, ENTRAINEUR_PRINCIPAL, ENTRAINEUR_ADJOINT, PREPARATEUR_PHYSIQUE, ENTRAINEUR_GARDIENS, MEDECIN)
      const staffMember = await db.staff.findUnique({
        where: { userId: user.id },
        include: { club: true }
      })
      if (staffMember && staffMember.club) {
        activeClub = staffMember.club
      } else {
        // For players
        const playerMember = await db.player.findUnique({
          where: { userId: user.id },
          include: { club: true }
        })
        if (playerMember && playerMember.club) {
          activeClub = playerMember.club
        }
      }
    }

    if (activeClub) {
      clubName = activeClub.name
      clubLogo = activeClub.logo

      const status = activeClub.subscriptionStatus || ""
      const expires = activeClub.subscriptionExpires
      const now = new Date()
      
      const isExpired = expires && new Date(expires) < now
      const isBlocked = status === "Bloqué" || status === "Expiré"
      const isPending = status === "EnAttente" || status === "En attente"
      
      if (isBlocked || isExpired || isPending) {
        isRestricted = true
      }

      // Fetch subscription plan features
      if (activeClub.subscriptionPlan) {
        planFeatures = await getClubSubscriptionFeatures(activeClub)
      }
    }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      (("digest" in error && typeof (error as { digest?: string }).digest === "string" && (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) ||
       ("message" in error && (error as { message?: string }).message === "NEXT_REDIRECT"))
    ) {
      throw error
    }
    console.error("Error fetching club details in layout:", error)
  }

  // Gradient themes for each role
  const roleGradients: Record<string, string> = {
    MANAGER_EVO_SPORTS: "from-emerald-600 to-cyan-500 text-white shadow-emerald-500/25",
    PRESIDENT: "from-red-600 via-orange-500 to-amber-500 text-white shadow-orange-500/25",
    DIRECTEUR_SPORTIF: "from-amber-500 to-orange-400 text-zinc-950 shadow-yellow-500/25",
    SECRETAIRE_GENERAL: "from-teal-500 to-blue-500 text-white shadow-cyan-500/25",
    ENTRAINEUR_PRINCIPAL: "from-blue-600 to-purple-600 text-white shadow-indigo-600/25",
    ENTRAINEUR_ADJOINT: "from-indigo-500 to-pink-500 text-white shadow-purple-500/25",
    PREPARATEUR_PHYSIQUE: "from-fuchsia-500 to-rose-500 text-white shadow-pink-500/25",
    ENTRAINEUR_GARDIENS: "from-orange-500 to-yellow-500 text-white shadow-orange-500/25",
    MEDECIN: "from-rose-600 to-red-500 text-white shadow-rose-500/25",
    JOUEUR: "from-emerald-500 to-green-500 text-white shadow-emerald-500/25",
  }

  const currentGradient = roleGradients[roleName] || "from-zinc-500 to-zinc-700 text-white"

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">
      {/* Top Navbar Component */}
      <DashboardNavbarClient
        user={{
          name: user.name || "Utilisateur",
          email: user.email || "",
          roleLabel,
          roleGradient: currentGradient,
          roleName,
        }}
        club={{
          name: clubName,
          logo: clubLogo,
          ...planFeatures,
        }}
        isRestricted={isRestricted}
        signOutAction={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-white">
        <main className="flex-1 p-4 sm:p-8 lg:p-10 transition-all duration-300">
          <SubscriptionGuard 
            isRestricted={isRestricted} 
            roleName={roleName} 
            clubName={clubName} 
            {...planFeatures}
          />
          <div className="max-w-7xl mx-auto w-full bg-white space-y-6">
            
            <DashboardHeaderClient userName={user.name || "madjid beghdadi"} roleLabel={roleLabel} roleName={roleName} />

            <PushNotificationRegister />

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
