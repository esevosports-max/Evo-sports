"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { createPoll, submitVote, deletePoll } from "@/app/dashboard/sondage/actions"

// Localization dictionary for the Polls module
const dict = {
  FR: {
    page_title: "Sondages & Consultations",
    page_desc: "Prenez part aux décisions de votre club. Vos votes sont confidentiels.",
    create_btn: "Créer un sondage",
    filter_type: "Type de sondage",
    filter_status: "Statut",
    filter_creator: "Nom du créateur...",
    filter_end_date: "Date de fin",
    search: "Rechercher...",
    no_polls: "Aucun sondage trouvé.",
    status_active: "En cours",
    status_scheduled: "Planifié",
    status_finished: "Terminé",
    vote_open: "⚡ Vote ouvert",
    vote_done: "✅ A voté",
    total_votes: "Total des votes",
    anonymous_note: "Anonyme & Sécurisé",
    btn_vote: "Voter",
    btn_view_analysis: "Voir l'analyse",
    btn_delete: "Supprimer",
    modal_title: "Nouveau Sondage",
    poll_title_label: "Titre du sondage",
    poll_desc_label: "Description",
    poll_type_label: "Type",
    poll_end_label: "Date et heure de fin",
    poll_schedule_label: "Planifier (Date de publication)",
    options_label: "Options de réponse",
    add_option: "Ajouter une option",
    recipients_label: "Destinataires (Ciblage)",
    recipients_all: "Tout le club (Tous)",
    recipients_teams: "Par Équipe / Catégorie",
    recipients_staff: "Membres du Staff",
    schedule_poll: "Planifier pour plus tard",
    send_now: "Envoyer immédiatement",
    cancel: "Annuler",
    error_create: "Erreur lors de la création",
    success_create: "Sondage créé avec succès",
    error_vote: "Erreur lors du vote",
    success_vote: "Vote enregistré",
    analysis_title: "Analyse du Sondage",
    analysis_winner: "Option gagnante",
    analysis_ranking: "Classement des propositions",
    analysis_voters_title: "Détail des votes individuels",
    analysis_voter_name: "Nom",
    analysis_voter_choice: "Choix",
    analysis_voter_date: "Date",
    analysis_no_votes: "Aucun vote n'a été enregistré pour le moment.",
    analysis_active_badge: "Actif",
    analysis_finished_badge: "Expiré",
    analysis_created_by: "Créé par",
    analysis_period: "Période",
    to: "au",
    type_general: "Général",
    type_match: "Match",
    type_training: "Entraînement",
    type_event: "Événement / Logistique",
  },
  EN: {
    page_title: "Polls & Consultations",
    page_desc: "Take part in club decisions. Your votes are confidential.",
    create_btn: "Create a poll",
    filter_type: "Poll Type",
    filter_status: "Status",
    filter_creator: "Creator name...",
    filter_end_date: "End Date",
    search: "Search...",
    no_polls: "No polls found.",
    status_active: "Active",
    status_scheduled: "Scheduled",
    status_finished: "Finished",
    vote_open: "⚡ Open Vote",
    vote_done: "✅ Voted",
    total_votes: "Total votes",
    anonymous_note: "Anonymous & Secured",
    btn_vote: "Vote",
    btn_view_analysis: "View analysis",
    btn_delete: "Delete",
    modal_title: "New Poll",
    poll_title_label: "Poll Title",
    poll_desc_label: "Description",
    poll_type_label: "Type",
    poll_end_label: "End Date & Time",
    poll_schedule_label: "Schedule (Publish Date)",
    options_label: "Answer options",
    add_option: "Add option",
    recipients_label: "Recipients (Targeting)",
    recipients_all: "All Club (Everyone)",
    recipients_teams: "By Team / Category",
    recipients_staff: "Staff Members",
    schedule_poll: "Schedule for later",
    send_now: "Send immediately",
    cancel: "Cancel",
    error_create: "Error creating poll",
    success_create: "Poll created successfully",
    error_vote: "Error voting",
    success_vote: "Vote registered successfully",
    analysis_title: "Poll Analysis",
    analysis_winner: "Winning Option",
    analysis_ranking: "Option Ranking",
    analysis_voters_title: "Individual votes breakdown",
    analysis_voter_name: "Name",
    analysis_voter_choice: "Choice",
    analysis_voter_date: "Date",
    analysis_no_votes: "No votes registered yet.",
    analysis_active_badge: "Active",
    analysis_finished_badge: "Expired",
    analysis_created_by: "Created by",
    analysis_period: "Period",
    to: "to",
    type_general: "General",
    type_match: "Match",
    type_training: "Training",
    type_event: "Event / Logistics",
  },
  AR: {
    page_title: "الاستطلاعات والاستشارات",
    page_desc: "شارك في قرارات ناديك. تصويتاتك سرية وآمنة.",
    create_btn: "إنشاء استطلاع",
    filter_type: "نوع الاستطلاع",
    filter_status: "الحالة",
    filter_creator: "اسم المنشئ...",
    filter_end_date: "تاريخ الانتهاء",
    search: "بحث...",
    no_polls: "لم يتم العثور على استطلاعات.",
    status_active: "نشط حالياً",
    status_scheduled: "مجدول",
    status_finished: "منتهي",
    vote_open: "⚡ التصويت مفتوح",
    vote_done: "✅ تم التصويت",
    total_votes: "إجمالي الأصوات",
    anonymous_note: "سري وآمن",
    btn_vote: "تصويت",
    btn_view_analysis: "عرض التحليل",
    btn_delete: "حذف",
    modal_title: "استطلاع جديد",
    poll_title_label: "عنوان الاستطلاع",
    poll_desc_label: "الوصف",
    poll_type_label: "النوع",
    poll_end_label: "تاريخ ووقت الانتهاء",
    poll_schedule_label: "جدولة الاستطلاع (تاريخ النشر)",
    options_label: "خيارات الإجابة",
    add_option: "إضافة خيار",
    recipients_label: "المستلمون (الفئة المستهدفة)",
    recipients_all: "كل النادي (الجميع)",
    recipients_teams: "حسب الفريق / الفئة",
    recipients_staff: "أعضاء الطاقم الفني",
    schedule_poll: "جدولة لوقت لاحق",
    send_now: "إرسال فوراً",
    cancel: "إلغاء",
    error_create: "خطأ أثناء إنشاء الاستطلاع",
    success_create: "تم إنشاء الاستطلاع بنجاح",
    error_vote: "خطأ أثناء إرسال التصويت",
    success_vote: "تم تسجيل تصويتك بنجاح",
    analysis_title: "تحليل الاستطلاع",
    analysis_winner: "الخيار الفائز",
    analysis_ranking: "ترتيب المقترحات",
    analysis_voters_title: "تفاصيل الأصوات الفردية",
    analysis_voter_name: "الاسم",
    analysis_voter_choice: "الاختيار",
    analysis_voter_date: "التاريخ",
    analysis_no_votes: "لم يتم تسجيل أي أصوات حتى الآن.",
    analysis_active_badge: "نشط",
    analysis_finished_badge: "منتهي الصلاحية",
    analysis_created_by: "أنشئ بواسطة",
    analysis_period: "الفترة",
    to: "إلى",
    type_general: "عام",
    type_match: "مباراة",
    type_training: "تدريب",
    type_event: "حدث / لوجستيات",
  }
}

