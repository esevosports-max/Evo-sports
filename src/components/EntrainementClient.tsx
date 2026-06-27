"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/LanguageProvider"

const unauthDict = {
  FR: {
    unauthorized: "Accès Non Autorisé",
    desc: "Seul le Président et le Staff Technique autorisé peuvent accéder au pôle entraînement et générer les feuilles de séances."
  },
  EN: {
    unauthorized: "Access Denied",
    desc: "Only the President and authorized Technical Staff can access the training section and generate session sheets."
  },
  AR: {
    unauthorized: "غير مصرح بالدخول",
    desc: "يسمح فقط للرئيس والطاقم الفني المصرح لهم بدخول قسم التدريب وإنشاء أوراق الحصص."
  }
}


interface TrainingEvent {
  id: string
  title: string
  date: string
  time: string
  assignedTeam: string
  location: string
  details?: string
  completed?: boolean
  status?: string
  creatorName?: string
}

interface ActivityItem {
  id: string
  name: string
  duration: number // in minutes
}

interface PlayerPresence {
  id: string
  name: string
  position: "Gardien" | "Défenseur" | "Milieu" | "Attaquant"
  present: boolean
}

interface CompletedData {
  activities: ActivityItem[]
  roster: PlayerPresence[]
}

// Pre-seeded players per squad
const CLUB_ROSTERS: Record<string, Omit<PlayerPresence, "present">[]> = {
  "Séniors A": [
    { id: "sa1", name: "Mohamed Belkacem", position: "Attaquant" },
    { id: "sa2", name: "Yacine Brahimi", position: "Milieu" },
    { id: "sa3", name: "Sofiane Feghouli", position: "Milieu" },
    { id: "sa4", name: "Riyad Mahrez", position: "Attaquant" },
    { id: "sa5", name: "Aissa Mandi", position: "Défenseur" },
    { id: "sa6", name: "Rais M'Bolhi", position: "Gardien" },
  ],
  "Séniors B": [
    { id: "sb1", name: "Karim Ziani", position: "Milieu" },
    { id: "sb2", name: "Rafik Djebbour", position: "Attaquant" },
    { id: "sb3", name: "Antar Yahia", position: "Défenseur" },
    { id: "sb4", name: "Madjid Bougherra", position: "Défenseur" },
    { id: "sb5", name: "Nadir Belhadj", position: "Milieu" },
    { id: "sb6", name: "Chaouchi Fawzi", position: "Gardien" },
  ],
  "U19 Nationaux": [
    { id: "u19_1", name: "Amine Gouiri", position: "Attaquant" },
    { id: "u19_2", name: "Fares Chaibi", position: "Milieu" },
    { id: "u19_3", name: "Rayan Ait Nouri", position: "Défenseur" },
    { id: "u19_4", name: "Badredine Bouanani", position: "Attaquant" },
    { id: "u19_5", name: "Jaouen Hadjam", position: "Défenseur" },
    { id: "u19_6", name: "Anthony Mandrea", position: "Gardien" },
  ],
  "U17 R1": [
    { id: "u17_1", name: "Adam Ounas", position: "Attaquant" },
    { id: "u17_2", name: "Hicham Boudaoui", position: "Milieu" },
    { id: "u17_3", name: "Ramiz Zerrouki", position: "Milieu" },
    { id: "u17_4", name: "Kevin Guitoun", position: "Défenseur" },
    { id: "u17_5", name: "Ahmed Touba", position: "Défenseur" },
    { id: "u17_6", name: "Mustapha Zeghba", position: "Gardien" },
  ],
}

