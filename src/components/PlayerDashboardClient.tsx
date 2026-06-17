"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { submitVote } from "@/app/dashboard/sondage/actions"

export interface PlayerDashboardClientProps {
  playerProfile: {
    id: string
    name: string
    position: string | null
    number: number | null
    teamCategoryName: string | null
  }
  todayEvents: Array<{
    id: string
    title: string
    type: string
    time: string
    location: string
    details: string | null
    status: string
  }>
  pendingQuestionnaires: Array<{
    id: string
    expiresAt: string
  }>
  latestPhysicalTest: {
    vma: number
    vo2Max: number
    sprint10m: number
    sprint30m: number
    cmj: number
    sj: number
    illinois: number
    fat: number
    date: string
  } | null
  unreadMessages: Array<{
    id: string
    senderName: string
    content: string
    createdAt: string
    channelName: string
  }>
  activePolls: Array<{
    id: string
    title: string
    description: string | null
    type: string
    status: string
    expiresAt: string
    voted: boolean
    userVoteOptionId: string | null
    totalVotes: number
    options: Array<{
      id: string
      text: string
      votesCount: number
    }>
  }>
  composition: {
    formation: {
      defenders: number
      midfielders: number
      forwards: number
    }
    slots: Array<{
      id: string
      type: string
      label: string
      x: number
      y: number
      playerId: string | null
    }>
    substitutes: string[]
    communicatedAt: string | null
  } | null
  categoryPlayers: Array<{
    id: string
    name: string
    number: number
    position: string
  }>
}

const JerseyIcon = ({ number }: { number: number | null }) => (
  <div className="relative flex items-center justify-center w-14 h-14 select-none shrink-0 animate-in zoom-in duration-300">
    <svg className="w-full h-full text-emerald-500 dark:text-emerald-400 fill-current drop-shadow-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 5.5V9h2.5v11h13V9H21V5.5L18 2h-3.5c-.2 1.3-1.3 2.5-2.5 2.5S9.7 3.3 9.5 2H6z" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-base font-black text-white dark:text-zinc-950 mt-1">
      {number !== null ? number : "🏃‍♂️"}
    </span>
  </div>
)

