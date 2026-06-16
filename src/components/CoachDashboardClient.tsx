"use client"

import { useState } from "react"

interface Category {
  id: string
  name: string
  league: string
  coach: string
  maxPlayers: number
}

interface Player {
  id: string
  name: string
  email: string
  position: string
  number: number | null
  age: number | null
  height: string | null
  weight: string | null
  foot: string | null
  isInjured: boolean
  injuryType: string | null
  injurySeverity: string | null
  injuryDuration: string | null
  injuryDate: string | null
  injuryReturn: string | null
  injuryStatus: string | null
  injuryProgress: number
}

interface Match {
  id: string
  title: string
  location: string
  stadiumName: string
  date: string
  time: string
  status: string
  score: string | null
  assignedTeam: string | null
}

interface Training {
  id: string
  title: string
  date: string
  time: string
  location: string
  details: string | null
  status: string
  assignedTeam: string | null
}

interface DailyQuestionnaire {
  id: string
  teamCategoryName: string
  scheduledFor: string
  expiresAt: string
  active: boolean
  responsesCount: number
}

interface Poll {
  id: string
  title: string
  status: string
  expiresAt: string
  totalVotes: number
  options: {
    id: string
    text: string
    votesCount: number
  }[]
}

interface PhysicalTest {
  id: string
  playerName: string
  vma: number
  vo2Max: number
  sprint10m: number
  sprint30m: number
  cmj: number
  sj: number
  illinois: number
  fat: number
  date: string
}

const JerseyIcon = ({
  count,
  active,
  colorClass,
}: {
  count: number
  active: boolean
  colorClass?: string
}) => {
  const defaultColor = active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-550"
  const finalColor = colorClass || defaultColor

  return (
    <svg
      viewBox="0 0 100 100"
      className={`w-9 h-9 transition-colors duration-200 ${finalColor}`}
      fill="currentColor"
    >
      <path d="M 32,8 L 41,20 C 42,19 43,18 45,17 C 48,16 52,16 55,17 C 57,18 58,19 59,20 L 68,8 L 92,20 L 80,42 L 74,38 L 74,92 L 26,92 L 26,38 L 20,42 L 8,20 Z" />
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fill="white"
        className="text-[20px] font-black select-none"
        style={{ fontFamily: "monospace, sans-serif" }}
      >
        {count}
      </text>
    </svg>
  )
}

const ConeIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-9 h-9 transition-all duration-200 ${
      active ? "text-orange-500" : "text-orange-400/60"
    }`}
    fill="currentColor"
  >
    {/* Base of the cone */}
    <ellipse cx="50" cy="85" rx="42" ry="10" />
    
    {/* Bottom Orange Section */}
    <path d="M 18,82 L 27,60 L 73,60 L 82,82 Z" />
    
    {/* Middle White Section */}
    <path d="M 27,58 L 35,40 L 65,40 L 73,58 Z" fill="#ffffff" stroke="#e4e4e7" strokeWidth="1" />
    
    {/* Top Orange Section */}
    <path d="M 35,38 L 42,16 L 58,16 L 65,38 Z" />
    
    {/* Tip/Opening */}
    <ellipse cx="50" cy="16" rx="8" ry="3.5" fill="#ea580c" />
  </svg>
)

const WhistleIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 100 100"
    className={`w-9 h-9 transition-colors duration-200 ${
      active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-550"
    }`}
    fill="currentColor"
  >
    {/* Loop/Ring for lanyard */}
    <circle cx="16" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="5" />
    {/* Whistle body */}
    <path d="M 26,50 C 26,34 38,22 54,22 C 70,22 82,34 82,50 C 82,66 70,78 54,78 L 26,78 Z" />
    {/* Mouthpiece */}
    <path d="M 54,22 L 90,22 L 90,46 L 82,46 L 82,50 L 54,50 Z" />
    {/* Sound escape hole */}
    <rect x="46" y="16" width="14" height="10" rx="2" fill={active ? "#ffffff" : "#18181b"} className="dark:fill-zinc-900" />
  </svg>
)

interface CoachDashboardClientProps {
  roleName: string
  clubLogo: string | null
  categories: Category[]
  players: Player[]
  matches: Match[]
  trainings: Training[]
  dailyQuestionnaires: DailyQuestionnaire[]
  polls: Poll[]
  physicalTests: PhysicalTest[]
}

export default function CoachDashboardClient({
  roleName,
  clubLogo,
  categories,
  players,
  matches,
  trainings,
  dailyQuestionnaires,
  polls,
  physicalTests,
}: CoachDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    "team" | "players" | "available" | "injured" | "matches" | "trainings" | "questionnaires" | "polls" | "physical_tests"
  >("team")

  // Translate role name
  const getRoleLabel = () => {
    switch (roleName) {
      case "ENTRAINEUR_PRINCIPAL":
        return "Entraîneur Principal"
      case "ENTRAINEUR_ADJOINT":
        return "Entraîneur Adjoint"
      case "ENTRAINEUR_GARDIENS":
        return "Entraîneur des Gardiens"
      default:
        return "Staff Technique"
    }
  }

  // Filter lists
  const availablePlayers = players.filter((p) => !p.isInjured)
  const injuredPlayers = players.filter((p) => p.isInjured)

  const tabs = [
    {
      id: "team",
      label: "Équipe",
      icon: clubLogo ? (
        <img src={clubLogo} className="h-6 w-6 object-contain rounded-md" alt="Club Logo" />
      ) : (
        "🛡️"
      ),
      count: categories.length,
    },
    {
      id: "players",
      label: "Effectifs",
      icon: (active: boolean) => (
        <JerseyIcon
          count={players.length}
          active={active}
          colorClass={
            active
              ? "text-blue-600 dark:text-blue-400"
              : "text-blue-500 dark:text-blue-600"
          }
        />
      ),
      count: players.length,
    },
    {
      id: "available",
      label: "Disponibles",
      icon: (active: boolean) => (
        <JerseyIcon
          count={availablePlayers.length}
          active={active}
          colorClass={
            active
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-emerald-500 dark:text-emerald-600"
          }
        />
      ),
      count: availablePlayers.length,
    },
    {
      id: "injured",
      label: "Blessés",
      icon: (active: boolean) => (
        <JerseyIcon
          count={injuredPlayers.length}
          active={active}
          colorClass={
            active
              ? "text-red-600 dark:text-red-400"
              : "text-red-500 dark:text-red-600"
          }
        />
      ),
      count: injuredPlayers.length,
    },
    { id: "matches", label: "Matchs", icon: "⚽", count: matches.length },
    {
      id: "trainings",
      label: "Entraînements",
      icon: (active: boolean) => <WhistleIcon active={active} />,
      count: trainings.length,
    },
    { id: "questionnaires", label: "Questionnaires", icon: "📝", count: dailyQuestionnaires.length },
    { id: "polls", label: "Sondages", icon: "📊", count: polls.length },
    {
      id: "physical_tests",
      label: "Tests Physiques",
      icon: (active: boolean) => <ConeIcon active={active} />,
      count: physicalTests.length,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-350">
      
      {/* 1. Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-4 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md">
              {getRoleLabel()}
            </span>
          </div>
          <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase">
            Tableau de Bord
          </h1>
        </div>
      </section>

      {/* 2. Navigation Tabs - 4 columns per row, larger card-like buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-100/60 dark:bg-zinc-950 p-3 rounded-3xl border border-zinc-200/40 dark:border-zinc-850">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center text-center gap-2 py-4 px-3 rounded-2xl transition-all cursor-pointer border-2 ${
                active
                  ? "bg-white dark:bg-zinc-900 text-emerald-650 dark:text-emerald-400 border-emerald-500 shadow-sm"
                  : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <span className="text-xl sm:text-2xl h-9 flex items-center justify-center">
                {typeof tab.icon === "function" ? (tab.icon as any)(active) : tab.icon}
              </span>
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider truncate max-w-full">
                {tab.label}
              </span>
              <span
                className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                  active
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-450"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-450"
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Tab Content */}
      <div className="animate-in fade-in duration-200">
        
        {/* TABS 1: TEAM */}
        {activeTab === "team" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.length === 0 ? (
              <p className="text-xs font-bold text-zinc-400 py-4">Aucune équipe affectée.</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-4 shadow-sm border-l-4 border-l-emerald-500"
                >
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-widest mt-1">
                    Ligue : {cat.league}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* TABS 2: PLAYERS (ALL EFFECTIFS) */}
        {activeTab === "players" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {players.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-zinc-400">Aucun joueur dans vos effectifs.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-450 uppercase border-b border-zinc-150/70 dark:border-zinc-800">
                      <th className="p-3 w-12 text-center">N°</th>
                      <th className="p-3">Joueur</th>
                      <th className="p-3">Poste</th>
                      <th className="p-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-150/50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 text-center font-black text-zinc-900 dark:text-white bg-zinc-50/20">
                          {p.number !== null ? p.number : "-"}
                        </td>
                        <td className="p-3 font-bold text-zinc-850 dark:text-white uppercase">
                          {p.name}
                        </td>
                        <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-400 uppercase">
                          {p.position}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            p.isInjured
                              ? "bg-red-500/10 text-red-650"
                              : "bg-emerald-500/10 text-emerald-650"
                          }`}>
                            {p.isInjured ? "Blessé" : "Disponible"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TABS 3: AVAILABLE PLAYERS */}
        {activeTab === "available" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {availablePlayers.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-zinc-400">Aucun joueur disponible actuellement.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-455 uppercase border-b border-zinc-150/70 dark:border-zinc-800">
                      <th className="p-3 w-12 text-center">N°</th>
                      <th className="p-3">Joueur</th>
                      <th className="p-3">Poste</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availablePlayers.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-150/50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 text-center font-black text-zinc-900 dark:text-white bg-zinc-50/20">
                          {p.number !== null ? p.number : "-"}
                        </td>
                        <td className="p-3 font-bold text-zinc-850 dark:text-white uppercase">
                          {p.name}
                        </td>
                        <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-400 uppercase">
                          {p.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TABS 4: INJURED PLAYERS */}
        {activeTab === "injured" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {injuredPlayers.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-zinc-400">Aucun joueur blessé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-450 uppercase border-b border-zinc-150/70 dark:border-zinc-800">
                      <th className="p-3 w-12 text-center">N°</th>
                      <th className="p-3">Joueur</th>
                      <th className="p-3">Blessure</th>
                      <th className="p-3 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuredPlayers.map((p) => (
                      <tr key={p.id} className="border-b border-zinc-150/50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 text-center font-black text-zinc-900 dark:text-white bg-zinc-50/20">
                          {p.number !== null ? p.number : "-"}
                        </td>
                        <td className="p-3 font-bold text-zinc-850 dark:text-white uppercase">
                          {p.name}
                        </td>
                        <td className="p-3 font-semibold text-red-650 uppercase">
                          {p.injuryType || "Non spécifié"}
                        </td>
                        <td className="p-3 text-right font-bold text-zinc-700 dark:text-zinc-300">
                          {p.injuryStatus || "En soins"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TABS 5: MATCHES */}
        {activeTab === "matches" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {matches.length === 0 ? (
              <p className="text-xs font-bold text-zinc-400 py-4">Aucun match planifié.</p>
            ) : (
              matches.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-3 shadow-sm flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="font-semibold text-zinc-500 text-[9px] uppercase">
                    📅 {m.date} | 🕒 {m.time}
                  </div>
                  <div className="font-black text-zinc-850 dark:text-white uppercase">
                    {m.title}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                    <span className="text-zinc-450 uppercase">{m.assignedTeam}</span>
                    {m.status === "TERMINE" ? (
                      <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-black text-emerald-600">
                        {m.score}
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold uppercase">{m.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TABS 6: TRAININGS */}
        {activeTab === "trainings" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trainings.length === 0 ? (
              <p className="text-xs font-bold text-zinc-400 py-4">Aucun entraînement planifié.</p>
            ) : (
              trainings.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-3 shadow-sm flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="font-semibold text-zinc-500 text-[9px] uppercase">
                    📅 {t.date} | 🕒 {t.time}
                  </div>
                  <div className="font-black text-zinc-850 dark:text-white uppercase">
                    {t.title}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                    <span className="text-zinc-450 uppercase">{t.assignedTeam}</span>
                    <span className={t.status === "TERMINE" ? "text-emerald-600 font-bold" : "text-zinc-400 font-bold"}>
                      {t.status === "TERMINE" ? "Terminé" : "Programmé"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TABS 7: QUESTIONNAIRES */}
        {activeTab === "questionnaires" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {dailyQuestionnaires.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-zinc-400">Aucun questionnaire créé.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-450 uppercase border-b border-zinc-150/70 dark:border-zinc-800">
                      <th className="p-3">Date</th>
                      <th className="p-3">Équipe</th>
                      <th className="p-3 text-right">Réponses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyQuestionnaires.map((q) => (
                      <tr key={q.id} className="border-b border-zinc-150/50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 font-bold text-zinc-900 dark:text-white">
                          {q.scheduledFor.split("T")[0]}
                        </td>
                        <td className="p-3 font-semibold text-zinc-700 dark:text-zinc-400">
                          {q.teamCategoryName}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          {q.responsesCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TABS 8: POLLS */}
        {activeTab === "polls" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {polls.length === 0 ? (
              <p className="text-xs font-bold text-zinc-400 py-4">Aucun sondage actif.</p>
            ) : (
              polls.map((poll) => (
                <div
                  key={poll.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-3 shadow-sm flex flex-col justify-between gap-2 text-xs"
                >
                  <div className="font-black text-zinc-850 dark:text-white uppercase truncate">
                    {poll.title}
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold mt-1">
                    <span className="text-zinc-450">{poll.totalVotes} votes</span>
                    <span className={poll.status === "ACTIVE" ? "text-emerald-600 font-bold" : "text-zinc-400 font-bold"}>
                      {poll.status === "ACTIVE" ? "En cours" : "Fermé"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TABS 9: PHYSICAL TESTS */}
        {activeTab === "physical_tests" && (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            {physicalTests.length === 0 ? (
              <p className="p-6 text-center text-xs font-bold text-zinc-400">Aucun test physique enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-450 uppercase border-b border-zinc-150/70 dark:border-zinc-800">
                      <th className="p-3">Joueur</th>
                      <th className="p-3 text-center">Date</th>
                      <th className="p-3 text-right">VMA (km/h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {physicalTests.map((pt) => (
                      <tr key={pt.id} className="border-b border-zinc-150/50 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-3 font-bold text-zinc-900 dark:text-white uppercase">
                          {pt.playerName}
                        </td>
                        <td className="p-3 text-center font-semibold text-zinc-500">
                          {pt.date.split("T")[0]}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          {pt.vma}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
