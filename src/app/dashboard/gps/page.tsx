import { auth } from "@/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import GPSClient from "@/components/GPSClient"

export default async function GPSPage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const userRole = session.user.role?.name || ""

  const ALLOWED_STAFF_ROLES = [
    "PRESIDENT",
    "MANAGER_EVO_SPORTS",
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "PREPARATEUR_PHYSIQUE"
  ]

  if (!ALLOWED_STAFF_ROLES.includes(userRole)) {
    redirect("/dashboard")
  }

  let clubId = ""
  const staff = await db.staff.findUnique({
    where: { userId }
  })
  const club = await db.club.findFirst({
    where: {
      OR: [
        { presidentId: userId },
        { staff: { some: { userId } } }
      ]
    }
  })
  clubId = club?.id || staff?.clubId || ""

  // If MANAGER_EVO_SPORTS, they might bypass but let's grab a default club if none
  if (!clubId && userRole === "MANAGER_EVO_SPORTS") {
    const firstClub = await db.club.findFirst()
    clubId = firstClub?.id || ""
  }

  if (!clubId) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
        Vous n&apos;avez pas de club associé à votre compte. Veuillez contacter votre administrateur.
      </div>
    )
  }

  let categories = []
  let players = []
  let gpsRecordsData: any[] = []

  if (userRole === "ENTRAINEUR_PRINCIPAL" || userRole === "ENTRAINEUR_ADJOINT") {
    const staffProfile = await db.staff.findUnique({
      where: { userId },
      include: { categories: true }
    })
    const categoryIds = staffProfile?.categories.map((c) => c.id) || []

    categories = await db.teamCategory.findMany({
      where: { id: { in: categoryIds } },
      orderBy: { name: "asc" }
    })

    players = await db.player.findMany({
      where: { clubId, teamCategoryId: { in: categoryIds } },
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { name: true } },
        teamCategory: true
      }
    })

    gpsRecordsData = await db.playerGPSData.findMany({
      where: { player: { clubId, teamCategoryId: { in: categoryIds } } },
      orderBy: { date: "desc" },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            teamCategory: true
          }
        },
        event: true
      }
    })
  } else {
    categories = await db.teamCategory.findMany({
      where: { clubId },
      orderBy: { name: "asc" }
    })

    players = await db.player.findMany({
      where: { clubId },
      orderBy: { user: { name: "asc" } },
      include: {
        user: { select: { name: true } },
        teamCategory: true
      }
    })

    gpsRecordsData = await db.playerGPSData.findMany({
      where: { player: { clubId } },
      orderBy: { date: "desc" },
      include: {
        player: {
          include: {
            user: { select: { name: true } },
            teamCategory: true
          }
        },
        event: true
      }
    })
  }

  // Fetch events for dropdown linking (MATCH or TRAINING)
  const events = await db.calendarEvent.findMany({
    where: { clubId, type: { in: ["MATCH", "TRAINING"] } },
    orderBy: [
      { date: "desc" },
      { time: "desc" }
    ]
  })

  // Clean and map data for client component
  const clientCategories = categories.map((c) => ({
    id: c.id,
    name: c.name
  }))

  const clientPlayers = players.map((p) => ({
    id: p.id,
    name: p.user?.name || "Joueur sans nom",
    teamCategoryId: p.teamCategoryId,
    teamCategoryName: p.teamCategory?.name || "Sans équipe",
    number: p.number,
    age: p.age,
    position: p.position
  }))

  const clientEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    date: e.date,
    time: e.time
  }))

  const clientRecords = gpsRecordsData.map((r: any) => ({
    id: r.id,
    playerId: r.playerId,
    playerName: r.player?.user?.name || "Joueur",
    playerCategoryName: r.player?.teamCategory?.name || "Sans équipe",
    playerCategoryId: r.player?.teamCategoryId || null,
    playerNumber: r.player?.number || null,
    playerAge: r.player?.age || null,
    playerPosition: r.player?.position || null,
    eventId: r.eventId,
    eventTitle: r.event?.title || null,
    eventType: r.event?.type || null,
    date: r.date.toISOString(),
    createdAt: r.createdAt.toISOString(),

    // Metrics
    distanceTotal: r.distanceTotal,
    hsrDistance: r.hsrDistance,
    sprintDistance: r.sprintDistance,
    accelerations: r.accelerations,
    decelerations: r.decelerations,
    vMax: r.vMax,
    avgHeartRate: r.avgHeartRate,
    peakHeartRate: r.peakHeartRate,
    redZoneTime: r.redZoneTime,

    xG: r.xG,
    xA: r.xA,
    progressivePasses: r.progressivePasses,
    successUnderPressure: r.successUnderPressure,
    duelsWon: r.duelsWon,
    turnovers: r.turnovers,
    recoveries: r.recoveries,

    ppda: r.ppda,
    compacity: r.compacity,
    reactionTime: r.reactionTime,
    heatmapX: r.heatmapX,
    heatmapY: r.heatmapY,

    acwr: r.acwr,
    asymmetry: r.asymmetry,
    neuromuscularFatigue: r.neuromuscularFatigue
  }))

  // Fetch all registered GPS Devices
  const gpsDevices = await db.gpsDevice.findMany({
    include: {
      player: {
        include: {
          user: { select: { name: true } }
        }
      }
    },
    orderBy: { id: "asc" }
  })

  const clientGpsDevices = gpsDevices.map((d) => ({
    id: d.id,
    battery: d.battery,
    playerId: d.playerId,
    playerName: d.player?.user?.name || null
  }))

  return (
    <GPSClient
      categories={clientCategories}
      players={clientPlayers}
      events={clientEvents}
      records={clientRecords}
      gpsDevices={clientGpsDevices}
    />
  )
}
