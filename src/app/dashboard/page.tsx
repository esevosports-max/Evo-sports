import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ROLE_LABELS } from "@/lib/rbac"
import { db } from "@/lib/db"
import ManagerRequestsList from "@/components/ManagerRequestsList"
import DashboardSummaryClient from "@/components/DashboardSummaryClient"
import PlayerDashboardClient from "@/components/PlayerDashboardClient"
import CoachDashboardClient from "@/components/CoachDashboardClient"
import { getPolls } from "@/app/dashboard/sondage/actions"

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

  // If role is JOUEUR, render the dedicated player dashboard directly
  if (roleName === "JOUEUR") {
    const playerProfile = await db.player.findUnique({
      where: { userId: user.id },
      include: { teamCategory: true, user: true }
    })

    if (!playerProfile) {
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
          Profil joueur introuvable. Veuillez contacter votre administrateur.
        </div>
      )
    }

    const clubId = playerProfile.clubId
    const teamCategoryId = playerProfile.teamCategoryId
    const teamCategoryName = playerProfile.teamCategory?.name || null

    // Format local timezone YYYY-MM-DD
    const localDate = new Date()
    const offset = localDate.getTimezoneOffset()
    const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000))
    const todayStr = adjustedDate.toISOString().split('T')[0]

    let eventWhereClause: any = {
      clubId,
      date: todayStr,
      status: {
        notIn: ["TERMINE", "N_A"]
      }
    }
    if (teamCategoryName) {
      eventWhereClause.OR = [
        { assignedTeam: teamCategoryName },
        { assignedTeam: null }
      ]
    } else {
      eventWhereClause.assignedTeam = null
    }

    const todayEvents = await db.calendarEvent.findMany({
      where: eventWhereClause,
      orderBy: { time: "asc" }
    })

    const activeQuestionnaires = await db.dailyQuestionnaire.findMany({
      where: {
        clubId,
        active: true,
        scheduledFor: { lte: new Date() },
        expiresAt: { gt: new Date() },
        OR: [
          { teamCategoryId: null },
          { teamCategoryId }
        ]
      },
      include: {
        responses: {
          where: { playerId: playerProfile.id }
        }
      }
    })
    const pendingQuestionnaires = activeQuestionnaires.filter(q => q.responses.length === 0)

    const latestPhysicalTest = await db.physicalTest.findFirst({
      where: { playerId: playerProfile.id },
      orderBy: { createdAt: "desc" }
    })

    const channels = await db.chatChannel.findMany({
      where: { clubId }
    })

    const accessibleChannels = channels.filter(channel => {
      if (channel.creatorId === user.id) return true
      if (!channel.isPrivate && !channel.isCustom) return true
      if (channel.isCustom) {
        const targetUserIds = channel.targetUserIds as string[] | null
        return targetUserIds && targetUserIds.includes(user.id)
      }
      if (channel.isPrivate && !channel.isCustom) {
        const targetRoles = channel.targetRoles as string[] | null
        if (targetRoles && targetRoles.includes("JOUEUR")) return true
        const targetTeams = channel.targetTeams as string[] | null
        if (targetTeams && teamCategoryId && targetTeams.includes(teamCategoryId)) return true
      }
      return false
    })

    const unreadMessagesList = []
    for (const channel of accessibleChannels) {
      const msgs = await db.chatMessage.findMany({
        where: {
          channelId: channel.id,
          senderId: { not: user.id },
          views: {
            none: {
              userId: user.id
            }
          }
        },
        orderBy: { createdAt: "desc" }
      })
      for (const m of msgs) {
        unreadMessagesList.push({
          id: m.id,
          senderName: m.senderName,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
          channelName: channel.name
        })
      }
    }

    unreadMessagesList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Fetch active polls for the user
    const pollsRes = await getPolls()
    const activePolls = pollsRes.success
      ? (pollsRes.polls || []).filter((p: any) => p.status === "ACTIVE")
      : []

    // Fetch composition and players in category
    let compositionData = null
    let categoryPlayersData: any[] = []

    if (teamCategoryId) {
      const dbComposition = await db.composition.findUnique({
        where: { teamCategoryId }
      })

      if (dbComposition && dbComposition.isCommunicated) {
        compositionData = {
          formation: dbComposition.formation as any,
          slots: dbComposition.slots as any,
          substitutes: dbComposition.substitutes as any,
          communicatedAt: dbComposition.communicatedAt ? dbComposition.communicatedAt.toISOString() : null
        }

        const categoryPlayers = await db.player.findMany({
          where: { teamCategoryId },
          include: { user: true }
        })

        categoryPlayersData = categoryPlayers.map(p => ({
          id: p.id,
          name: p.user?.name || "Joueur Inconnu",
          number: p.number || 0,
          position: p.position || "Milieu"
        }))
      }
    }

    return (
      <PlayerDashboardClient
        playerProfile={{
          id: playerProfile.id,
          name: playerProfile.user?.name || user.name || "Joueur",
          position: playerProfile.position,
          number: playerProfile.number,
          teamCategoryName
        }}
        todayEvents={todayEvents.map(evt => ({
          id: evt.id,
          title: evt.title,
          type: evt.type,
          time: evt.time,
          location: evt.location,
          details: evt.details,
          status: evt.status
        }))}
        pendingQuestionnaires={pendingQuestionnaires.map(q => ({
          id: q.id,
          expiresAt: q.expiresAt.toISOString()
        }))}
        latestPhysicalTest={latestPhysicalTest ? {
          vma: latestPhysicalTest.vma,
          vo2Max: latestPhysicalTest.vo2Max,
          sprint10m: latestPhysicalTest.sprint10m,
          sprint30m: latestPhysicalTest.sprint30m,
          cmj: latestPhysicalTest.cmj,
          sj: latestPhysicalTest.sj,
          illinois: latestPhysicalTest.illinois,
          fat: latestPhysicalTest.fat,
          date: latestPhysicalTest.date.toISOString()
        } : null}
        unreadMessages={unreadMessagesList}
        activePolls={activePolls}
        composition={compositionData}
        categoryPlayers={categoryPlayersData}
      />
    )
  }

  if (["ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "ENTRAINEUR_GARDIENS"].includes(roleName)) {
    const staffProfile = await db.staff.findUnique({
      where: { userId: user.id },
      include: { categories: true, club: true }
    })

    if (!staffProfile) {
      return (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
          Profil technique introuvable. Veuillez contacter votre administrateur.
        </div>
      )
    }

    const clubId = staffProfile.clubId
    const categoryIds = staffProfile.categories.map(c => c.id)
    const categoryNames = staffProfile.categories.map(c => c.name)

    // Fetch players in the coach's categories
    const players = await db.player.findMany({
      where: {
        teamCategoryId: { in: categoryIds }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { number: "asc" }
    })

    // Fetch matches for these categories
    const matches = await db.calendarEvent.findMany({
      where: {
        clubId,
        type: "MATCH",
        assignedTeam: { in: categoryNames }
      },
      orderBy: [
        { date: "desc" },
        { time: "desc" }
      ]
    })

    // Fetch training sessions for these categories
    const trainings = await db.calendarEvent.findMany({
      where: {
        clubId,
        type: "TRAINING",
        assignedTeam: { in: categoryNames }
      },
      orderBy: [
        { date: "desc" },
        { time: "desc" }
      ]
    })

    // Fetch daily questionnaires
    const dailyQuestionnaires = await db.dailyQuestionnaire.findMany({
      where: {
        clubId,
        teamCategoryId: { in: categoryIds }
      },
      include: {
        teamCategory: true,
        responses: {
          select: {
            id: true
          }
        }
      },
      orderBy: { scheduledFor: "desc" }
    })

    // Fetch all polls in the club and filter for this coach's categories in JS
    const allPolls = await db.poll.findMany({
      where: {
        clubId
      },
      include: {
        options: true,
        votes: true
      },
      orderBy: { createdAt: "desc" }
    })

    const polls = allPolls.filter(poll => {
      if (!poll.targetTeams) return true
      try {
        const targetTeamsList = poll.targetTeams as string[]
        return targetTeamsList.some(id => categoryIds.includes(id))
      } catch {
        return true
      }
    })

    // Fetch physical tests for players in this coach's categories
    const physicalTests = await db.physicalTest.findMany({
      where: {
        playerId: { in: players.map(p => p.id) }
      },
      include: {
        player: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { date: "desc" }
    })

    return (
      <CoachDashboardClient
        roleName={roleName}
        clubLogo={staffProfile.club?.logo || null}
        categories={staffProfile.categories.map(c => ({
          id: c.id,
          name: c.name,
          league: c.league,
          coach: c.coach,
          maxPlayers: c.maxPlayers
        }))}
        players={players.map(p => ({
          id: p.id,
          name: p.user?.name || "Joueur sans nom",
          email: p.user?.email || "",
          position: p.position || "Non spécifié",
          number: p.number,
          age: p.age,
          height: p.height,
          weight: p.weight,
          foot: p.foot,
          isInjured: p.isInjured,
          injuryType: p.injuryType,
          injurySeverity: p.injurySeverity,
          injuryDuration: p.injuryDuration,
          injuryDate: p.injuryDate ? p.injuryDate.toISOString() : null,
          injuryReturn: p.injuryReturn ? p.injuryReturn.toISOString() : null,
          injuryStatus: p.injuryStatus,
          injuryProgress: p.injuryProgress
        }))}
        matches={matches.map(m => ({
          id: m.id,
          title: m.title,
          location: m.location,
          stadiumName: m.location === "Domicile" ? "Terrain EVO" : m.location,
          date: m.date,
          time: m.time,
          status: m.status,
          score: m.score,
          assignedTeam: m.assignedTeam
        }))}
        trainings={trainings.map(t => ({
          id: t.id,
          title: t.title,
          date: t.date,
          time: t.time,
          location: t.location,
          details: t.details,
          status: t.status,
          assignedTeam: t.assignedTeam
        }))}
        dailyQuestionnaires={dailyQuestionnaires.map(q => ({
          id: q.id,
          teamCategoryName: q.teamCategory?.name || "Tous",
          scheduledFor: q.scheduledFor.toISOString(),
          expiresAt: q.expiresAt.toISOString(),
          active: q.active,
          responsesCount: q.responses.length
        }))}
        polls={polls.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          expiresAt: p.expiresAt.toISOString(),
          totalVotes: p.votes.length,
          options: p.options.map(o => ({
            id: o.id,
            text: o.text,
            votesCount: p.votes.filter(v => v.optionId === o.id).length
          }))
        }))}
        physicalTests={physicalTests.map(pt => ({
          id: pt.id,
          playerName: pt.player.user?.name || "Joueur",
          vma: pt.vma,
          vo2Max: pt.vo2Max,
          sprint10m: pt.sprint10m,
          sprint30m: pt.sprint30m,
          cmj: pt.cmj,
          sj: pt.sj,
          illinois: pt.illinois,
          fat: pt.fat,
          date: pt.date.toISOString()
        }))}
      />
    )
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