interface SondageClientProps {
  initialPolls: any[]
  recipientStructure: {
    teams: { id: string; name: string; players: { userId: string; name: string }[] }[]
    staff: { userId: string; name: string; role: string }[]
  }
  userSession: {
    id: string
    name: string
    role: string
  }
}

export default function SondageClient({ initialPolls, recipientStructure, userSession }: SondageClientProps) {
  const { language } = useLanguage()
  const tLoc = dict[language] || dict["FR"]
  const isRtl = language === "AR"

  const [polls, setPolls] = useState<any[]>(initialPolls)
  const [isPending, startTransition] = useTransition()

  // Filter States
  const [filterType, setFilterType] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterCreator, setFilterCreator] = useState<string>("")
  const [filterEndDate, setFilterEndDate] = useState<string>("")

  // Modals States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAnalysisPoll, setSelectedAnalysisPoll] = useState<any | null>(null)

  // Creation Form States
  const [pollTitle, setPollTitle] = useState("")
  const [pollDesc, setPollDesc] = useState("")
  const [pollType, setPollType] = useState("GENERAL")
  const [pollEndDate, setPollEndDate] = useState("")
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [targetType, setTargetType] = useState<"ALL" | "CUSTOM">("ALL")
  
  // Custom Targeting checkboxes
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]) // Cat IDs
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]) // User IDs
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]) // User IDs
  
  // Scheduling States
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")

  const canCreate = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(userSession.role)

  // Filter computation
  const filteredPolls = polls.filter(p => {
    if (filterType && p.type !== filterType) return false
    if (filterStatus && p.status !== filterStatus) return false
    if (filterCreator && !p.creatorName.toLowerCase().includes(filterCreator.toLowerCase())) return false
    if (filterEndDate) {
      const pEnd = new Date(p.expiresAt).toISOString().split("T")[0]
      if (pEnd !== filterEndDate) return false
    }
    return true
  })

  // Options modifiers
  const handleAddOptionField = () => {
    setPollOptions([...pollOptions, ""])
  }

  const handleRemoveOptionField = (idx: number) => {
    if (pollOptions.length <= 2) return
    setPollOptions(pollOptions.filter((_, i) => i !== idx))
  }

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions]
    updated[idx] = val
    setPollOptions(updated)
  }

  // Handle Team Category Selection (checks/unchecks all its players)
  const handleTeamCheck = (catId: string, isChecked: boolean) => {
    const category = recipientStructure.teams.find(t => t.id === catId)
    if (!category) return

    if (isChecked) {
      setSelectedTeams(prev => [...prev, catId])
      // add all players under it
      const pIds = category.players.map(p => p.userId)
      setSelectedPlayers(prev => Array.from(new Set([...prev, ...pIds])))
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== catId))
      // remove all players under it
      const pIds = category.players.map(p => p.userId)
      setSelectedPlayers(prev => prev.filter(id => !pIds.includes(id)))
    }
  }

  // Handle Player Selection
  const handlePlayerCheck = (catId: string, playerUserId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPlayers(prev => [...prev, playerUserId])
      // If all players in category are now checked, check the category too
      const category = recipientStructure.teams.find(t => t.id === catId)
      if (category) {
        const allChecked = category.players.every(p => p.userId === playerUserId || selectedPlayers.includes(p.userId))
        if (allChecked && !selectedTeams.includes(catId)) {
          setSelectedTeams(prev => [...prev, catId])
        }
      }
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerUserId))
      // Uncheck category since not all are selected
      setSelectedTeams(prev => prev.filter(id => id !== catId))
    }
  }

  // Handle Staff Selection
  const handleStaffCheck = (staffUserId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedStaff(prev => [...prev, staffUserId])
    } else {
      setSelectedStaff(prev => prev.filter(id => id !== staffUserId))
    }
  }

  // Submit Poll Creation
  const handleSavePoll = async () => {
    if (!pollTitle || !pollEndDate || pollOptions.some(o => !o.trim())) {
      alert("Veuillez remplir tous les champs obligatoires et saisir des options de réponses valides.")
      return
    }

    let targetTeams: string[] | null = null
    let targetRoles: string[] | null = null
    let targetUserIds: string[] | null = null

    if (targetType === "CUSTOM") {
      targetTeams = selectedTeams.length > 0 ? selectedTeams : null
      targetUserIds = [...selectedPlayers, ...selectedStaff]
      if (targetUserIds.length === 0) targetUserIds = null
      
      // If we selected staff but no teams, or vice-versa
      const roles: string[] = []
      if (selectedPlayers.length > 0) roles.push("JOUEUR")
      if (selectedStaff.length > 0) roles.push("STAFF")
      targetRoles = roles.length > 0 ? roles : null
    }

    startTransition(async () => {
      const res = await createPoll({
        title: pollTitle,
        description: pollDesc || undefined,
        type: pollType,
        options: pollOptions.filter(o => o.trim() !== ""),
        expiresAt: new Date(pollEndDate).toISOString(),
        scheduledFor: isScheduled && scheduleDate ? new Date(scheduleDate).toISOString() : null,
        targetTeams,
        targetRoles,
        targetUserIds
      })

      if (res.success) {
        alert(tLoc.success_create)
        setIsCreateOpen(false)
        // Refresh local list (simulate page reload or fetch again)
        window.location.reload()
      } else {
        alert(`${tLoc.error_create}: ${res.error}`)
      }
    })
  }

  // Submit interactive vote
  const handleCastVote = async (pollId: string, optionId: string) => {
    startTransition(async () => {
      const res = await submitVote(pollId, optionId)
      if (res.success) {
        alert(tLoc.success_vote)
        window.location.reload()
      } else {
        alert(`${tLoc.error_vote}: ${res.error}`)
      }
    })
  }

  // Delete poll
  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce sondage ?")) return
    startTransition(async () => {
      const res = await deletePoll(pollId)
      if (res.success) {
        if (selectedAnalysisPoll?.id === pollId) {
          setSelectedAnalysisPoll(null)
        }
        window.location.reload()
      } else {
        alert("Erreur de suppression")
      }
    })
  }

  return (
    <div className={`space-y-8 animate-in fade-in duration-300 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {tLoc.page_title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tLoc.page_desc}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition duration-200 cursor-pointer active:scale-95 shrink-0"
          >
            ➕ {tLoc.create_btn}
          </button>
        )}
      </section>

      {/* Filter Options */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{tLoc.filter_type}</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">{tLoc.recipients_all}</option>
            <option value="GENERAL">{tLoc.type_general}</option>
            <option value="MATCH">{tLoc.type_match}</option>
            <option value="TRAINING">{tLoc.type_training}</option>
            <option value="EVENT">{tLoc.type_event}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{tLoc.filter_status}</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">{tLoc.recipients_all}</option>
            <option value="ACTIVE">{tLoc.status_active}</option>
            <option value="SCHEDULED">{tLoc.status_scheduled}</option>
            <option value="FINISHED">{tLoc.status_finished}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{tLoc.filter_creator}</label>
          <input
            type="text"
            value={filterCreator}
            onChange={(e) => setFilterCreator(e.target.value)}
            placeholder={tLoc.filter_creator}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">{tLoc.filter_end_date}</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </section>

      {/* Polls Cards Grid */}
      {filteredPolls.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
          {tLoc.no_polls}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredPolls.map((poll) => {
            const isFinished = poll.status === "FINISHED" || new Date() > new Date(poll.expiresAt)
            
            return (
              <div
                key={poll.id}
                className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col justify-between space-y-6 transition hover:shadow-md relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                      poll.voted ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" :
                      isFinished ? "bg-red-500/10 text-red-500" :
                      poll.status === "SCHEDULED" ? "bg-blue-500/10 text-blue-500" :
                      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {poll.voted ? tLoc.vote_done :
                       isFinished ? tLoc.status_finished :
                       poll.status === "SCHEDULED" ? tLoc.status_scheduled :
                       tLoc.vote_open}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      ⌛ {new Date(poll.expiresAt).toLocaleDateString()} {new Date(poll.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {poll.type === "MATCH" ? "⚽" :
                         poll.type === "TRAINING" ? "🏃" :
                         poll.type === "EVENT" ? "📅" : "📊"}
                      </span>
                      <h3 className="text-base font-black text-zinc-900 dark:text-white leading-snug uppercase tracking-wide">
                        {poll.title}
                      </h3>
                    </div>
                    {poll.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed font-semibold">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-zinc-400 font-bold">
                    👤 {tLoc.analysis_created_by} <span className="text-zinc-600 dark:text-zinc-300">{poll.creatorName}</span> ({poll.creatorRole || "Staff"})
                  </div>
                </div>

                {/* Voting Options */}
                <div className="space-y-3 pt-2">
                  {poll.options.map((opt: any) => {
                    const percentage = poll.totalVotes > 0 ? Math.round((opt.votesCount / poll.totalVotes) * 100) : 0
                    const userSelected = poll.userVoteOptionId === opt.id

                    return (
                      <div key={opt.id} className="relative">
                        {(poll.voted || isFinished || poll.status === "SCHEDULED") ? (
                          /* Results Mode */
                          <div className={`w-full rounded-xl border p-3 flex items-center justify-between text-xs bg-zinc-50/50 dark:bg-zinc-950/20 relative overflow-hidden ${
                            userSelected ? "border-emerald-500 dark:border-emerald-700" : "border-zinc-150/60 dark:border-zinc-800"
                          }`}>
                            <div
                              className="absolute inset-y-0 left-0 bg-emerald-500/10 transition-all duration-1000 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                            <span className="font-bold text-zinc-700 dark:text-zinc-300 relative z-10">
                              {opt.text} {userSelected && "⭐️"}
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 relative z-10 ml-2 shrink-0">
                              {percentage}% ({opt.votesCount})
                            </span>
                          </div>
                        ) : (
                          /* Interactive Vote */
                          <button
                            onClick={() => handleCastVote(poll.id, opt.id)}
                            disabled={isPending}
                            className="w-full rounded-xl border border-zinc-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/5 p-3 flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all duration-200 active:scale-[0.99] cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            <span>{opt.text}</span>
                            <span className="text-emerald-500">🗳️ {tLoc.btn_vote}</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 font-bold">
                  <span>{tLoc.total_votes} : {poll.totalVotes}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedAnalysisPoll(poll)}
                      className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                      📊 {tLoc.btn_view_analysis}
                    </button>
                    {(userSession.role === "PRESIDENT" || userSession.role === "MANAGER_EVO_SPORTS" || poll.creatorId === userSession.id) && (
                      <button
                        onClick={() => handleDeletePoll(poll.id)}
                        disabled={isPending}
                        className="px-3 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 transition cursor-pointer"
                      >
                        🗑️ {tLoc.btn_delete}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE POLL MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h2 className="text-xl font-black uppercase text-zinc-900 dark:text-white">
                {tLoc.modal_title}
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Type Select */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.poll_type_label}</label>
                <select
                  value={pollType}
                  onChange={(e) => setPollType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                >
                  <option value="GENERAL">{tLoc.type_general}</option>
                  <option value="MATCH">{tLoc.type_match}</option>
                  <option value="TRAINING">{tLoc.type_training}</option>
                  <option value="EVENT">{tLoc.type_event}</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.poll_title_label} *</label>
                <input
                  type="text"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="Ex: Horaire de départ pour le déplacement..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.poll_desc_label}</label>
                <textarea
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  rows={2}
                  placeholder="Ex: Vote officiel pour coordonner le déplacement de samedi..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none resize-none"
                />
              </div>

              {/* Options list */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-zinc-500 uppercase">{tLoc.options_label} *</label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Proposition ${idx + 1}`}
                      className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => handleRemoveOptionField(idx)}
                        className="text-red-500 hover:text-red-700 px-2 py-1 text-xs cursor-pointer font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddOptionField}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  ➕ {tLoc.add_option}
                </button>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.poll_end_label} *</label>
                <input
                  type="datetime-local"
                  value={pollEndDate}
                  onChange={(e) => setPollEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                />
              </div>

              {/* Scheduling selection */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{tLoc.schedule_poll}</span>
                </label>
                
                {isScheduled && (
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.poll_schedule_label} *</label>
                    <input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Recipients/Targeting */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
                <label className="block text-xs font-black text-zinc-500 uppercase">{tLoc.recipients_label}</label>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "ALL"}
                      onChange={() => setTargetType("ALL")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{tLoc.recipients_all}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "CUSTOM"}
                      onChange={() => setTargetType("CUSTOM")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ciblage personnalisé</span>
                  </label>
                </div>

                {targetType === "CUSTOM" && (
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800 space-y-6 max-h-[30vh] overflow-y-auto">
                    
                    {/* Teams tree selection */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        📁 {tLoc.recipients_teams}
                      </h4>
                      {recipientStructure.teams.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic">Aucune équipe disponible</p>
                      ) : (
                        recipientStructure.teams.map((team) => {
                          const hasPlayers = team.players.length > 0
                          const isTeamChecked = selectedTeams.includes(team.id)

                          return (
                            <div key={team.id} className="ml-2 space-y-1">
                              <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isTeamChecked}
                                  onChange={(e) => handleTeamCheck(team.id, e.target.checked)}
                                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{team.name}</span>
                              </label>
                              
                              {/* Players of Category */}
                              {hasPlayers && (
                                <div className="ml-6 pl-2 border-l border-zinc-200 dark:border-zinc-800 space-y-1">
                                  {team.players.map((p) => {
                                    const isPlayerChecked = selectedPlayers.includes(p.userId)
                                    return (
                                      <label key={p.userId} className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isPlayerChecked}
                                          onChange={(e) => handlePlayerCheck(team.id, p.userId, e.target.checked)}
                                          className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>{p.name}</span>
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Staff selection */}
                    <div className="space-y-3 border-t border-zinc-200/60 dark:border-zinc-800 pt-4">
                      <h4 className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        📁 {tLoc.recipients_staff}
                      </h4>
                      {recipientStructure.staff.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic">Aucun membre staff</p>
                      ) : (
                        <div className="ml-2 space-y-2">
                          {recipientStructure.staff.map((s) => {
                            const isStaffChecked = selectedStaff.includes(s.userId)
                            return (
                              <label key={s.userId} className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isStaffChecked}
                                  onChange={(e) => handleStaffCheck(s.userId, e.target.checked)}
                                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{s.name} <span className="text-[10px] text-zinc-400 font-bold">({s.role})</span></span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                {tLoc.cancel}
              </button>
              <button
                onClick={handleSavePoll}
                disabled={isPending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isScheduled ? tLoc.schedule_poll : tLoc.send_now}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED ANALYSIS MODAL */}
      {selectedAnalysisPoll && (() => {
        const sortedOptions = [...selectedAnalysisPoll.options].sort((a: any, b: any) => b.votesCount - a.votesCount)
        const highestVotes = sortedOptions[0]?.votesCount || 0
        const winner = highestVotes > 0 ? sortedOptions[0] : null
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {selectedAnalysisPoll.status === "FINISHED" ? tLoc.analysis_finished_badge : tLoc.analysis_active_badge}
                  </span>
                  <h2 className="text-lg font-black uppercase text-zinc-900 dark:text-white mt-1">
                    {tLoc.analysis_title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAnalysisPoll(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                
                {/* Details Section */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800/80 space-y-3">
                  <h3 className="text-md font-black text-zinc-900 dark:text-white">
                    {selectedAnalysisPoll.title}
                  </h3>
                  {selectedAnalysisPoll.description && (
                    <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
                      {selectedAnalysisPoll.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-zinc-400 pt-2 border-t border-zinc-200/50 dark:border-zinc-800">
                    <div>
                      👤 {tLoc.analysis_created_by} : <span className="text-zinc-700 dark:text-zinc-300">{selectedAnalysisPoll.creatorName}</span> <span className="text-[10px]">({selectedAnalysisPoll.creatorRole || "Staff"})</span>
                    </div>
                    <div>
                      📅 {tLoc.analysis_period} : <span className="text-zinc-700 dark:text-zinc-300">{new Date(selectedAnalysisPoll.createdAt).toLocaleDateString()} {tLoc.to} {new Date(selectedAnalysisPoll.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Winner Callout */}
                {winner ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                        🏆 {tLoc.analysis_winner}
                      </span>
                      <p className="text-sm font-black text-emerald-950 dark:text-white">
                        {winner.text}
                      </p>
                    </div>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 shrink-0 ml-4">
                      {winner.votesCount} {winner.votesCount > 1 ? "votes" : "vote"}
                    </span>
                  </div>
                ) : null}

                {/* Ranking (Highest to Lowest) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    📊 {tLoc.analysis_ranking}
                  </h4>
                  <div className="space-y-3">
                    {sortedOptions.map((opt: any, idx: number) => {
                      const percentage = selectedAnalysisPoll.totalVotes > 0 
                        ? Math.round((opt.votesCount / selectedAnalysisPoll.totalVotes) * 100)
                        : 0
                      
                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <span>{idx + 1}. {opt.text}</span>
                            <span>{percentage}% ({opt.votesCount} votes)</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Individual Votes Table */}
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    👥 {tLoc.analysis_voters_title} ({selectedAnalysisPoll.totalVotes})
                  </h4>
                  {selectedAnalysisPoll.allVotesList.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      {tLoc.analysis_no_votes}
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 font-black uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                            <th className="p-3">{tLoc.analysis_voter_name}</th>
                            <th className="p-3">{tLoc.analysis_voter_choice}</th>
                            <th className="p-3 text-right">{tLoc.analysis_voter_date}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800">
                          {selectedAnalysisPoll.allVotesList.map((vote: any, idx: number) => (
                            <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10 font-medium text-zinc-800 dark:text-zinc-200">
                              <td className="p-3 font-bold">{vote.userName}</td>
                              <td className="p-3">
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg font-bold text-[11px]">
                                  {vote.choiceText}
                                </span>
                              </td>
                              <td className="p-3 text-right text-zinc-400 font-bold">
                                {new Date(vote.createdAt).toLocaleDateString()} {new Date(vote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setSelectedAnalysisPoll(null)}
                  className="px-5 py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95"
                >
                  {tLoc.cancel}
                </button>
              </div>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
