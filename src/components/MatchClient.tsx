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
  status: "PROGRAMME" | "EN_COURS" | "TERMINE" | "N_A" | "EXPIRE"
  score?: string | null
  assignedTeam?: string | null
}

interface PitchSlot {
  id: string
  type: "GK" | "DEF" | "MID" | "FWD"
  label: string
  x: number
  y: number
  playerId: string | null
}

interface MatchClientProps {
  initialMatches: Match[]
  roleName: string
  clubName: string
  initialCompositions?: any[]
  clubPlayers?: any[]
}

export default function MatchClient({
  initialMatches,
  roleName,
  clubName,
  initialCompositions = [],
  clubPlayers = []
}: MatchClientProps) {
  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [localScores, setLocalScores] = useState<Record<string, { home: string; away: string }>>({})
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // --- Live Match Tracking States ---
  const [liveMatch, setLiveMatch] = useState<Match | null>(null)
  const [liveOpponent, setLiveOpponent] = useState("")
  const [liveHomeScore, setLiveHomeScore] = useState(0)
  const [liveAwayScore, setLiveAwayScore] = useState(0)
  const [livePeriod, setLivePeriod] = useState("1ère mi-temps")
  const [liveSlots, setLiveSlots] = useState<PitchSlot[]>([])
  const [liveSubstitutes, setLiveSubstitutes] = useState<string[]>([])
  const [liveCards, setLiveCards] = useState<Record<string, { yellow: number; red: number }>>({})
  const [livePresences, setLivePresences] = useState<Record<string, "PRESENT" | "ABSENT">>({})
  const [liveTimeline, setLiveTimeline] = useState<string[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)

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

  // --- LocalStorage persistence for Live Match ---
  useEffect(() => {
    const saved = localStorage.getItem("evo_active_live_match")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const matchInList = matches.find((m) => m.id === parsed.matchId)
        if (matchInList && matchInList.status === "EN_COURS") {
          setLiveMatch(matchInList)
          setLiveOpponent(parsed.opponent)
          setLiveHomeScore(parsed.homeScore)
          setLiveAwayScore(parsed.awayScore)
          setLivePeriod(parsed.period)
          setLiveSlots(parsed.slots)
          setLiveSubstitutes(parsed.substitutes)
          setLiveCards(parsed.cards || {})
          setLivePresences(parsed.presences || {})
          setLiveTimeline(parsed.timeline || [])
        }
      } catch (e) {
        console.error("Error restoring live match:", e)
      }
    }
  }, [matches])

  useEffect(() => {
    if (liveMatch) {
      const data = {
        matchId: liveMatch.id,
        opponent: liveOpponent,
        homeScore: liveHomeScore,
        awayScore: liveAwayScore,
        period: livePeriod,
        slots: liveSlots,
        substitutes: liveSubstitutes,
        cards: liveCards,
        presences: livePresences,
        timeline: liveTimeline
      }
      localStorage.setItem("evo_active_live_match", JSON.stringify(data))
    } else {
      localStorage.removeItem("evo_active_live_match")
    }
  }, [liveMatch, liveOpponent, liveHomeScore, liveAwayScore, livePeriod, liveSlots, liveSubstitutes, liveCards, livePresences, liveTimeline])

  // --- Live Match Action Handlers ---
  const startLiveTracking = (match: Match) => {
    const squadPlayers = clubPlayers.filter(
      (p) => p.teamCategory?.name === match.assignedTeam
    )

    const comp = initialCompositions.find(
      (c) => c.teamCategory?.name === match.assignedTeam
    )

    let finalSlots: PitchSlot[] = []
    let finalSubs: string[] = []

    if (comp && Array.isArray(comp.slots)) {
      finalSlots = JSON.parse(JSON.stringify(comp.slots))
      if (Array.isArray(comp.substitutes)) {
        finalSubs = comp.substitutes.filter((id: any) => typeof id === "string")
      }
    } else {
      const def = 4, mid = 3, fwd = 3
      const newSlots: PitchSlot[] = []
      newSlots.push({ id: "GK", type: "GK", label: "GDB", x: 50, y: 88, playerId: null })
      for (let i = 0; i < def; i++) {
        newSlots.push({ id: `DEF-${i}`, type: "DEF", label: "DEF", x: (100 * (i + 1)) / (def + 1), y: 68, playerId: null })
      }
      for (let i = 0; i < mid; i++) {
        newSlots.push({ id: `MID-${i}`, type: "MID", label: "MIL", x: (100 * (i + 1)) / (mid + 1), y: 45, playerId: null })
      }
      for (let i = 0; i < fwd; i++) {
        newSlots.push({ id: `FWD-${i}`, type: "FWD", label: "ATT", x: (100 * (i + 1)) / (fwd + 1), y: 22, playerId: null })
      }

      squadPlayers.forEach((p, idx) => {
        if (idx < newSlots.length) {
          newSlots[idx].playerId = p.id
        } else {
          finalSubs.push(p.id)
        }
      })
      finalSlots = newSlots
    }

    const assignedPlayerIds = new Set(finalSlots.map(s => s.playerId).filter(Boolean))
    squadPlayers.forEach(p => {
      if (!assignedPlayerIds.has(p.id) && !finalSubs.includes(p.id)) {
        finalSubs.push(p.id)
      }
    })

    const initialPresences: Record<string, "PRESENT" | "ABSENT"> = {}
    squadPlayers.forEach((p) => {
      initialPresences[p.id] = "PRESENT"
    })

    const opponent = match.title
      .replace(/^Match VS /i, "")
      .replace(/^Match contre /i, "")
      .trim()

    let home = 0
    let away = 0
    if (match.score && match.score.includes("-")) {
      const parts = match.score.split("-").map(p => parseInt(p.trim()))
      if (!isNaN(parts[0])) home = parts[0]
      if (!isNaN(parts[1])) away = parts[1]
    }

    setLiveMatch(match)
    setLiveOpponent(opponent)
    setLiveHomeScore(home)
    setLiveAwayScore(away)
    setLivePeriod("1ère mi-temps")
    setLiveSlots(finalSlots)
    setLiveSubstitutes(finalSubs)
    setLiveCards({})
    setLivePresences(initialPresences)
    setLiveTimeline(["⚽ Début de la rencontre"])
  }

  const handleSubstitute = (slotId: string, outPlayerId: string, inPlayerId: string) => {
    const outPlayer = clubPlayers.find(p => p.id === outPlayerId)
    const inPlayer = clubPlayers.find(p => p.id === inPlayerId)
    const outName = outPlayer?.user?.name || "Joueur"
    const inName = inPlayer?.user?.name || "Joueur"

    setLiveSlots(prev => prev.map(s => s.id === slotId ? { ...s, playerId: inPlayerId } : s))
    setLiveSubstitutes(prev => [...prev.filter(id => id !== inPlayerId), outPlayerId])

    setLiveTimeline(prev => [
      ...prev,
      `🔄 [${livePeriod}] Changement : ${inName} entre à la place de ${outName}`
    ])
    setSelectedPlayerId(null)
  }

  const handleAddGoal = (playerId: string | null) => {
    setLiveHomeScore(prev => prev + 1)
    let logMsg = `⚽ [${livePeriod}] BUT pour ${clubName} !`
    if (playerId) {
      const p = clubPlayers.find(pl => pl.id === playerId)
      if (p) logMsg += ` par ${p.user?.name || "Joueur"}`
    }
    setLiveTimeline(prev => [...prev, logMsg])
    setSelectedPlayerId(null)
  }

  const handleAddOpponentGoal = () => {
    setLiveAwayScore(prev => prev + 1)
    setLiveTimeline(prev => [...prev, `⚽ [${livePeriod}] BUT pour ${liveOpponent || "l'adversaire"} !`])
  }

  const handlePeriodChange = (newPeriod: string) => {
    setLivePeriod(newPeriod)
    setLiveTimeline(prev => [...prev, `⏱ [${newPeriod}] Coup d'envoi`])
  }

  const handleToggleAbsence = (playerId: string) => {
    setLivePresences(prev => {
      const current = prev[playerId] || "PRESENT"
      const next = current === "PRESENT" ? "ABSENT" : "PRESENT"

      if (next === "ABSENT") {
        const slotWithPlayer = liveSlots.find(s => s.playerId === playerId)
        if (slotWithPlayer) {
          const firstPresentSubId = liveSubstitutes.find(subId => (livePresences[subId] || "PRESENT") === "PRESENT")
          if (firstPresentSubId) {
            handleSubstitute(slotWithPlayer.id, playerId, firstPresentSubId)
          } else {
            setLiveSlots(slotsPrev => slotsPrev.map(s => s.id === slotWithPlayer.id ? { ...s, playerId: null } : s))
            setLiveSubstitutes(subsPrev => [...subsPrev, playerId])
          }
        }
      }

      return {
        ...prev,
        [playerId]: next
      }
    })
  }

  const handleAddCard = (playerId: string, cardType: "YELLOW" | "RED") => {
    const p = clubPlayers.find(pl => pl.id === playerId)
    const name = p?.user?.name || "Joueur"

    setLiveCards(prev => {
      const current = prev[playerId] || { yellow: 0, red: 0 }
      let next = { ...current }

      if (cardType === "YELLOW") {
        next.yellow += 1
        if (next.yellow >= 2) {
          next.red = 1
          setLiveTimeline(timelinePrev => [
            ...timelinePrev,
            `🟨 [${livePeriod}] Carton jaune pour ${name}`,
            `🟥 [${livePeriod}] Expulsion de ${name} (2ème carton jaune)`
          ])
          const slotWithPlayer = liveSlots.find(s => s.playerId === playerId)
          if (slotWithPlayer) {
            setLiveSlots(slotsPrev => slotsPrev.map(s => s.id === slotWithPlayer.id ? { ...s, playerId: null } : s))
          }
        } else {
          setLiveTimeline(timelinePrev => [
            ...timelinePrev,
            `🟨 [${livePeriod}] Carton jaune pour ${name}`
          ])
        }
      } else {
        next.red = 1
        setLiveTimeline(timelinePrev => [
          ...timelinePrev,
          `🟥 [${livePeriod}] Carton rouge direct pour ${name}`
        ])
        const slotWithPlayer = liveSlots.find(s => s.playerId === playerId)
        if (slotWithPlayer) {
          setLiveSlots(slotsPrev => slotsPrev.map(s => s.id === slotWithPlayer.id ? { ...s, playerId: null } : s))
        }
      }

      return {
        ...prev,
        [playerId]: next
      }
    })
    setSelectedPlayerId(null)
  }

  const handleCloseLiveMatch = async () => {
    if (!liveMatch) return

    const confirmMsg = `Voulez-vous vraiment clôturer le match contre "${liveOpponent || "l'adversaire"}" avec le score final ${liveHomeScore} - ${liveAwayScore} ?`
    if (!confirm(confirmMsg)) return

    setLoadingId(liveMatch.id)
    try {
      const scoreString = `${liveHomeScore} - ${liveAwayScore}`

      const squadPlayers = clubPlayers.filter(
        (p) => p.teamCategory?.name === liveMatch.assignedTeam
      )
      const attendances = squadPlayers.map((p) => ({
        playerId: p.id,
        status: livePresences[p.id] || "PRESENT"
      }))

      const res = await recordMatchResult(
        liveMatch.id,
        scoreString,
        liveOpponent,
        attendances
      )

      if (res.success && res.match) {
        setMatches((prev) =>
          prev.map((m) => (m.id === liveMatch.id ? (res.match as any) : m))
        )
        setLiveMatch(null)
        localStorage.removeItem("evo_active_live_match")
      } else {
        alert(res.error || "Impossible de clôturer le match.")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingId(null)
    }
  }

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

  if (liveMatch) {
    const squadPlayers = clubPlayers.filter(
      (p) => p.teamCategory?.name === liveMatch.assignedTeam
    )
    const activeMenuPlayer = clubPlayers.find(p => p.id === selectedPlayerId)
    const activeMenuSlot = liveSlots.find(s => s.playerId === selectedPlayerId)
    const isMenuPlayerStarter = !!activeMenuSlot

    const isAbsent = selectedPlayerId ? livePresences[selectedPlayerId] === "ABSENT" : false
    const cards = selectedPlayerId ? (liveCards[selectedPlayerId] || { yellow: 0, red: 0 }) : { yellow: 0, red: 0 }

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Header Board */}
        <div className="bg-zinc-950 text-white rounded-3xl border border-zinc-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLiveMatch(null)}
              className="rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white px-4 py-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              ⬅️ Retour
            </button>
            <div className="text-left">
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse flex items-center gap-1.5 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                EN DIRECT
              </span>
              <h2 className="text-xl font-black uppercase tracking-wide mt-1 text-zinc-300">
                Suivi : {liveMatch.assignedTeam || "Équipe"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">DOMICILE</span>
              <span className="text-lg font-bold text-zinc-300 mt-1 uppercase max-w-[100px] truncate">
                {liveMatch.location === "Domicile" ? clubName : liveOpponent || "Adversaire"}
              </span>
            </div>
            <div className="flex items-center gap-4 bg-zinc-900/80 px-6 py-3 rounded-2xl border border-zinc-800 font-mono text-4xl font-black text-white tracking-widest shadow-inner">
              <span>{liveHomeScore}</span>
              <span className="text-zinc-650">:</span>
              <span>{liveAwayScore}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">EXTÉRIEUR</span>
              <span className="text-lg font-bold text-zinc-300 mt-1 uppercase max-w-[100px] truncate">
                {liveMatch.location === "Extérieur" ? clubName : liveOpponent || "Adversaire"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCloseLiveMatch}
              disabled={loadingId === liveMatch.id}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-5 py-3 text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer disabled:bg-zinc-800"
            >
              {loadingId === liveMatch.id ? "Clôture..." : "🏆 Clôturer le match"}
            </button>
          </div>
        </div>

        {/* Configuration cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Nom de l&apos;équipe adverse</label>
              <input
                type="text"
                value={liveOpponent}
                onChange={(e) => setLiveOpponent(e.target.value)}
                placeholder="Ex: Real Madrid"
                className="w-full mt-1.5 rounded-xl border border-zinc-200 bg-zinc-50 pl-4 pr-3 py-2.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              />
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => setLiveHomeScore(prev => Math.max(0, prev - 1))}
                  className="rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-650 text-xs font-black px-3 py-1.5 transition-all"
                >
                  - Notre Score
                </button>
                <button
                  onClick={() => setLiveHomeScore(prev => prev + 1)}
                  className="rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-xs font-black px-3 py-1.5 transition-all"
                >
                  + Notre Score
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLiveAwayScore(prev => Math.max(0, prev - 1))}
                  className="rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-650 text-xs font-black px-3 py-1.5 transition-all"
                >
                  - Adv
                </button>
                <button
                  onClick={handleAddOpponentGoal}
                  className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-550 text-xs font-black px-3 py-1.5 transition-all"
                >
                  + Adv Goal ⚽
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
            <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">Temps de jeu & Périodes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["1ère mi-temps", "2ème mi-temps", "Prolongations", "Tirs au but"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`rounded-xl py-2 px-1 text-[9px] font-black uppercase tracking-wider text-center transition-all cursor-pointer ${
                    livePeriod === p
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase text-center">
              Période active : <span className="text-blue-500 dark:text-blue-400 font-black">{livePeriod}</span>
            </div>
          </div>
        </div>

        {/* Live Tracking Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Visual Pitch */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                🏟️ Composition & Terrain de Jeu
              </h3>
              <span className="text-[9px] text-zinc-400 font-bold uppercase">Cliquez sur un joueur pour le gérer</span>
            </div>

            <div className="bg-gradient-to-b from-emerald-800 to-emerald-950 rounded-3xl relative h-[560px] border-2 border-emerald-700 shadow-2xl overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-white/10 rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-white/10 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/10 pointer-events-none" />

              {liveSlots.map((slot) => {
                 const player = squadPlayers.find(p => p.id === slot.playerId)
                 const name = player?.user?.name || "Vide"
                 const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
                 const slotCards = liveCards[slot.playerId || ""] || { yellow: 0, red: 0 }
                 const slotIsAbsent = livePresences[slot.playerId || ""] === "ABSENT"

                return (
                  <div
                    key={slot.id}
                    onClick={() => slot.playerId && setSelectedPlayerId(slot.playerId)}
                    style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer ${
                      !slot.playerId ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-lg transition-all duration-200 border-2 ${
                        slotIsAbsent
                          ? "bg-zinc-800 text-zinc-550 border-zinc-705"
                          : slot.type === "GK"
                          ? "bg-amber-500 text-zinc-950 border-amber-400 group-hover:scale-110"
                          : "bg-blue-650 text-white border-blue-400 group-hover:scale-110"
                      }`}
                    >
                      {slot.playerId ? initials : "➕"}
                    </div>

                    <div className="mt-1 bg-zinc-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm max-w-[80px] truncate uppercase tracking-wider text-center border border-zinc-800">
                      {slot.playerId ? name : slot.label}
                    </div>

                    <div className="absolute -top-2 -right-2 flex items-center gap-0.5">
                      {slotCards.yellow > 0 && (
                        <span className="w-3.5 h-4.5 bg-yellow-400 rounded-sm flex items-center justify-center text-[8px] font-black text-black shadow-sm">
                          {slotCards.yellow}
                        </span>
                      )}
                      {slotCards.red > 0 && (
                        <span className="w-3.5 h-4.5 bg-red-650 rounded-sm flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                          1
                        </span>
                      )}
                      {slotIsAbsent && (
                        <span className="w-4.5 h-4.5 bg-red-650 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                          ❌
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Substitutes & timeline */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[280px]">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-150 dark:border-zinc-800 pb-2 shrink-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                  💺 Banc ({liveSubstitutes.length})
                </h4>
                <span className="text-[8px] text-zinc-400 font-bold uppercase">Actions</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {liveSubstitutes.length === 0 ? (
                  <div className="text-center py-8 text-xs text-zinc-400 font-bold uppercase">
                    Aucun joueur
                  </div>
                ) : (
                  liveSubstitutes.map((playerId) => {
                    const player = squadPlayers.find(p => p.id === playerId)
                    if (!player) return null

                    const name = player.user?.name || "Joueur"
                    const isAbsent = livePresences[playerId] === "ABSENT"
                    const cards = liveCards[playerId] || { yellow: 0, red: 0 }

                    return (
                      <div
                        key={playerId}
                        onClick={() => setSelectedPlayerId(playerId)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-750 ${
                          isAbsent
                            ? "bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-100 dark:border-zinc-850 opacity-60"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${isAbsent ? "bg-red-500" : "bg-emerald-500"}`} />
                          <div className="text-[11px] font-black uppercase text-zinc-800 dark:text-zinc-200 truncate max-w-[120px]">
                            {name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[8px] font-black uppercase text-zinc-450 bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {player.position || "MIL"}
                          </span>
                          {cards.yellow > 0 && <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm" />}
                          {cards.red > 0 && <span className="w-2.5 h-3.5 bg-red-600 rounded-sm" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col h-[260px]">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-150 dark:border-zinc-800 pb-2 shrink-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                  📜 Journal des Événements
                </h4>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                {liveTimeline.map((log, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Options Modal overlay */}
        {selectedPlayerId && activeMenuPlayer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">ACTION JOUEUR</span>
                <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                  {activeMenuPlayer.user?.name || "Joueur"}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">
                  {activeMenuPlayer.position || "Milieu"} • #{activeMenuPlayer.number || 0} ({isMenuPlayerStarter ? "Titulaire" : "Remplaçant"})
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {!isAbsent && (
                  <button
                    onClick={() => handleAddGoal(selectedPlayerId)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider py-2.5 cursor-pointer transition-all active:scale-95"
                  >
                    ⚽ Marquer un But
                  </button>
                )}

                {!isAbsent && cards.yellow < 2 && cards.red === 0 && (
                  <button
                    onClick={() => handleAddCard(selectedPlayerId, "YELLOW")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-350 text-zinc-950 text-xs font-black uppercase tracking-wider py-2.5 cursor-pointer transition-all active:scale-95"
                  >
                    🟨 Carton Jaune
                  </button>
                )}

                {!isAbsent && cards.red === 0 && (
                  <button
                    onClick={() => handleAddCard(selectedPlayerId, "RED")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-650 hover:bg-red-550 text-white text-xs font-black uppercase tracking-wider py-2.5 cursor-pointer transition-all active:scale-95"
                  >
                    🟥 Carton Rouge direct
                  </button>
                )}

                {isMenuPlayerStarter && activeMenuSlot && !isAbsent && (
                  <div className="space-y-1.5 border-t border-zinc-150 dark:border-zinc-800 pt-3">
                    <label className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">Remplacer par :</label>
                    <div className="max-h-[120px] overflow-y-auto space-y-1.5">
                      {liveSubstitutes.filter(subId => (livePresences[subId] || "PRESENT") === "PRESENT").length === 0 ? (
                        <p className="text-[9px] text-zinc-500 font-bold uppercase text-center">Aucun remplaçant disponible</p>
                      ) : (
                        liveSubstitutes
                          .filter(subId => (livePresences[subId] || "PRESENT") === "PRESENT")
                          .map(subId => {
                            const subPlayer = clubPlayers.find(pl => pl.id === subId)
                            if (!subPlayer) return null
                            return (
                              <button
                                key={subId}
                                onClick={() => handleSubstitute(activeMenuSlot.id, selectedPlayerId, subId)}
                                className="w-full text-left rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-150 dark:hover:bg-zinc-850 px-3 py-2 text-[10px] font-bold uppercase text-zinc-800 dark:text-zinc-200 transition-all flex justify-between items-center cursor-pointer"
                              >
                                <span>{subPlayer.user?.name}</span>
                                <span className="text-[8px] font-black text-zinc-400">{subPlayer.position}</span>
                              </button>
                            )
                          })
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    handleToggleAbsence(selectedPlayerId)
                    setSelectedPlayerId(null)
                  }}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider py-2.5 cursor-pointer transition-all active:scale-95 border ${
                    isAbsent
                      ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
                      : "bg-red-500/10 hover:bg-red-550/20 border-red-550/20 text-red-550"
                  }`}
                >
                  {isAbsent ? "✅ Déclarer Présent" : "❌ Déclarer Absent"}
                </button>
              </div>

              <button
                onClick={() => setSelectedPlayerId(null)}
                className="w-full text-center rounded-xl bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-500 dark:text-zinc-400 text-xs font-black uppercase tracking-wider py-2 transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    )
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
              // Grayscale flag for terminated, expired or N_A status
              const isGrayscale = match.status === "TERMINE" || match.status === "N_A" || match.status === "EXPIRE"

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

                    {/* EXPIRE / N_A STATUS */}
                    {(match.status === "N_A" || match.status === "EXPIRE") && (
                      <div className="text-center md:text-right space-y-2">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-500 bg-red-500/10 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                          ⚠️ Expiré (Non commencé)
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
                            {/* Live Tracking Hub Button */}
                            <button
                              onClick={() => startLiveTracking(match)}
                              className="w-full block rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider py-2.5 px-4 shadow-md transition-all active:scale-95 cursor-pointer text-center"
                            >
                              🔴 Suivre & Gérer en Direct
                            </button>

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
