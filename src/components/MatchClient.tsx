"use client"

import { useState, useEffect } from "react"
import { startMatch, recordMatchResult } from "@/app/dashboard/match/actions"

interface Match {
  id: string
  title: string
  location: string // "Domicile" | "Extérieur"
  stadiumName: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  status: "PROGRAMME" | "EN_COURS" | "TERMINE" | "N_A"
  score?: string | null
  assignedTeam?: string | null
}

interface MatchClientProps {
  initialMatches: Match[]
  roleName: string
  clubName: string
}

export default function MatchClient({ initialMatches, roleName, clubName }: MatchClientProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [localScores, setLocalScores] = useState<Record<string, { home: string; away: string }>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // Keep track of time to dynamically update countdowns and "ready to start" state
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000) // Update every 30 seconds
    return () => clearInterval(timer)
  }, [])

  // Can this user modify scores and start matches?
  const canManage = [
    "PRESIDENT",
    "MANAGER_EVO_SPORTS",
    "DIRECTEUR_SPORTIF",
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "SECRETAIRE_GENERAL",
  ].includes(roleName)

  // Initialize local score inputs for matches that are in progress
  useEffect(() => {
    const initialScores: Record<string, { home: string; away: string }> = {}
    matches.forEach((m) => {
      if (m.status === "EN_COURS") {
        if (m.score && m.score.includes("-")) {
          const parts = m.score.split("-").map((p) => p.trim())
          initialScores[m.id] = { home: parts[0] || "0", away: parts[1] || "0" }
        } else {
          initialScores[m.id] = { home: "0", away: "0" }
        }
      }
    })
    setLocalScores(initialScores)
  }, [matches])

  const handleStartMatch = async (matchId: string) => {
    setLoadingId(matchId)
    try {
      const res = await startMatch(matchId)
      if (res.success && res.match) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? (res.match as any) : m))
        )
      } else {
        alert(res.error || "Impossible de démarrer le match.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  const handleSaveScore = async (matchId: string) => {
    const scoreState = localScores[matchId]
    if (!scoreState) return

    const homeScore = scoreState.home.trim() || "0"
    const awayScore = scoreState.away.trim() || "0"
    const scoreString = `${homeScore} - ${awayScore}`

    setLoadingId(matchId)
    try {
      const res = await recordMatchResult(matchId, scoreString)
      if (res.success && res.match) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? (res.match as any) : m))
        )
      } else {
        alert(res.error || "Impossible d'enregistrer le score.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

  const handleScoreChange = (matchId: string, side: "home" | "away", val: string) => {
    // Only allow numbers
    if (val !== "" && !/^\d+$/.test(val)) return
    setLocalScores((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: val,
      },
    }))
  }

  // Format YYYY-MM-DD to readable French date (e.g., "Samedi 6 Juin")
  const formatMatchDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
            Matchs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Liste officielle des rencontres programmées. Les matchs sont planifiés uniquement dans le planning du club.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
            📅 {matches.filter((m) => m.status === "PROGRAMME").length} Programmés
          </span>
          <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
            ⚽ {matches.filter((m) => m.status === "EN_COURS").length} En cours
          </span>
        </div>
      </section>

      {/* Main List */}
      <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white pb-2 border-b border-zinc-150">
          Calendrier et Résultats
        </h3>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-850 dark:bg-zinc-950">
            <span className="text-3xl">📅</span>
            <p className="mt-4 text-sm font-black uppercase text-zinc-400">Aucun match planifié</p>
            <p className="mt-1 text-xs text-zinc-500">Planifiez vos rencontres en allant sur la page &quot;Planning du Club&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {matches.map((match) => {
              // Grayscale flag for terminated or N_A status
              const isGrayscale = match.status === "TERMINE" || match.status === "N_A"

              // Time logic to see if match has started
              const matchStart = new Date(`${match.date}T${match.time}:00`)
              const isTimeReached = currentTime >= matchStart

              // Score editing visibility
              const isEditingScore = match.status === "EN_COURS"

              // Friendly labels for location
              const isHome = match.location === "Domicile"
              const opponentName = match.title
                .replace(/^Match VS /i, "")
                .replace(/^Match contre /i, "")
                .trim()

              return (
                <div
                  key={match.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-all duration-350 hover:shadow-md ${
                    isGrayscale
                      ? "grayscale opacity-75 border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 select-none"
                      : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  {/* Domicile/Exterieur color indicator bar */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isGrayscale
                        ? "bg-zinc-400"
                        : isHome
                        ? "bg-emerald-500"
                        : "bg-blue-500"
                    }`}
                  />

                  {/* Match Info */}
                  <div className="space-y-3 flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-zinc-900 dark:text-zinc-200">
                        {formatMatchDate(match.date)}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        🕒 {match.time}
                      </span>
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isGrayscale
                            ? "bg-zinc-200 text-zinc-650"
                            : isHome
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {match.location}
                      </span>
                      {match.assignedTeam && (
                        <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          ⚽ {match.assignedTeam}
                        </span>
                      )}
                    </div>

                    {/* Team VS Team Display */}
                    <div className="flex items-center gap-4 py-1">
                      <div className="font-black text-base uppercase text-zinc-900 dark:text-white tracking-wide">
                        {isHome ? clubName : opponentName}
                      </div>
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        VS
                      </span>
                      <div className="font-black text-base uppercase text-zinc-900 dark:text-white tracking-wide">
                        {isHome ? opponentName : clubName}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold">
                      <span>📍 Lieu : {match.stadiumName}</span>
                    </div>
                  </div>

                  {/* Actions / Results column */}
                  <div className="flex flex-col items-center md:items-end shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 w-full md:w-auto min-w-[200px] justify-center">
                    {/* TERMINE STATUS */}
                    {match.status === "TERMINE" && (
                      <div className="text-center md:text-right space-y-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                          ✓ Match Terminé
                        </span>
                        <div className="text-2xl font-black text-zinc-700 dark:text-zinc-300 tracking-wider bg-zinc-200/50 dark:bg-zinc-850 px-4 py-2 rounded-xl border border-zinc-300/30">
                          {match.score}
                        </div>
                      </div>
                    )}

                    {/* N_A STATUS */}
                    {match.status === "N_A" && (
                      <div className="text-center md:text-right space-y-2">
                        <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-250 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                          ❌ Expiré / N/A
                        </span>
                        <div className="text-2xl font-black text-zinc-400 dark:text-zinc-500 tracking-wider bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200/50">
                          N/A
                        </div>
                      </div>
                    )}

                    {/* PROGRAMME STATUS (NOT YET TIME) */}
                    {match.status === "PROGRAMME" && !isTimeReached && (
                      <div className="text-center md:text-right space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          ⏱ Programmé
                        </span>
                        <p className="text-[9px] font-bold text-zinc-400 pt-1">
                          Score modifiable à l&apos;heure du match
                        </p>
                      </div>
                    )}

                    {/* PROGRAMME STATUS (TIME REACHED - CAN START) */}
                    {match.status === "PROGRAMME" && isTimeReached && (
                      <div className="text-center md:text-right w-full space-y-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Coup d&apos;envoi
                        </span>
                        {canManage ? (
                          <button
                            onClick={() => handleStartMatch(match.id)}
                            disabled={loadingId === match.id}
                            className="w-full block rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-350 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 shadow-md transition-all active:scale-95 cursor-pointer text-center"
                          >
                            {loadingId === match.id ? "Démarrage..." : "Commencer le match ⚽"}
                          </button>
                        ) : (
                          <p className="text-[9px] font-bold text-zinc-400">
                            En attente de démarrage par le staff
                          </p>
                        )}
                      </div>
                    )}

                    {/* EN_COURS STATUS (EDIT SCORE) */}
                    {isEditingScore && (
                      <div className="w-full space-y-3">
                        <div className="text-center md:text-right">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            Match en cours
                          </span>
                        </div>

                        {canManage ? (
                          <div className="space-y-3">
                            {/* Score Input Fields */}
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black uppercase text-zinc-400">Domicile</span>
                                <input
                                  type="text"
                                  maxLength={2}
                                  value={localScores[match.id]?.home ?? "0"}
                                  onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                                  className="w-12 h-10 rounded-xl border border-zinc-200 bg-white text-center text-lg font-black text-zinc-900 shadow-inner outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                                />
                              </div>
                              <span className="text-lg font-black text-zinc-400 mt-3">-</span>
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black uppercase text-zinc-400">Extérieur</span>
                                <input
                                  type="text"
                                  maxLength={2}
                                  value={localScores[match.id]?.away ?? "0"}
                                  onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                                  className="w-12 h-10 rounded-xl border border-zinc-200 bg-white text-center text-lg font-black text-zinc-900 shadow-inner outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Save Button */}
                            <button
                              onClick={() => handleSaveScore(match.id)}
                              disabled={loadingId === match.id}
                              className="w-full block rounded-xl bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-350 text-white text-xs font-black uppercase tracking-wider py-2 px-4 shadow-md transition-all active:scale-95 cursor-pointer text-center"
                            >
                              {loadingId === match.id ? "Enregistrement..." : "Enregistrer résultat 💾"}
                            </button>
                          </div>
                        ) : (
                          <div className="text-center font-black text-xl text-blue-600 tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                            {match.score || "0 - 0"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
