"use client"

import { useState, useTransition, useMemo } from "react"
import { saveEventAttendanceAction } from "@/app/dashboard/presence/actions"
import { useLanguage } from "@/components/LanguageProvider"

interface TeamCategory {
  id: string
  name: string
}

interface User {
  name: string | null
  email: string | null
}

interface Player {
  id: string
  userId: string
  position: string | null
  number: number | null
  teamCategoryId: string | null
  teamCategory: TeamCategory | null
  user: User
}

interface CalendarEvent {
  id: string
  title: string
  type: string
  date: string
  time: string
  location: string
  assignedTeam: string | null
}

interface PresenceRecord {
  id: string
  playerId: string
  eventId: string
  eventType: string
  status: "PRESENT" | "ABSENT"
  date: string
}

interface PresenceClientProps {
  initialPlayers: Player[]
  initialEvents: CalendarEvent[]
  initialPresences: PresenceRecord[]
  initialTeamCategories: TeamCategory[]
  roleName: string
}

export default function PresenceClient({
  initialPlayers,
  initialEvents,
  initialPresences,
  initialTeamCategories,
  roleName
}: PresenceClientProps) {
  const { language } = useLanguage()
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    initialEvents.filter((e) => e.type === "MATCH" || e.type === "TRAINING")
  )
  const [presences, setPresences] = useState<PresenceRecord[]>(initialPresences)
  const [teamCategories] = useState<TeamCategory[]>(initialTeamCategories)

  const [isPending, startTransition] = useTransition()

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeamId, setSelectedTeamId] = useState<string>("ALL")
  const [activeTab, setActiveTab] = useState<"players" | "events">("players")

  // Modal State for taking attendance
  const [markingEvent, setMarkingEvent] = useState<CalendarEvent | null>(null)
  const [modalAttendances, setModalAttendances] = useState<Record<string, "PRESENT" | "ABSENT">>({})

  // Determine permissions
  const canManage = [
    "PRESIDENT",
    "MANAGER_EVO_SPORTS",
    "DIRECTEUR_SPORTIF",
    "SECRETAIRE_GENERAL",
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "PREPARATEUR_PHYSIQUE",
    "ENTRAINEUR_GARDIENS",
    "MEDECIN"
  ].includes(roleName)

  // Categorize event type label
  const getEventCategory = (type: string): "MATCH" | "TRAINING" | "CONVOCATION" => {
    if (type === "MATCH") return "MATCH"
    if (type === "TRAINING") return "TRAINING"
    return "CONVOCATION" // meeting, medical exam, excursion, physical test, reunion
  }

  // Get readable event type name
  const getEventTypeName = (type: string) => {
    switch (type) {
      case "MATCH": return "Match ⚽"
      case "TRAINING": return "Entraînement 🏃‍♂️"
      case "MEETING": return "Réunion 🤝"
      case "EXCURSION": return "Excursion 🚌"
      case "MEDICAL_EXAM": return "Examen Médical 🩺"
      default: return "Convocation 📋"
    }
  }

  // Set of eventIds that have at least one attendance record
  const eventsWithAttendance = useMemo(() => {
    const set = new Set<string>()
    presences.forEach((p) => set.add(p.eventId))
    return set
  }, [presences])

  // Group presences by eventId and playerId for quick lookup
  const presenceMap = useMemo(() => {
    const map = new Map<string, "PRESENT" | "ABSENT">()
    presences.forEach((p) => {
      map.set(`${p.eventId}_${p.playerId}`, p.status)
    })
    return map
  }, [presences])

  // Compute attendance stats per player
  const playerStats = useMemo(() => {
    return players.map((player) => {
      let matchPresent = 0
      let matchTotal = 0
      let trainingPresent = 0
      let trainingTotal = 0

      // Filter events relevant to this player (assigned to their team category, or to all teams)
      events.forEach((event) => {
        const isRelevant =
          !event.assignedTeam ||
          (player.teamCategory && event.assignedTeam === player.teamCategory.name)

        // Only count events where attendance has actually been marked
        if (isRelevant && eventsWithAttendance.has(event.id)) {
          const category = getEventCategory(event.type)
          const status = presenceMap.get(`${event.id}_${player.id}`)

          if (category === "MATCH") {
            matchTotal++
            if (status === "PRESENT") matchPresent++
          } else if (category === "TRAINING") {
            trainingTotal++
            if (status === "PRESENT") trainingPresent++
          }
        }
      })

      const totalConvoked = matchTotal + trainingTotal
      const totalPresent = matchPresent + trainingPresent
      const rate = totalConvoked > 0 ? (totalPresent / totalConvoked) * 100 : 100

      return {
        player,
        matchPresent,
        matchTotal,
        trainingPresent,
        trainingTotal,
        totalPresent,
        totalConvoked,
        rate
      }
    })
  }, [players, events, eventsWithAttendance, presenceMap])

  // Compute club global score
  const globalStats = useMemo(() => {
    let grandTotalConvoked = 0
    let grandTotalPresent = 0
    let matchConvoked = 0
    let matchPresent = 0
    let trainingConvoked = 0
    let trainingPresent = 0

    playerStats.forEach((stat) => {
      grandTotalConvoked += stat.totalConvoked
      grandTotalPresent += stat.totalPresent
      matchConvoked += stat.matchTotal
      matchPresent += stat.matchPresent
      trainingConvoked += stat.trainingTotal
      trainingPresent += stat.trainingPresent
    })

    const globalRate = grandTotalConvoked > 0 ? (grandTotalPresent / grandTotalConvoked) * 100 : 100
    const globalScore = (globalRate / 10).toFixed(1)

    return {
      globalRate,
      globalScore,
      grandTotalConvoked,
      grandTotalPresent,
      matchRate: matchConvoked > 0 ? (matchPresent / matchConvoked) * 100 : 100,
      trainingRate: trainingConvoked > 0 ? (trainingPresent / trainingConvoked) * 100 : 100
    }
  }, [playerStats])

  // Filtered players list
  const filteredPlayerStats = useMemo(() => {
    return playerStats.filter((stat) => {
      const p = stat.player
      const matchesSearch =
        p.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user.email?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTeam = selectedTeamId === "ALL" || p.teamCategoryId === selectedTeamId

      return matchesSearch && matchesTeam
    })
  }, [playerStats, searchTerm, selectedTeamId])

  // Open attendance modal for an event
  const handleOpenAttendanceModal = (event: CalendarEvent) => {
    setMarkingEvent(event)

    // Find players assigned to this event's team category (or all players if assignedTeam is empty)
    const relevantPlayers = players.filter((p) => {
      return !event.assignedTeam || (p.teamCategory && p.teamCategory.name === event.assignedTeam)
    })

    const initialMap: Record<string, "PRESENT" | "ABSENT"> = {}
    relevantPlayers.forEach((p) => {
      const existingStatus = presenceMap.get(`${event.id}_${p.id}`)
      initialMap[p.id] = existingStatus || "PRESENT" // Default to present
    })

    setModalAttendances(initialMap)
  }

  // Save attendance from modal
  const handleSaveAttendance = () => {
    if (!markingEvent) return

    const attendancesArray = Object.entries(modalAttendances).map(([playerId, status]) => ({
      playerId,
      status
    }))

    startTransition(async () => {
      const res = await saveEventAttendanceAction({
        eventId: markingEvent.id,
        eventType: getEventCategory(markingEvent.type),
        dateStr: markingEvent.date,
        attendances: attendancesArray
      })

      if (res.success) {
        // Optimistically update presence state locally
        const updatedPresences = presences.filter(
          (p) => !(p.eventId === markingEvent.id && p.eventType === getEventCategory(markingEvent.type))
        )
        const newRecords: PresenceRecord[] = attendancesArray.map((att) => ({
          id: `${markingEvent.id}_${att.playerId}`,
          playerId: att.playerId,
          eventId: markingEvent.id,
          eventType: getEventCategory(markingEvent.type),
          status: att.status,
          date: markingEvent.date
        }))
        setPresences([...updatedPresences, ...newRecords])
        setMarkingEvent(null)
      } else {
        alert(res.error || "Erreur lors de la sauvegarde")
      }
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
            📊 Suivi des Présences
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed max-w-2xl">
            Suivez en temps réel le taux de présence et d&apos;absence des joueurs pour l&apos;ensemble des activités du club : entraînements, matchs, examens médicaux, réunions, excursions et tests.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("players")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === "players"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
                : "bg-white text-zinc-650 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            Joueurs
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all border ${
              activeTab === "events"
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-sm"
                : "bg-white text-zinc-650 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-350 dark:hover:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            Événements
          </button>
        </div>
      </section>

      {/* Global Club Score & Category metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Global Club Note Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Note Globale Club</p>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white">{globalStats.globalScore}/10</h3>
            <div className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${Number(globalStats.globalScore) >= 7.5 ? "bg-emerald-500" : Number(globalStats.globalScore) >= 5 ? "bg-amber-500" : "bg-red-500"}`} />
              <p className="text-[9px] text-zinc-500 font-bold uppercase">{globalStats.globalRate.toFixed(1)}% de présence</p>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0 font-bold">
            📈
          </div>
        </div>

        {/* Match Attendance Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Taux Matchs</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{globalStats.matchRate.toFixed(1)}%</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase">Présence aux compétitions</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            ⚽
          </div>
        </div>

        {/* Training Attendance Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Taux Entraînements</p>
            <h3 className="text-2xl font-black text-zinc-900 dark:text-white">{globalStats.trainingRate.toFixed(1)}%</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase">Présence aux séances</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            🏃‍♂️
          </div>
        </div>
      </div>

      {/* ----------------- TAB: PLAYERS ----------------- */}
      {activeTab === "players" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="w-full sm:w-72 relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              />
            </div>

            <div className="w-full sm:w-56 flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Équipe:</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="ALL">Toutes les équipes</option>
                {teamCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Players Presence Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
            {filteredPlayerStats.length === 0 ? (
              <div className="text-center p-12 text-zinc-450 font-bold text-xs uppercase tracking-wider">
                Aucun joueur ne correspond à vos filtres.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-550">
                      <th className="py-4 px-6">Joueur</th>
                      <th className="py-4 px-6">Équipe</th>
                      <th className="py-4 px-6 text-center">Matchs ⚽</th>
                      <th className="py-4 px-6 text-center">Entraînements 🏃‍♂️</th>
                      <th className="py-4 px-6 text-right">Note de présence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {filteredPlayerStats.map(({ player, matchPresent, matchTotal, trainingPresent, trainingTotal, rate }) => (
                      <tr key={player.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 text-xs transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 flex items-center justify-center text-xs font-black uppercase">
                              {player.user.name?.charAt(0) || "J"}
                            </div>
                            <div>
                              <p className="font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                                {player.user.name || "Joueur sans nom"}
                              </p>
                              <p className="text-[9px] text-zinc-400">{player.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 px-2 py-0.5 text-[10px] font-black uppercase">
                            {player.teamCategory?.name || "Sans équipe"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {matchTotal > 0 ? (
                            <span className={matchPresent === matchTotal ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : ""}>
                              {matchPresent}/{matchTotal}
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-semibold">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {trainingTotal > 0 ? (
                            <span className={trainingPresent === trainingTotal ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : ""}>
                              {trainingPresent}/{trainingTotal}
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-semibold">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex flex-col items-end">
                            <span className={`text-xs font-black uppercase ${rate >= 75 ? "text-emerald-600 dark:text-emerald-400" : rate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                              {(rate / 10).toFixed(1)}/10
                            </span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase">
                              {rate.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- TAB: EVENTS ----------------- */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              📅 Historique & Planification des Activités
            </h3>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Sélectionnez un événement pour pointer ou modifier les présences de vos joueurs. Seuls les événements dont vous enregistrez la feuille de présence comptent dans le taux cumulé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const hasAttendance = eventsWithAttendance.has(event.id)
              const category = getEventCategory(event.type)

              return (
                <div
                  key={event.id}
                  className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between gap-4 transition-all relative overflow-hidden bg-white dark:bg-zinc-900 ${
                    hasAttendance ? "border-zinc-200 dark:border-zinc-800/80" : "border-zinc-350 dark:border-zinc-800 border-dashed"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200">
                        📅 {new Date(event.date).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                      </span>
                      <span className="text-[9px] font-black text-zinc-400">⏱ {event.time}</span>
                      <span className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {getEventTypeName(event.type)}
                      </span>
                      {event.assignedTeam && (
                        <span className="bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                          👥 {event.assignedTeam}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-white tracking-wide">
                        {event.title}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">📍 Lieu : {event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-zinc-100 dark:border-zinc-850 pt-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase">
                      {hasAttendance ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Présences Enregistrées</span>
                        </>
                      ) : (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span className="text-amber-500">Non complété</span>
                        </>
                      )}
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleOpenAttendanceModal(event)}
                        className="rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                      >
                        {hasAttendance ? "Modifier 📝" : "Prendre les présences ➕"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ----------------- MODAL: MARK ATTENDANCE ----------------- */}
      {markingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                  {getEventTypeName(markingEvent.type)}
                </span>
                <h2 className="text-sm font-black uppercase text-zinc-900 dark:text-white mt-1">
                  ⏱ Fiche d&apos;appel : {markingEvent.title}
                </h2>
                <p className="text-[9px] text-zinc-400 mt-0.5">
                  Cible : {markingEvent.assignedTeam || "Tout le Club"} | {new Date(markingEvent.date).toLocaleDateString("fr-FR", { dateStyle: "long" })} à {markingEvent.time}
                </p>
              </div>
              <button
                onClick={() => setMarkingEvent(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Roster list */}
            <div className="flex-1 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {players.filter((p) => {
                return !markingEvent.assignedTeam || (p.teamCategory && p.teamCategory.name === markingEvent.assignedTeam)
              }).length === 0 ? (
                <p className="text-xs text-zinc-400 font-bold text-center py-8 uppercase tracking-wider">
                  Aucun joueur enregistré dans cette équipe.
                </p>
              ) : (
                players
                  .filter((p) => {
                    return !markingEvent.assignedTeam || (p.teamCategory && p.teamCategory.name === markingEvent.assignedTeam)
                  })
                  .map((player) => {
                    const status = modalAttendances[player.id] || "PRESENT"
                    return (
                      <div
                        key={player.id}
                        onClick={() => {
                          setModalAttendances((prev) => ({
                            ...prev,
                            [player.id]: status === "PRESENT" ? "ABSENT" : "PRESENT"
                          }))
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          status === "PRESENT"
                            ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
                            : "border-red-200 bg-red-50/10 dark:border-red-950/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 uppercase ${
                            status === "PRESENT" ? "bg-emerald-600" : "bg-red-500"
                          }`}>
                            {player.user.name?.charAt(0) || "J"}
                          </div>
                          <div>
                            <p className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide">
                              {player.user.name || "Joueur"}
                            </p>
                            <p className="text-[9px] text-zinc-450 font-bold uppercase">
                              🛡 {player.position || "Joueur"} {player.number ? `• N°${player.number}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className={`h-6 px-3 rounded-lg flex items-center justify-center text-[9px] font-black uppercase tracking-wider border shrink-0 ${
                          status === "PRESENT"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "text-red-550 border-red-200 hover:bg-red-550/10 dark:border-red-900/50"
                        }`}>
                          {status === "PRESENT" ? "✓ Présent" : "✗ Absent"}
                        </div>
                      </div>
                    )
                  })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-4">
              <button
                type="button"
                onClick={() => setMarkingEvent(null)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isPending}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-350 text-white px-5 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                {isPending ? "Enregistrement..." : "Enregistrer la feuille"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