export default function EntrainementClient({
  roleName,
  userName,
  coachCategories = [],
  initialTrainings = [],
  clubRosters = {},
  clubLogo = null,
  clubName = "EVO SPORTS",
}: {
  roleName: string
  userName: string
  coachCategories?: string[]
  initialTrainings?: TrainingEvent[]
  clubRosters?: Record<string, Omit<PlayerPresence, "present">[]>
  clubLogo?: string | null
  clubName?: string
}) {
  const { language } = useLanguage()

  // Trainings list that can mutate with state
  const [trainingsList, setTrainingsList] = useState<TrainingEvent[]>([])

  // Completed training data store
  const [completedDataMap, setCompletedDataMap] = useState<Record<string, CompletedData>>({})

  // Load completed state persistently from localStorage on mount
  useEffect(() => {
    const loadedCompletedMap: Record<string, CompletedData> = {}
    let filtered = initialTrainings
    if (roleName === "ENTRAINEUR_PRINCIPAL" || roleName === "ENTRAINEUR_ADJOINT") {
      filtered = initialTrainings.filter((t) => coachCategories.includes(t.assignedTeam))
    }
    const updatedList = filtered.map((t) => {
      const isCompleted = localStorage.getItem(`completed_training_id_${t.id}`) === "true" || t.status === "TERMINE"
      if (isCompleted) {
        const savedDrills = localStorage.getItem(`completed_training_activities_${t.id}`)
        const savedRoster = localStorage.getItem(`completed_training_roster_${t.id}`)
        if (savedDrills && savedRoster) {
          loadedCompletedMap[t.id] = {
            activities: JSON.parse(savedDrills),
            roster: JSON.parse(savedRoster)
          }
        } else {
          loadedCompletedMap[t.id] = {
            activities: [],
            roster: []
          }
        }
        return { ...t, completed: true }
      }
      return t
    })
    setTrainingsList(updatedList)
    setCompletedDataMap(loadedCompletedMap)
  }, [initialTrainings, roleName, coachCategories])

  // Active view states
  // 'select' | 'live' | 'sheet'
  const [activeView, setActiveView] = useState<"select" | "live" | "sheet">("select")
  const [selectedTraining, setSelectedTraining] = useState<TrainingEvent | null>(null)

  // Live session states
  const [activities, setActivities] = useState<ActivityItem[]>([
    { id: "1", name: "Échauffement cohésion", duration: 15 },
    { id: "2", name: "Rondo conservation (une touche)", duration: 20 },
  ])
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityDuration, setNewActivityDuration] = useState("15")

  // Presence sheet states
  const [roster, setRoster] = useState<PlayerPresence[]>([])

  // Selection Handler for starting a new session
  const handleStartSession = (event: TrainingEvent) => {
    setSelectedTraining(event)
    setActivities([
      { id: "1", name: "Échauffement cohésion", duration: 15 },
      { id: "2", name: "Rondo conservation (une touche)", duration: 20 },
    ])
    const preRoster = clubRosters[event.assignedTeam] || CLUB_ROSTERS[event.assignedTeam] || []
    setRoster(preRoster.map((player) => ({ ...player, present: true } as PlayerPresence)))
    setActiveView("live")
  }

  // Delete handler for training sessions
  const handleDeleteTraining = async (id: string, title: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer la séance "${title}" ?`)) return

    try {
      const { deleteEvent } = await import("../app/dashboard/planning/actions")
      const res = await deleteEvent(id)
      if (res.success) {
        setTrainingsList((prev) => prev.filter((t) => t.id !== id))
      } else {
        alert(res.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue")
    }
  }

  // Selection Handler for consulting an already completed session
  const handleConsultSession = (event: TrainingEvent) => {
    setSelectedTraining(event)
    const saved = completedDataMap[event.id]
    if (saved) {
      setActivities(saved.activities)
      setRoster(saved.roster)
    }
    setActiveView("sheet")
  }

  // Activity Handlers
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActivityName.trim() || !newActivityDuration) return

    const newItem: ActivityItem = {
      id: Date.now().toString(),
      name: newActivityName.trim(),
      duration: parseInt(newActivityDuration) || 10,
    }

    setActivities((prev) => [...prev, newItem])
    setNewActivityName("")
    setNewActivityDuration("15")
  }

  const handleDeleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((act) => act.id !== id))
  }

  const togglePlayerPresence = (id: string) => {
    setRoster((prev) =>
      prev.map((player) =>
        player.id === id ? { ...player, present: !player.present } : player
      )
    )
  }

  // Calculate stats
  const totalDuration = activities.reduce((acc, curr) => acc + curr.duration, 0)
  const totalPlayers = roster.length
  const presentCount = roster.filter((p) => p.present).length
  const absentCount = totalPlayers - presentCount

  // Submit and lock training session
  const handleCompleteSession = async () => {
    if (!selectedTraining) return

    try {
      const { completeTraining } = await import("../app/dashboard/planning/actions")
      const res = await completeTraining(selectedTraining.id)
      if (!res.success) {
        alert(res.error || "Une erreur est survenue lors de la clôture.")
        return
      }

      // Save completion state & logs persistently in localStorage
      localStorage.setItem(`completed_training_id_${selectedTraining.id}`, "true")
      localStorage.setItem(`completed_training_date_${selectedTraining.date}`, "true")
      localStorage.setItem(`completed_training_activities_${selectedTraining.id}`, JSON.stringify(activities))
      localStorage.setItem(`completed_training_roster_${selectedTraining.id}`, JSON.stringify(roster))

      // Update state list to reflect completed
      setTrainingsList((prev) =>
        prev.map((t) => (t.id === selectedTraining.id ? { ...t, completed: true, status: "TERMINE" } : t))
      )
      setCompletedDataMap((prev) => ({
        ...prev,
        [selectedTraining.id]: { activities, roster }
      }))

      // Switch directly to sheet view
      setActiveView("sheet")
    } catch (err) {
      console.error(err)
      alert("Une erreur est survenue lors de la communication avec le serveur.")
    }
  }

  // Export to Excel function
  const handleExportToExcel = () => {
    if (!selectedTraining) return

    const clubNameStr = clubName || "EVO SPORTS"
    const dateStr = selectedTraining.date
    const titleStr = "Feuille d'Entraînement Officielle"
    const teamStr = selectedTraining.assignedTeam
    const themeStr = selectedTraining.title

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .club-title { font-size: 18px; font-weight: 900; color: #065f46; text-transform: uppercase; margin-bottom: 2px; }
          .doc-title { font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin-bottom: 15px; }
          .meta-label { font-weight: bold; color: #4b5563; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 25px; }
          th { background-color: #065f46; color: white; border: 1px solid #d1d5db; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; }
          td { border: 1px solid #e5e7eb; padding: 10px; font-size: 11px; }
          .present { color: #059669; font-weight: bold; }
          .absent { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="club-title">${clubNameStr}</div>
        <div>Date : ${dateStr}</div>
        <div class="doc-title">${titleStr}</div>
        <p><span class="meta-label">Équipe :</span> ${teamStr}</p>
        <p><span class="meta-label">Thème :</span> ${themeStr}</p>
        <p><span class="meta-label">Durée totale :</span> ${totalDuration} minutes</p>

        <h3>1. TABLEAU DES EXERCICES & DURÉES</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 10%">Ordre</th>
              <th style="width: 60%">Activité / Exercice</th>
              <th style="width: 30%">Durée</th>
            </tr>
          </thead>
          <tbody>
            ${activities.map((act, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${act.name}</td>
                <td>${act.duration} minutes</td>
              </tr>
            `).join("")}
            <tr style="font-weight: bold; background-color: #f9fafb;">
              <td>-</td>
              <td>DURÉE TOTALE</td>
              <td>${totalDuration} minutes</td>
            </tr>
          </tbody>
        </table>

        <h3>2. REGISTRE DE PRÉSENCE DES EFFECTIFS</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 50%">Nom & Prénom du Joueur</th>
              <th style="width: 25%">Poste</th>
              <th style="width: 25%">Statut de Présence</th>
            </tr>
          </thead>
          <tbody>
            ${roster.map((player) => `
              <tr>
                <td>${player.name}</td>
                <td>${player.position}</td>
                <td class="${player.present ? 'present' : 'absent'}">${player.present ? 'Présent' : 'Absent'}</td>
              </tr>
            `).join("")}
            <tr style="font-weight: bold; background-color: #f9fafb;">
              <td>TOTAL : ${totalPlayers} Joueurs</td>
              <td>Présents : ${presentCount}</td>
              <td>Absents : ${absentCount}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([html], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `feuille_entrainement_${teamStr.replace(/\s+/g, '_').toLowerCase()}_${dateStr}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Access Restriction
  const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MEDECIN"]
  const hasAccess = allowedRoles.includes(roleName)

  if (!hasAccess) {
    const tLoc = unauthDict[language] || unauthDict["FR"]
    return (
      <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-8 text-center max-w-lg mx-auto space-y-4">
        <span className="text-3xl">⚠️</span>
        <h2 className="text-base font-black text-red-600 uppercase tracking-wider">{tLoc.unauthorized}</h2>
        <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
          {tLoc.desc}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ---------------------------------------- */}
      {/* VIEW 1: SELECT TRAINING */}
      {/* ---------------------------------------- */}
      {activeView === "select" && (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                Séances d&apos;Entraînement
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed max-w-2xl">
                Importez les séances du planning officiel. Sélectionnez une séance pour renseigner les exercices,
                pointer la présence en direct et exporter le bilan réglementaire en Excel. Une fois clôturée, une séance n&apos;est plus modifiable.
              </p>
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-3 py-2 rounded-xl uppercase tracking-wider shrink-0 select-none">
              🏃‍♂️ {trainingsList.length} Séances dans le Cycle
            </span>
          </section>

          <div className="space-y-3 select-none">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-2 border-b border-zinc-150/70">
              Séances Disponibles (Planning Importé)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainingsList.map((train) => {
                const eventDateTime = new Date(`${train.date}T${train.time}`)
                const isExpired = train.status === "EXPIRE" || (
                  !isNaN(eventDateTime.getTime()) &&
                  (new Date().getTime() - eventDateTime.getTime() > 24 * 60 * 60 * 1000) &&
                  !train.completed && train.status !== "TERMINE" && train.status !== "EN_COURS"
                )
                return (
                  <div
                    key={train.id}
                    className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between gap-6 transition-all group relative overflow-hidden ${train.completed
                        ? "border-zinc-200 bg-zinc-50/50 dark:border-zinc-850 dark:bg-zinc-950/20 grayscale opacity-80"
                        : isExpired
                        ? "border-red-300 bg-red-50/5 dark:border-red-950/20 dark:bg-red-950/10"
                        : "border-zinc-150 bg-white dark:border-zinc-800 dark:bg-zinc-950 hover:border-emerald-500"
                      }`}
                  >
                    <div className={`absolute top-0 left-0 bottom-0 w-1 ${train.completed ? "bg-zinc-400" : isExpired ? "bg-red-500" : "bg-emerald-500"}`} />
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200">
                          📅 {new Date(train.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                        </span>
                        <span className="text-[9px] font-black text-zinc-400">⏱ {train.time}</span>
                        <span className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${train.completed
                            ? "bg-zinc-200/50 text-zinc-500 dark:bg-zinc-850"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}>
                          ⚽ {train.assignedTeam}
                        </span>

                        {train.completed && (
                          <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                            ✓ Réalisée & Verrouillée
                          </span>
                        )}

                        {isExpired && (
                          <span className="bg-red-500/10 text-red-655 border border-red-500/20 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider animate-pulse">
                            ⚠️ Expiré (Non commencé)
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-white tracking-wide">
                          {train.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-semibold">📍 Lieu : {train.location}</p>
                        {train.details && (
                          <p className="text-[10px] text-zinc-400 italic font-semibold leading-relaxed">
                            💡 Consignes : {train.details}
                          </p>
                        )}
                      </div>
                    </div>

                    {train.completed ? (
                      <button
                        onClick={() => handleConsultSession(train)}
                        className="w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-[10px] tracking-wider py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-center"
                      >
                        Consulter le Bilan 📊
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        {!isExpired ? (
                          <button
                            onClick={() => handleStartSession(train)}
                            className="flex-1 rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-200 hover:from-zinc-100 hover:to-zinc-250 border border-zinc-300 text-emerald-800 font-black uppercase text-[10px] tracking-wider py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer text-center"
                          >
                            Démarrer l&apos;entraînement ⚡
                          </button>
                        ) : (
                          <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 text-red-655 font-black uppercase text-[9px] tracking-wider py-2.5 flex items-center justify-center select-none text-center">
                            ⚠️ Séance Expirée
                          </div>
                        )}

                        {(isExpired
                          ? ["PRESIDENT", "MANAGER_EVO_SPORTS"].includes(roleName)
                          : ["PRESIDENT", "MANAGER_EVO_SPORTS"].includes(roleName) || train.creatorName === userName
                        ) && (
                          <button
                            onClick={() => handleDeleteTraining(train.id, train.title)}
                            className="px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-650 font-black uppercase text-[10px] tracking-wider py-2.5 shadow-sm active:scale-95 transition-all cursor-pointer dark:bg-red-950/20 dark:text-red-400"
                            title="Supprimer la séance"
                          >
                            Supprimer ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------- */}
      {/* VIEW 2: LIVE SESSION CONTROLLER */}
      {/* ---------------------------------------- */}
      {activeView === "live" && selectedTraining && (
        <div className="space-y-6">

          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4 dark:border-zinc-800">
            <div className="space-y-1">
              <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                Séance Active
              </span>
              <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                {selectedTraining.title} — {selectedTraining.assignedTeam}
              </h2>
              <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest">
                Lieu : {selectedTraining.location} | Date : {new Date(selectedTraining.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </p>
            </div>

            <button
              onClick={() => setActiveView("select")}
              className="rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all active:scale-95 cursor-pointer dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm"
            >
              ← Annuler Séance
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Column 1: Activities Logger */}
            <div className="lg:col-span-1 space-y-6">

              {/* Form to add drill */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  ➕ Ajouter un Exercice / Activité
                </h3>

                <form onSubmit={handleAddActivity} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1">Nom de l&apos;exercice</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Circuit physique intermittent"
                      value={newActivityName}
                      onChange={(e) => setNewActivityName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1">Durée (Minutes)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ex: 20"
                      value={newActivityDuration}
                      onChange={(e) => setNewActivityDuration(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl border border-emerald-600 bg-white text-emerald-800 hover:bg-emerald-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-emerald-400 font-black uppercase text-[10px] tracking-wider py-2.5 transition-all cursor-pointer text-center"
                  >
                    Ajouter l&apos;activité ⏱
                  </button>
                </form>
              </div>

              {/* List of current drills */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4 select-none">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
                    ⏱ Horloge de la Séance
                  </h3>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    {totalDuration} min cumulés
                  </span>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-zinc-400 font-bold text-center py-6">
                    Aucun exercice ajouté pour le moment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((act, index) => (
                      <div
                        key={act.id}
                        className="rounded-xl border border-zinc-150/70 p-3 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950 flex items-center justify-between gap-4 group"
                      >
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-bold text-zinc-400">EXERCICE {index + 1}</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide">
                            {act.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-semibold">⏱ Durée : {act.duration} minutes</p>
                        </div>

                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/20 transition-all duration-150 cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Column 2: Roster Presence Tracker */}
            <div className="lg:col-span-2 space-y-6">

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-zinc-100 dark:border-zinc-800 select-none">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
                      ⚽ Registre d&apos;Appel & Présences
                    </h3>
                    <p className="text-[9px] text-zinc-450 font-bold uppercase mt-0.5">
                      Pointez les joueurs présents à la séance
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">
                      Présents : {presentCount}
                    </span>
                    <span className="bg-red-500/10 text-red-650 dark:text-red-400 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider">
                      Absents : {absentCount}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {roster.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => togglePlayerPresence(player.id)}
                      className={`rounded-xl border p-3.5 flex items-center justify-between gap-4 cursor-pointer select-none transition-all ${player.present
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10"
                          : "border-red-200 bg-red-50/10 dark:border-red-950/20"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase ${player.present ? "bg-emerald-600" : "bg-red-500"
                          }`}>
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide">
                            {player.name}
                          </p>
                          <p className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
                            🛡 {player.position}
                          </p>
                        </div>
                      </div>

                      <div className={`h-6 px-3 rounded-lg flex items-center justify-center text-[9px] font-black uppercase tracking-wider border shrink-0 ${player.present
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "text-red-550 border-red-200 hover:bg-red-50 dark:border-red-900/50"
                        }`}>
                        {player.present ? "✓ Présent" : "✗ Absent"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Final Button */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={handleCompleteSession}
                    disabled={activities.length === 0}
                    className={`w-full rounded-xl font-black uppercase text-[10px] tracking-wider py-3.5 shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${activities.length > 0
                        ? "bg-gradient-to-b from-zinc-100 to-zinc-350 hover:from-zinc-50 hover:to-zinc-200 border border-zinc-300 text-emerald-800 active:scale-95"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                      }`}
                  >
                    📝 Clôturer l&apos;entraînement & Générer la Feuille
                  </button>
                  {activities.length === 0 && (
                    <p className="text-[9px] text-center text-zinc-400 font-bold uppercase tracking-widest mt-2">
                      ⚠️ Ajoutez au moins une activité/exercice pour pouvoir clôturer l&apos;entraînement.
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------- */}
      {/* VIEW 3: PREVIEW & EXCEL SHEET EXPORT */}
      {/* ---------------------------------------- */}
      {activeView === "sheet" && selectedTraining && (
        <div className="space-y-6">

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4 dark:border-zinc-800 select-none">
            <div className="space-y-0.5">
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider">
                ✓ Rapport Clôturé & Verrouillé
              </span>
              <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Bilan Officiel — {selectedTraining.assignedTeam}
              </h2>
              <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest">
                Consultation en lecture seule & Export réglementaire
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedTraining(null)
                  setActiveView("select")
                }}
                className="rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all active:scale-95 cursor-pointer dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 border border-zinc-950 dark:border-white shadow-sm"
              >
                ← Retour aux Séances
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* Sheet Preview Card (Left 2 cols) */}
            <div className="xl:col-span-2 rounded-2xl border border-zinc-250 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-lg space-y-8 relative overflow-hidden select-none">

              {/* Decorative print headers */}
              <div className="border-4 double border-emerald-800/20 p-6 space-y-6">

                {/* Meta details */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b-2 border-emerald-850/15">
                  <div className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/logo.png" 
                      alt="EVO SPORTS" 
                      className="h-10 w-auto object-contain" 
                    />
                    <p className="text-[10px] text-zinc-450 font-black tracking-widest uppercase">
                      Plateforme d&apos;Optimisation & Performance
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider">
                      Date : {new Date(selectedTraining.date).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                    <p className="text-[9px] text-zinc-450 font-black uppercase tracking-wider mt-0.5">
                      Rapport d&apos;Activité Officiel
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    {clubLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={clubLogo} 
                        alt="Logo Club" 
                        className="h-5 w-auto object-contain rounded" 
                      />
                    )}
                    <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                      Feuille d&apos;Entraînement
                    </h4>
                  </div>
                  <p className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                    Thème : {selectedTraining.title} | Équipe : {selectedTraining.assignedTeam}
                  </p>
                </div>

                {/* Table 1: Drills list */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-white border-b pb-1">
                    1. Exercices Réalisés & Durée par Bloc
                  </h5>

                  <div className="rounded-xl border border-zinc-150 overflow-hidden dark:border-zinc-800">
                    <table className="w-full text-left border-collapse text-[10px] font-semibold">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-black uppercase select-none">
                          <th className="p-2.5">Ordre</th>
                          <th className="p-2.5">Activité / Exercice</th>
                          <th className="p-2.5 text-right">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.map((act, i) => (
                          <tr key={act.id} className="border-b border-zinc-150 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50">
                            <td className="p-2.5 text-zinc-400">{i + 1}</td>
                            <td className="p-2.5 text-zinc-800 dark:text-zinc-200 uppercase font-black">{act.name}</td>
                            <td className="p-2.5 text-right text-zinc-650 font-bold">{act.duration} minutes</td>
                          </tr>
                        ))}
                        <tr className="bg-zinc-50 font-black dark:bg-zinc-950">
                          <td className="p-2.5"></td>
                          <td className="p-2.5 text-zinc-850 dark:text-white">DURÉE TOTALE</td>
                          <td className="p-2.5 text-right text-emerald-600 font-extrabold">{totalDuration} minutes</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: Attendance checklist */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-white border-b pb-1">
                    2. Liste des Présences & Roster Registre
                  </h5>

                  <div className="rounded-xl border border-zinc-150 overflow-hidden dark:border-zinc-800">
                    <table className="w-full text-left border-collapse text-[10px] font-semibold">
                      <thead>
                        <tr className="bg-emerald-700 text-white font-black uppercase select-none">
                          <th className="p-2.5">Joueur</th>
                          <th className="p-2.5">Poste</th>
                          <th className="p-2.5 text-right">Présence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roster.map((player) => (
                          <tr key={player.id} className="border-b border-zinc-150 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50">
                            <td className="p-2.5 text-zinc-800 dark:text-zinc-200 uppercase font-black">{player.name}</td>
                            <td className="p-2.5 text-zinc-450 font-bold">{player.position}</td>
                            <td className="p-2.5 text-right">
                              <span className={`rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${player.present ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-650"
                                }`}>
                                {player.present ? "Présent" : "Absent"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

            {/* Sidebar Exporter Controls (Right col) */}
            <div className="lg:col-span-1 space-y-6">

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  📥 Téléchargement Excel
                </h3>

                <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                  Exportez cette feuille d&apos;entraînement officielle au format `.xls` standard compatible
                  avec Microsoft Excel, Google Sheets, et LibreOffice.
                </p>

                <button
                  onClick={handleExportToExcel}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-wider py-3.5 shadow-md shadow-emerald-600/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                >
                  Exporter en Excel
                </button>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-950 space-y-3 select-none">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  ⚙️ Données Exportées
                </h4>
                <ul className="text-xs text-zinc-650 dark:text-zinc-400 font-semibold space-y-1.5 list-disc list-inside">
                  <li>Identité officielle du club (EVO SPORTS)</li>
                  <li>Date de la séance</li>
                  <li>Thème de planification & équipe désignée</li>
                  <li>Tableau complet des exercices & durées</li>
                  <li>Liste nominative des présences & pourcentages</li>
                </ul>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}
