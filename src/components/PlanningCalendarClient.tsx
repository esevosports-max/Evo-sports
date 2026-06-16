"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

import { getEvents, createEvent, deleteEvent, getClubTeams } from "@/app/dashboard/planning/actions"

interface CalendarEvent {
  id: string
  title: string
  type: "MATCH" | "TRAINING" | "MEETING" | "MEDICAL_EXAM" | "EXCURSION"
  date: string // format YYYY-MM-DD
  time: string
  location: string
  details?: string
  creatorName?: string
  creatorRole?: string
  assignedTeam?: string
  score?: string | null
  status?: string
}

const LOCAL_ROLE_LABELS: Record<string, string> = {
  MANAGER_EVO_SPORTS: "Manager Général",
  PRESIDENT: "Président",
  DIRECTEUR_SPORTIF: "Directeur Sportif",
  SECRETAIRE_GENERAL: "Secrétaire Général",
  ENTRAINEUR_PRINCIPAL: "Entraîneur Principal",
  ENTRAINEUR_ADJOINT: "Entraîneur Adjoint",
  PREPARATEUR_PHYSIQUE: "Préparateur Physique",
  ENTRAINEUR_GARDIENS: "Entraîneur des Gardiens",
  MEDECIN: "Médecin",
  JOUEUR: "Joueur",
}