export default function PlayerDashboardClient({
  playerProfile,
  todayEvents,
  pendingQuestionnaires,
  latestPhysicalTest,
  unreadMessages,
  activePolls,
  composition,
  categoryPlayers = [],
}: PlayerDashboardClientProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<"dashboard" | "composition">("dashboard")

  const handleCastVote = async (pollId: string, optionId: string) => {
    startTransition(async () => {
      const res = await submitVote(pollId, optionId)
      if (res.success) {
        alert("Vote enregistré avec succès !")
        window.location.reload()
      } else {
        alert(`Erreur lors du vote: ${res.error}`)
      }
    })
  }
  
  // Renders type badge for planning events
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "MATCH":
        return "bg-red-500/10 text-red-650 dark:bg-red-550/20 dark:text-red-400 border border-red-500/20"
      case "TRAINING":
        return "bg-emerald-500/10 text-emerald-650 dark:bg-emerald-550/20 dark:text-emerald-400 border border-emerald-500/20"
      case "MEETING":
        return "bg-blue-500/10 text-blue-650 dark:bg-blue-550/20 dark:text-blue-400 border border-blue-500/20"
      case "MEDICAL_EXAM":
        return "bg-rose-500/10 text-rose-650 dark:bg-rose-550/20 dark:text-rose-400 border border-rose-500/20"
      case "EXCURSION":
        return "bg-purple-500/10 text-purple-650 dark:bg-purple-550/20 dark:text-purple-400 border border-purple-500/20"
      default:
        return "bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200"
    }
  }

  // Translate event type
  const translateType = (type: string) => {
    switch (type) {
      case "MATCH":
        return "Match"
      case "TRAINING":
        return "Entraînement"
      case "MEETING":
        return "Réunion"
      case "MEDICAL_EXAM":
        return "Bilan médical"
      case "EXCURSION":
        return "Excursion"
      default:
        return type
    }
  }

  // Calculate physical score if test exists
  const physicalScore = useMemo(() => {
    if (!latestPhysicalTest) return null
    const t = latestPhysicalTest
    // Normalize each metric
    const vmaScore = Math.max(0, Math.min(100, ((t.vma - 12) / 10) * 100))
    const vo2Score = Math.max(0, Math.min(100, ((t.vo2Max - 40) / 40) * 100))
    const sprint10Score = Math.max(0, Math.min(100, ((2.4 - t.sprint10m) / 0.9) * 100))
    const sprint30Score = Math.max(0, Math.min(100, ((4.8 - t.sprint30m) / 1.3) * 100))
    const cmjScore = Math.max(0, Math.min(100, ((t.cmj - 20) / 45) * 100))
    const sjScore = Math.max(0, Math.min(100, ((t.sj - 15) / 45) * 100))
    const illinoisScore = Math.max(0, Math.min(100, ((21 - t.illinois) / 7.5) * 100))
    const fatScore = Math.max(0, Math.min(100, 100 - Math.abs(t.fat - 10) * 10))

    const total =
      vmaScore * 0.15 +
      vo2Score * 0.15 +
      sprint10Score * 0.10 +
      sprint30Score * 0.15 +
      cmjScore * 0.10 +
      sjScore * 0.10 +
      illinoisScore * 0.15 +
      fatScore * 0.10

    return Math.round(total)
  }, [latestPhysicalTest])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header Hero Welcome */}
      <section className="rounded-3xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <JerseyIcon number={playerProfile.number} />
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-black uppercase tracking-widest">ESPACE JOUEUR</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
              Salut, {playerProfile.name} !
            </h1>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {playerProfile.position || "Joueur"} • {playerProfile.teamCategoryName || "Sans Équipe"}
            </p>
          </div>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider self-start md:self-auto">
            🟢 Connecté
          </span>
          <p className="text-[10px] text-zinc-400 font-bold mt-1.5 uppercase tracking-wider" suppressHydrationWarning>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      {/* Tab Swifter Switcher */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-1 cursor-pointer transition-all ${
            activeTab === "dashboard"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
              : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
          }`}
        >
          🎛️ Tableau de bord
        </button>
        <button
          onClick={() => setActiveTab("composition")}
          className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 px-1 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "composition"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
              : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
          }`}
        >
          ⚽ Composition de match
          {composition && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title="Nouvelle composition publiée" />
          )}
        </button>
      </div>

      {activeTab === "dashboard" ? (
        /* 2. Grid Dashboard Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT & CENTER COLUMN (2/3): Today's events and Unread messages */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Scheduled Events */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                📅 Séance(s) d&apos;aujourd&apos;hui
              </h3>
              <span className="text-[10px] font-black text-zinc-450 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                {todayEvents.length} programmée(s)
              </span>
            </div>

            {todayEvents.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 text-xs font-bold">
                Aucune séance ou événement planifié pour aujourd&apos;hui.
              </div>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20 transition-all gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${getTypeBadge(evt.type)}`}>
                          {translateType(evt.type)}
                        </span>
                        <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase">
                          {evt.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
                        📍 {evt.location} {evt.details ? `• ${evt.details}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-450 bg-emerald-500/5 border border-emerald-500/10 px-2.5 py-1 rounded-xl">
                        {evt.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unread Messages List */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                💬 Messages non lus
              </h3>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                unreadMessages.length > 0
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-450"
              }`}>
                {unreadMessages.length} non lu(s)
              </span>
            </div>

            {unreadMessages.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450 text-xs font-semibold">
                Tous vos messages sont lus. Super !
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-[280px] overflow-y-auto space-y-2.5 pr-1">
                  {unreadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 rounded-2xl border border-red-500/10 bg-red-500/[0.01] hover:bg-red-500/[0.02] transition-colors space-y-1 relative pl-6"
                    >
                      <span className="absolute left-2 top-[18px] h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[10px] font-black uppercase text-zinc-450">
                          {msg.senderName} dans <span className="text-red-500">{msg.channelName}</span>
                        </span>
                        <span className="text-[9px] text-zinc-400 font-bold shrink-0" suppressHydrationWarning>
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 text-right">
                  <Link
                    href="/dashboard/messagerie"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all shadow-md shadow-red-500/15"
                  >
                    Ouvrir la Messagerie ➡️
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN (1/3): Questionnaires and Physical tests */}
        <div className="space-y-6">
          
          {/* Daily Questionnaire Card */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              📝 Questionnaire Quotidien
            </h3>

            {pendingQuestionnaires.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-4 py-6 space-y-3 bg-emerald-500/[0.03] border border-emerald-500/15 rounded-2xl">
                <span className="text-3xl">✅</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-emerald-650 uppercase">Complété</h4>
                  <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                    Vous avez répondu au questionnaire d&apos;aujourd&apos;hui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 py-6 space-y-4 bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl">
                <span className="text-3xl animate-bounce">⏳</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-amber-600 uppercase">Questionnaire en cours</h4>
                  <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                    Un questionnaire quotidien attend vos réponses pour analyser votre forme (sommeil, fatigue, etc.).
                  </p>
                </div>
                <Link
                  href="/dashboard/quotidienne"
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider py-2.5 transition-all shadow-md shadow-amber-500/15 text-center"
                >
                  Répondre maintenant
                </Link>
              </div>
            )}
          </div>

          {/* Active Polls Card */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              📊 Sondages en cours
            </h3>

            {activePolls.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-450 text-[11px] font-bold">
                Aucun sondage actif pour le moment.
              </div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                {activePolls.map((poll) => {
                  const hasVoted = poll.voted
                  return (
                    <div
                      key={poll.id}
                      className="p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/10 space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase leading-snug">
                          {poll.title}
                        </h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                          hasVoted
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                            : "bg-emerald-500/10 text-emerald-650 dark:text-emerald-400"
                        }`}>
                          {hasVoted ? "A voté" : "Ouvert"}
                        </span>
                      </div>

                      {poll.description && (
                        <p className="text-[10px] text-zinc-500 font-semibold leading-normal">
                          {poll.description}
                        </p>
                      )}

                      {/* Options list */}
                      <div className="space-y-2 pt-1">
                        {poll.options.map((opt) => {
                          const percentage = poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0
                          const isSelected = poll.userVoteOptionId === opt.id

                          if (hasVoted) {
                            return (
                              <div
                                key={opt.id}
                                className={`w-full rounded-xl border p-2.5 flex items-center justify-between text-[11px] bg-zinc-50/50 dark:bg-zinc-950/20 relative overflow-hidden ${
                                  isSelected ? "border-emerald-500 dark:border-emerald-700" : "border-zinc-150/60 dark:border-zinc-800"
                                }`}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-1000 ease-out"
                                  style={{ width: `${percentage}%` }}
                                />
                                <span className="font-bold text-zinc-700 dark:text-zinc-300 relative z-10">
                                  {opt.text} {isSelected && "⭐️"}
                                </span>
                                <span className="font-black text-emerald-650 dark:text-emerald-400 relative z-10 shrink-0 ml-2">
                                  {percentage}% ({opt.votesCount})
                                </span>
                              </div>
                            )
                          } else {
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleCastVote(poll.id, opt.id)}
                                disabled={isPending}
                                className="w-full rounded-xl border border-zinc-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/5 p-2.5 flex items-center justify-between text-[11px] font-bold text-zinc-700 dark:text-zinc-350 transition-all duration-200 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                              >
                                <span>{opt.text}</span>
                                <span className="text-[10px] text-emerald-500">🗳️ Voter</span>
                              </button>
                            )
                          }
                        })}
                      </div>

                      <div className="pt-2 text-[9px] text-zinc-400 font-bold border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <span>Total: {poll.totalVotes} votes</span>
                        <span suppressHydrationWarning>Exp: {new Date(poll.expiresAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="pt-1">
              <Link
                href="/dashboard/sondage"
                className="w-full block rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-750 dark:text-zinc-300 font-black text-[10px] uppercase tracking-wider py-2.5 transition-colors text-center"
              >
                Voir tous les sondages
              </Link>
            </div>
          </div>

          {/* Physical Tests Summary Card */}
          <div className="rounded-3xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              🧪 Aptitude Physique
            </h3>

            {!latestPhysicalTest ? (
              <div className="p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 text-[11px] font-bold">
                Aucun test physique enregistré par le staff technique.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Note Athlétique Globale */}
                <div className="flex items-center justify-between p-3.5 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-2xl">
                  <div>
                    <span className="block text-[8px] text-zinc-400 font-black uppercase tracking-widest">Note globale</span>
                    <span className="text-2xl font-black text-zinc-950 dark:text-white">{physicalScore}/100</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">
                    {physicalScore && physicalScore >= 85
                      ? "Elite 🏆"
                      : physicalScore && physicalScore >= 70
                      ? "Très Bien 👍"
                      : physicalScore && physicalScore >= 50
                      ? "Standard ⚡"
                      : "En Dév 📈"}
                  </span>
                </div>

                {/* 3 primary metrics */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/10">
                    <span className="block text-[8px] text-zinc-400 font-black uppercase tracking-wider">Endurance</span>
                    <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 block mt-0.5">VMA: {latestPhysicalTest.vma}</span>
                  </div>
                  <div className="p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/10">
                    <span className="block text-[8px] text-zinc-400 font-black uppercase tracking-wider">Vitesse</span>
                    <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 block mt-0.5">30m: {latestPhysicalTest.sprint30m}s</span>
                  </div>
                </div>

                <div className="pt-1">
                  <Link
                    href="/dashboard/test"
                    className="w-full block rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350 font-black text-[10px] uppercase tracking-wider py-2.5 transition-colors text-center"
                  >
                    Détail des Aptitudes Physiques
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>

        </div>
      ) : (
        /* Match Composition Tab Content */
        <div className="space-y-6 animate-in fade-in duration-300">
          {!composition ? (
            <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-850 dark:bg-zinc-900 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <span className="text-5xl block animate-bounce">⚽</span>
              <h3 className="text-lg font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                Aucune composition publiée
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                L&apos;entraîneur principal n&apos;a pas encore communiqué de composition de match officielle pour votre équipe ({playerProfile.teamCategoryName || "Sans Équipe"}).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tactical pitch viewer (Left 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center rounded-2xl border border-zinc-200/50 bg-white p-4 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                  <span className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">
                    Schéma Tactique de Match : <span className="text-emerald-500 font-extrabold">{composition.formation.defenders}-{composition.formation.midfielders}-{composition.formation.forwards}</span>
                  </span>
                  {composition.communicatedAt && (
                    <span className="text-[10px] text-zinc-400 font-bold" suppressHydrationWarning>
                      Publiée le : {new Date(composition.communicatedAt).toLocaleDateString("fr-FR")} à {new Date(composition.communicatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <div className="w-full h-[550px] rounded-3xl border border-emerald-600/30 bg-[#166534] shadow-2xl relative overflow-hidden select-none">
                  {/* Field Markings */}
                  <div className="absolute inset-4 border-2 border-white/20 pointer-events-none rounded-2xl" />
                  <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/20 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full border-2 border-white/20 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/25 pointer-events-none" />

                  {/* Penalty Box Top */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 h-32 w-[60%] border-b-2 border-x-2 border-white/20 pointer-events-none" />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 h-12 w-[25%] border-b-2 border-x-2 border-white/20 pointer-events-none" />
                  <div className="absolute top-28 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/25 pointer-events-none" />

                  {/* Penalty Box Bottom */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-32 w-[65%] border-t-2 border-x-2 border-white/20 pointer-events-none" />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-12 w-[25%] border-t-2 border-x-2 border-white/20 pointer-events-none" />
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/25 pointer-events-none" />

                  {/* Corner Arcs */}
                  <div className="absolute top-4 left-4 h-6 w-6 border-b border-r border-white/10 rounded-br-full pointer-events-none" />
                  <div className="absolute top-4 right-4 h-6 w-6 border-b border-l border-white/10 rounded-bl-full pointer-events-none" />
                  <div className="absolute bottom-4 left-4 h-6 w-6 border-t border-r border-white/10 rounded-tr-full pointer-events-none" />
                  <div className="absolute bottom-4 right-4 h-6 w-6 border-t border-l border-white/10 rounded-tl-full pointer-events-none" />

                  {/* Pitch Grass Striping */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-full h-[12.5%] ${idx % 2 === 0 ? "bg-black" : "bg-transparent"}`}
                      />
                    ))}
                  </div>

                  {/* Render Pitch Slots */}
                  {composition.slots.map((slot) => {
                    const assignedPlayer = categoryPlayers.find((p) => p.id === slot.playerId)
                    const isMe = assignedPlayer?.id === playerProfile.id

                    return (
                      <div
                        key={slot.id}
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                      >
                        <div
                          className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl transition-all select-none relative ${
                            assignedPlayer
                              ? isMe
                                ? "bg-amber-400 border-amber-300 text-zinc-950 scale-110 ring-4 ring-amber-450/40"
                                : slot.type === "GK"
                                ? "bg-amber-500 border-white text-zinc-950"
                                : "bg-emerald-500 border-white text-white"
                              : "bg-black/35 border-dashed border-white/40 text-white/50"
                          }`}
                        >
                          {assignedPlayer ? (
                            <>
                              <span className="text-sm sm:text-base font-black">
                                {assignedPlayer.number}
                              </span>
                              <span className="text-[7px] font-black uppercase bg-black/20 px-1 rounded-sm mt-0.5">
                                {slot.label}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs sm:text-sm font-black">+</span>
                              <span className="text-[8px] font-bold uppercase tracking-wider">
                                {slot.label}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="text-center mt-1.5 max-w-[85px] mx-auto pointer-events-none">
                          <p className={`text-[9px] sm:text-xs font-black border px-1.5 py-0.5 rounded-md drop-shadow-md truncate ${
                            isMe
                              ? "bg-amber-400 border-amber-300 text-zinc-950"
                              : "bg-zinc-950/70 border-white/10 text-white"
                          }`}>
                            {assignedPlayer ? assignedPlayer.name.split(" ").pop() : "Vide"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Substitutes panel (Right 1 col) */}
              <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col max-h-[610px]">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white pb-3 border-b border-zinc-150 dark:border-zinc-800 flex items-center justify-between">
                  <span>🔄 REMPLAÇANTS</span>
                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-850 px-2.5 py-0.5 rounded-full text-zinc-500">
                    {composition.substitutes.length} joueurs
                  </span>
                </h3>

                <div className="flex-1 overflow-y-auto pt-4 space-y-2 custom-scrollbar">
                  {composition.substitutes.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-xs font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      Aucun remplaçant désigné pour ce match.
                    </div>
                  ) : (
                    composition.substitutes.map((subId) => {
                      const player = categoryPlayers.find((p) => p.id === subId)
                      if (!player) return null
                      const isMe = player.id === playerProfile.id

                      return (
                        <div
                          key={subId}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                            isMe
                              ? "bg-amber-500/10 border-amber-300"
                              : "bg-white border-zinc-150 dark:bg-zinc-950 dark:border-zinc-850"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-black h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                              isMe
                                ? "bg-amber-400 border-amber-300 text-zinc-950"
                                : "bg-amber-500/15 border-amber-500/20 text-amber-650"
                            }`}>
                              {player.number}
                            </span>
                            <div>
                              <h4 className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 uppercase truncate">
                                {player.name}
                              </h4>
                              <span className="text-[8px] font-black uppercase text-zinc-400 block mt-0.5">
                                {player.position}
                              </span>
                            </div>
                          </div>
                          {isMe && (
                            <span className="text-[8px] font-black text-amber-600 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded uppercase">
                              Vous
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