export default function PlanningCalendarClient({
  roleName,
  userName,
}: {
  roleName: string
  userName: string
}) {
  // Local ISO date: YYYY-MM-DD
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const todayStr = `${year}-${month}-${day}`

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  const refreshEvents = async () => {
    setLoading(true)
    const res = await getEvents()
    if (res.success && res.events) {
      setEvents(res.events as any[])
    }
    setLoading(false)
  }

  const [myAllowedTeams, setMyAllowedTeams] = useState<string[]>([])

  const loadTeams = async () => {
    const res = await getClubTeams()
    if (res.success && res.myTeams) {
      setMyAllowedTeams(res.myTeams)
    }
  }

  useEffect(() => {
    refreshEvents()
    loadTeams()
  }, [])

  const [activeFilter, setActiveFilter] = useState<"ALL" | "MATCH" | "TRAINING" | "MEETING" | "MEDICAL_EXAM" | "EXCURSION">("ALL")
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([])
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null)

  const [completedDates, setCompletedDates] = useState<string[]>([])

  // Gather completed training dates from localStorage on mount & events update
  useEffect(() => {
    const dates: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("completed_training_date_")) {
        dates.push(key.replace("completed_training_date_", ""))
      }
    }
    setCompletedDates(dates)
  }, [events])

  // Pre-select today's date dynamically on mount & when events update
  useEffect(() => {
    setSelectedDayString(todayStr)
    setSelectedDayEvents(events.filter((e) => e.date === todayStr))
  }, [todayStr, events])

  // Set default type to EXCURSION for Secretary or MEDICAL_EXAM for Doctor
  useEffect(() => {
    if (roleName === "SECRETAIRE_GENERAL") {
      setNewEventType("EXCURSION")
    } else if (roleName === "MEDECIN") {
      setNewEventType("MEDICAL_EXAM")
    }
  }, [roleName])

  // Planner form state
  const [newEventTitle, setNewEventTitle] = useState("")
  const [newEventType, setNewEventType] = useState<"MATCH" | "TRAINING" | "MEETING" | "MEDICAL_EXAM" | "EXCURSION">("TRAINING")
  const [newEventDate, setNewEventDate] = useState(todayStr)
  const [newEventTime, setNewEventTime] = useState("10:00")
  const [newEventLoc, setNewEventLoc] = useState("Terrain Principal")
  const [newEventDesc, setNewEventDesc] = useState("")
  const [newEventTeam, setNewEventTeam] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Determine permissions
  const canAddEvents = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MEDECIN"].includes(roleName)

  // Determine team list available for the logged-in user
  const isPresidentOrManager = ["PRESIDENT", "MANAGER_EVO_SPORTS"].includes(roleName)
  const userAllowedTeams = myAllowedTeams

  // Generate calendar days for June 2026
  // June 1st, 2026 is a Monday. June has 30 days.
  const totalDays = 30
  const startDayOffset = 0 // Monday (0 offset if we start grid on Monday)

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEventTitle) return

    // Team selection is required for MATCH, TRAINING, MEDICAL_EXAM, EXCURSION
    const needsTeam = ["TRAINING", "MATCH", "MEDICAL_EXAM", "EXCURSION"].includes(newEventType)
    if (needsTeam && !newEventTeam) {
      alert("Veuillez sélectionner une équipe pour cette catégorie.")
      return
    }

    const res = await createEvent({
      title: newEventTitle,
      type: newEventType,
      date: newEventDate,
      time: newEventTime,
      location: newEventLoc,
      details: newEventDesc,
      assignedTeam: needsTeam ? newEventTeam : undefined,
    })

    if (res.success) {
      setNewEventTitle("")
      setNewEventDesc("")
      setNewEventTeam("")
      setSuccessMsg("Événement ajouté au calendrier !")
      setTimeout(() => setSuccessMsg(""), 4000)
      await refreshEvents()
    } else {
      alert(res.error || "Une erreur est survenue lors de l'ajout.")
    }
  }

  const handleSelectDay = (dayNum: number) => {
    const dayStr = `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`
    setSelectedDayString(dayStr)
    const dayEvts = events.filter((e) => e.date === dayStr)
    setSelectedDayEvents(dayEvts)
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet événement ?")) return
    const res = await deleteEvent(eventId)
    if (res.success) {
      await refreshEvents()
    } else {
      alert(res.error || "Une erreur est survenue lors de la suppression.")
    }
  }

  const roleLabel = LOCAL_ROLE_LABELS[roleName] || roleName

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Row for Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-150/70 dark:border-zinc-800 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-950 dark:text-white">
            Planning & Calendrier du Club
          </h2>
          <p className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">
            Agenda officiel partagé & filtres de catégories
          </p>
        </div>
        <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl overflow-x-auto select-none">
          {(["ALL", "MATCH", "TRAINING", "MEETING", "MEDICAL_EXAM", "EXCURSION"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeFilter === filter
                  ? "bg-gradient-to-b from-emerald-500 to-teal-650 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {filter === "ALL" && "Tous"}
              {filter === "MATCH" && (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "MATCH" ? "bg-white" : "bg-blue-500"}`} />
                  Matchs
                </>
              )}
              {filter === "TRAINING" && (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "TRAINING" ? "bg-white" : "bg-emerald-500"}`} />
                  Entraînements
                </>
              )}
              {filter === "MEETING" && (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "MEETING" ? "bg-white" : "bg-zinc-500"}`} />
                  Réunions
                </>
              )}
              {filter === "MEDICAL_EXAM" && (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "MEDICAL_EXAM" ? "bg-white" : "bg-red-500"}`} />
                  Examens Médicaux
                </>
              )}
              {filter === "EXCURSION" && (
                <>
                  <span className={`h-1.5 w-1.5 rounded-full ${activeFilter === "EXCURSION" ? "bg-white" : "bg-yellow-500"}`} />
                  Excursions
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Calendar Month Card (Left 2 cols) */}
        <div className="xl:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-150/75 dark:border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              Juin 2026
            </h3>
            <span className="text-[10px] font-bold text-zinc-400">Total : {events.length} Événements programmés</span>
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase text-zinc-400 tracking-wider select-none">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mer</div>
            <div>Jeu</div>
            <div>Ven</div>
            <div>Sam</div>
            <div>Dim</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset days if any */}
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`offset-${i}`} className="h-20 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: totalDays }).map((_, index) => {
              const dayNum = index + 1
              const dayStr = `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`
              
              // Filter events for this day
              const dayEvts = events.filter((e) => {
                if (e.date !== dayStr) return false
                if (activeFilter === "ALL") return true
                return e.type === activeFilter
              })

              const isSelected = selectedDayString === dayStr

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-20 rounded-xl border p-2 cursor-pointer transition-all duration-150 flex flex-col justify-between hover:border-emerald-500 hover:shadow-sm ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"
                      : "border-zinc-150/70 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  }`}
                >
                  <span className={`text-[10px] font-black ${isSelected ? "text-emerald-600" : "text-zinc-400"}`}>
                    {dayNum}
                  </span>

                  {/* Dot/Indicator container */}
                  <div className="flex flex-wrap gap-1">
                    {dayEvts.map((e) => {
                      const isEventToday = e.date === todayStr
                      const isEventPast = e.date < todayStr || (e.type === "TRAINING" && completedDates.includes(e.date))
                      return (
                        <span
                          key={e.id}
                          title={e.title}
                          className={`h-2 w-2 rounded-full ${
                            isEventToday
                              ? `animate-pulse ring-2 ${
                                  e.type === "MATCH"
                                    ? "bg-blue-500 ring-blue-400"
                                    : e.type === "TRAINING"
                                    ? "bg-emerald-500 ring-emerald-400"
                                    : e.type === "MEETING"
                                    ? "bg-zinc-500 ring-zinc-450"
                                    : e.type === "MEDICAL_EXAM"
                                    ? "bg-red-500 ring-red-400"
                                    : "bg-yellow-500 ring-yellow-400"
                                }`
                              : isEventPast
                              ? "bg-zinc-400 dark:bg-zinc-650"
                              : e.type === "MATCH"
                              ? "bg-blue-500"
                              : e.type === "TRAINING"
                              ? "bg-emerald-500"
                              : e.type === "MEETING"
                              ? "bg-zinc-500"
                              : e.type === "MEDICAL_EXAM"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Details & Event Adder Panel (Right Col) */}
        <div className="space-y-6">
          
          {/* Day selection details card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-150/75 dark:border-zinc-800">
              Détails du Jour Sélectionné
            </h3>

            {!selectedDayString ? (
              <p className="text-xs font-bold text-zinc-400 text-center py-6">
                Cliquez sur un jour du calendrier pour consulter ses événements.
              </p>
            ) : selectedDayEvents.length === 0 ? (
              <p className="text-xs font-bold text-zinc-400 text-center py-6 leading-relaxed">
                Aucun événement prévu pour le <br/>
                <span className="text-zinc-600 dark:text-zinc-300 font-extrabold">{new Date(selectedDayString).toLocaleDateString("fr-FR", { dateStyle: "long" })}</span>.
              </p>
            ) : (
              <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  {new Date(selectedDayString).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                </p>
                {selectedDayEvents.map((evt) => {
                  const isEventToday = evt.date === todayStr
                  const isEventPast = evt.date < todayStr || (evt.type === "TRAINING" && completedDates.includes(evt.date))
                  return (
                    <div key={evt.id} className={`rounded-xl border p-3 bg-zinc-50/50 space-y-1 transition-all duration-150 ${
                      isEventToday 
                        ? `animate-pulse ${
                            evt.type === "MATCH"
                              ? "border-blue-500 bg-blue-5/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
                              : evt.type === "TRAINING"
                              ? "border-emerald-500 bg-emerald-5/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                              : evt.type === "MEETING"
                              ? "border-zinc-550 bg-zinc-5/10 shadow-[0_0_12px_rgba(113,113,122,0.15)]"
                              : evt.type === "MEDICAL_EXAM"
                              ? "border-red-500 bg-red-5/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
                              : "border-yellow-500 bg-yellow-5/10 shadow-[0_0_12px_rgba(234,179,8,0.15)]"
                          }`
                        : isEventPast 
                        ? "grayscale opacity-50 bg-zinc-100/30 border-zinc-205" 
                        : "border-zinc-150/70"
                    }`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                evt.type === "MATCH"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : evt.type === "TRAINING"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : evt.type === "MEETING"
                                  ? "bg-zinc-500/10 text-zinc-600"
                                  : evt.type === "MEDICAL_EXAM"
                                  ? "bg-red-500/10 text-red-600"
                                  : "bg-yellow-500/10 text-yellow-600"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  evt.type === "MATCH"
                                    ? "bg-blue-500"
                                    : evt.type === "TRAINING"
                                    ? "bg-emerald-500"
                                    : evt.type === "MEETING"
                                    ? "bg-zinc-500"
                                    : evt.type === "MEDICAL_EXAM"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                                }`} />
                                {evt.type === "MATCH" 
                                  ? "Match" 
                                  : evt.type === "TRAINING" 
                                  ? "Entraînement" 
                                  : evt.type === "MEETING"
                                  ? "Réunion"
                                  : evt.type === "MEDICAL_EXAM"
                                  ? "Examen Médical"
                                  : "Excursion"}
                              </span>

                              {/* Beautiful dynamic assigned team label badge */}
                              {evt.assignedTeam && (
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-700/50 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                  ⚽ {evt.assignedTeam}
                                </span>
                              )}
                            </div>
                            
                            <span className="font-mono text-[10px] text-zinc-450 shrink-0">{evt.time}</span>
                          </div>
                          
                          <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide pt-1 truncate">{evt.title}</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">📍 Lieu : {evt.location}</p>
                          {evt.details && <p className="text-[10px] text-zinc-450 dark:text-zinc-500 italic leading-relaxed">{evt.details}</p>}
                          {evt.creatorName && evt.creatorRole && (
                            <p className="text-[9px] font-bold text-zinc-400 pt-1">
                              👤 Créé par : <span className="text-zinc-650 dark:text-zinc-350">{evt.creatorName}</span> ({LOCAL_ROLE_LABELS[evt.creatorRole] || evt.creatorRole})
                            </p>
                          )}
                        </div>
                        
                        {(roleName === "PRESIDENT" || evt.creatorName === userName) && !isEventPast && (
                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg bg-red-50 text-red-655 hover:bg-red-600 hover:text-white border border-red-200 transition-all duration-150 cursor-pointer shrink-0 shadow-sm"
                            title="Supprimer l'événement"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Form Card only if user has credentials */}
          {canAddEvents && (
            <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-150/75 dark:border-zinc-800">
                Planifier un Événement
              </h3>

              {successMsg && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs font-bold text-emerald-600 text-center animate-pulse">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleAddEvent} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Titre de l&apos;événement</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Séance Vidéo ou Amical"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Catégorie</label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    >
                      {roleName === "SECRETAIRE_GENERAL" ? (
                        <>
                          <option value="EXCURSION">🟡 Excursion</option>
                          <option value="MEETING">⚫ Réunion</option>
                        </>
                      ) : ["ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "ENTRAINEUR_GARDIENS"].includes(roleName) ? (
                        <>
                          <option value="TRAINING">🟢 Entraînement</option>
                          <option value="MATCH">🔵 Match</option>
                        </>
                      ) : roleName === "MEDECIN" ? (
                        <>
                          <option value="MEDICAL_EXAM">🔴 Examen Médical</option>
                        </>
                      ) : (
                        <>
                          <option value="TRAINING">🟢 Entraînement</option>
                          <option value="MATCH">🔵 Match</option>
                          <option value="MEETING">⚫ Réunion</option>
                          <option value="MEDICAL_EXAM">🔴 Examen Médical</option>
                          <option value="EXCURSION">🟡 Excursion</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* ⚽ Dynamic assigned team select field (only visible for training, match, medical, excursion) */}
                {["TRAINING", "MATCH", "MEDICAL_EXAM", "EXCURSION"].includes(newEventType) && (
                  <div className="animate-in fade-in duration-200 space-y-1">
                    <label className="block text-[9px] font-black text-zinc-400 uppercase">
                      {isPresidentOrManager ? "Équipe concernée (Club)" : "Équipe sous votre commandement"}
                    </label>
                    <select
                      required
                      value={newEventTeam}
                      onChange={(e) => setNewEventTeam(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    >
                      <option value="">-- Choisir une équipe --</option>
                      {userAllowedTeams.map((team) => (
                        <option key={team} value={team}>⚽ {team}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Heure</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 10:00"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Lieu</label>
                    <input
                      type="text"
                      required
                      value={newEventLoc}
                      onChange={(e) => setNewEventLoc(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">Description / Consignes</label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Tenue d'entraînement rouge obligatoire"
                    value={newEventDesc}
                    onChange={(e) => setNewEventDesc(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-350 hover:from-zinc-50 hover:to-zinc-200 border border-zinc-300 text-emerald-800 font-black uppercase text-[10px] tracking-wider py-3 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  📅 Planifier l&apos;événement
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
