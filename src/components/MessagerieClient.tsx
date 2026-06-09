"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { getChannelMessages, sendMessage, createCustomChannel, getChannelRecipients } from "@/app/dashboard/messagerie/actions"

const dict = {
  FR: {
    title: "Messagerie & Diffusions",
    desc: "Échangez instantanément et configurez des canaux ou diffusions pour vos effectifs.",
    create_btn: "Créer un message / diffusion",
    channels_label: "1. Canaux & Messages",
    search_placeholder: "Rechercher un canal...",
    no_channels: "Aucun canal disponible.",
    send: "Envoyer",
    placeholder_msg: "Écrire un message...",
    replies_disabled: "⚠️ Réponses désactivées pour ce canal de diffusion",
    signature_title: "Signature de l'expéditeur",
    detail_title: "Détails du Message",
    detail_sender: "Expéditeur",
    detail_content: "Contenu",
    detail_recipients: "Destinataires visés",
    detail_views: "Membres ayant vu le message",
    detail_no_views: "Personne n'a encore vu ce message.",
    detail_read_ratio: "Lu par {ratio} des destinataires",
    modal_title: "Nouveau Message / Diffusion",
    modal_name: "Nom du canal / Sujet",
    modal_desc: "Description ou contexte",
    modal_reply_toggle: "Activer les réponses des destinataires",
    modal_draft: "Message initial (rédiger le message)",
    modal_targets: "Sélectionner les destinataires",
    modal_targets_all: "Tout le club (Tous)",
    modal_targets_custom: "Destinataires spécifiques",
    modal_teams: "Par équipe / catégorie",
    modal_staff: "Membres du staff",
    cancel: "Annuler",
    create: "Diffuser le message",
    error_load: "Erreur de chargement",
    error_send: "Erreur d'envoi",
    error_create: "Erreur de création",
    success_create: "Message diffusé avec succès",
    vignette_read: "Lu le",
    public_badge: "Canal Public",
    private_badge: "Privé",
    broadcast_badge: "Diffusion",
    sender_role_prefix: "Rôle",
    club_prefix: "Club",
  },
  EN: {
    title: "Messaging & Broadcasts",
    desc: "Exchange instantly and configure channels or broadcasts for your roster.",
    create_btn: "Create message / broadcast",
    channels_label: "1. Channels & Messages",
    search_placeholder: "Search channels...",
    no_channels: "No channels available.",
    send: "Send",
    placeholder_msg: "Type a message...",
    replies_disabled: "⚠️ Replies disabled for this broadcast channel",
    signature_title: "Sender Signature",
    detail_title: "Message Details",
    detail_sender: "Sender",
    detail_content: "Content",
    detail_recipients: "Targeted recipients",
    detail_views: "Read receipts (Seen by)",
    detail_no_views: "No one has seen this message yet.",
    detail_read_ratio: "Read by {ratio} of recipients",
    modal_title: "New Message / Broadcast",
    modal_name: "Channel name / Subject",
    modal_desc: "Description or context",
    modal_reply_toggle: "Enable replies from recipients",
    modal_draft: "Initial message (draft content)",
    modal_targets: "Select recipients",
    modal_targets_all: "All Club (Everyone)",
    modal_targets_custom: "Specific recipients",
    modal_teams: "By team / category",
    modal_staff: "Staff members",
    cancel: "Cancel",
    create: "Broadcast message",
    error_load: "Error loading",
    error_send: "Error sending",
    error_create: "Error creating",
    success_create: "Message broadcasted successfully",
    vignette_read: "Read on",
    public_badge: "Public Channel",
    private_badge: "Private",
    broadcast_badge: "Broadcast",
    sender_role_prefix: "Role",
    club_prefix: "Club",
  },
  AR: {
    title: "الرسائل والبث",
    desc: "تواصل فوراً وقم بتهيئة القنوات أو مجموعات البث لفرقك.",
    create_btn: "إنشاء رسالة / بث جديد",
    channels_label: "1. القنوات والرسائل",
    search_placeholder: "بحث عن قناة...",
    no_channels: "لا توجد قنوات متاحة.",
    send: "إرسال",
    placeholder_msg: "اكتب رسالة...",
    replies_disabled: "⚠️ الردود معطلة لقناة البث هذه",
    signature_title: "توقيع المرسل",
    detail_title: "تفاصيل الرسالة",
    detail_sender: "المرسل",
    detail_content: "المحتوى",
    detail_recipients: "المستلمون المستهدفون",
    detail_views: "الأعضاء الذين شاهدوا الرسالة",
    detail_no_views: "لم يشاهد أحد هذه الرسالة بعد.",
    detail_read_ratio: "قرأت من قبل {ratio} من المستلمين",
    modal_title: "رسالة / بث جديد",
    modal_name: "اسم القناة / الموضوع",
    modal_desc: "الوصف أو السياق",
    modal_reply_toggle: "السماح بالردود من المستلمين",
    modal_draft: "الرسالة الأولى (محتوى المسودة)",
    modal_targets: "تحديد المستلمين",
    modal_targets_all: "كل النادي (الجميع)",
    modal_targets_custom: "مستلمون محددون",
    modal_teams: "حسب الفريق / الفئة",
    modal_staff: "أعضاء الطاقم",
    cancel: "إلغاء",
    create: "بث الرسالة",
    error_load: "خطأ في التحميل",
    error_send: "خطأ في الإرسال",
    error_create: "خطأ في الإنشاء",
    success_create: "تم بث الرسالة بنجاح",
    vignette_read: "قرأ في",
    public_badge: "قناة عامة",
    private_badge: "خاص",
    broadcast_badge: "بث",
    sender_role_prefix: "الدور",
    club_prefix: "النادي",
  }
}

interface MessagerieClientProps {
  initialChannels: any[]
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

export default function MessagerieClient({ initialChannels, recipientStructure, userSession }: MessagerieClientProps) {
  const { language } = useLanguage()
  const tLoc = dict[language] || dict["FR"]
  const isRtl = language === "AR"

  const [channels, setChannels] = useState<any[]>(initialChannels)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(initialChannels[0]?.id || null)
  const [messages, setMessages] = useState<any[]>([])
  const [activeRecipients, setActiveRecipients] = useState<any[]>([])
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")

  // Form states
  const [newMsgText, setNewMsgText] = useState("")
  const [isPending, startTransition] = useTransition()

  // Custom Channel Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [channelName, setChannelName] = useState("")
  const [channelDesc, setChannelDesc] = useState("")
  const [canReply, setCanReply] = useState(true)
  const [draftText, setDraftText] = useState("")
  const [targetType, setTargetType] = useState<"ALL" | "CUSTOM">("ALL")
  
  // Recipients checkboxes
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])

  // Message details modal state
  const [selectedMessageDetails, setSelectedMessageDetails] = useState<any | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const canCreate = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(userSession.role)
  const activeChannel = channels.find(c => c.id === activeChannelId)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Load active channel messages & targeted recipients
  const loadChannelData = async (chanId: string) => {
    const resMsg = await getChannelMessages(chanId)
    if (resMsg.success && resMsg.messages) {
      setMessages(resMsg.messages)
    }

    const resRec = await getChannelRecipients(chanId)
    if (resRec.success && resRec.recipients) {
      setActiveRecipients(resRec.recipients)
    }
  }

  // Trigger loading on active channel change
  useEffect(() => {
    if (activeChannelId) {
      loadChannelData(activeChannelId)
      // Initial scroll to bottom
      setTimeout(scrollToBottom, 200)
    }
  }, [activeChannelId])

  // Polling for real-time messages & views every 3 seconds
  useEffect(() => {
    if (!activeChannelId) return

    const interval = setInterval(() => {
      startTransition(async () => {
        const resMsg = await getChannelMessages(activeChannelId)
        if (resMsg.success && resMsg.messages) {
          // Compare length to auto-scroll if new message arrived
          const hadNewMessages = resMsg.messages.length > messages.length
          setMessages(resMsg.messages)
          if (hadNewMessages) {
            setTimeout(scrollToBottom, 100)
          }
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [activeChannelId, messages.length])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsgText.trim() || !activeChannelId) return

    const textToSend = newMsgText
    setNewMsgText("") // Clear input immediately for UX

    startTransition(async () => {
      const res = await sendMessage(activeChannelId, textToSend)
      if (res.success) {
        await loadChannelData(activeChannelId)
        setTimeout(scrollToBottom, 50)
      } else {
        alert(`${tLoc.error_send}: ${res.error}`)
      }
    })
  }

  // Teams & Players targeting helpers
  const handleTeamCheck = (catId: string, isChecked: boolean) => {
    const category = recipientStructure.teams.find(t => t.id === catId)
    if (!category) return

    if (isChecked) {
      setSelectedTeams(prev => [...prev, catId])
      const pIds = category.players.map(p => p.userId)
      setSelectedPlayers(prev => Array.from(new Set([...prev, ...pIds])))
    } else {
      setSelectedTeams(prev => prev.filter(id => id !== catId))
      const pIds = category.players.map(p => p.userId)
      setSelectedPlayers(prev => prev.filter(id => !pIds.includes(id)))
    }
  }

  const handlePlayerCheck = (catId: string, playerUserId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedPlayers(prev => [...prev, playerUserId])
      const category = recipientStructure.teams.find(t => t.id === catId)
      if (category) {
        const allChecked = category.players.every(p => p.userId === playerUserId || selectedPlayers.includes(p.userId))
        if (allChecked && !selectedTeams.includes(catId)) {
          setSelectedTeams(prev => [...prev, catId])
        }
      }
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerUserId))
      setSelectedTeams(prev => prev.filter(id => id !== catId))
    }
  }

  const handleStaffCheck = (staffUserId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedStaff(prev => [...prev, staffUserId])
    } else {
      setSelectedStaff(prev => prev.filter(id => id !== staffUserId))
    }
  }

  // Create Broadcast/Custom channel
  const handleCreateChannel = async () => {
    if (!channelName.trim() || !draftText.trim()) {
      alert("Veuillez saisir un sujet et rédiger le message initial.")
      return
    }

    let targetTeams: string[] | null = null
    let targetRoles: string[] | null = null
    let targetUserIds: string[] | null = null

    if (targetType === "CUSTOM") {
      targetTeams = selectedTeams.length > 0 ? selectedTeams : null
      targetUserIds = [...selectedPlayers, ...selectedStaff]
      if (targetUserIds.length === 0) targetUserIds = null

      const roles: string[] = []
      if (selectedPlayers.length > 0) roles.push("JOUEUR")
      if (selectedStaff.length > 0) roles.push("STAFF")
      targetRoles = roles.length > 0 ? roles : null
    }

    startTransition(async () => {
      const res = await createCustomChannel({
        name: channelName,
        description: channelDesc || undefined,
        canReply,
        targetTeams,
        targetRoles,
        targetUserIds,
        initialMessage: draftText
      })

      if (res.success && res.channelId) {
        alert(tLoc.success_create)
        setIsCreateOpen(false)
        // Refresh channels list
        window.location.reload()
      } else {
        alert(`${tLoc.error_create}: ${res.error}`)
      }
    })
  }

  // Filter channels based on search
  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Composer reply state control
  const isReadOnlyChannel = activeChannel && !activeChannel.canReply && activeChannel.creatorId !== userSession.id

  return (
    <div className={`space-y-6 animate-in fade-in duration-300 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {tLoc.title}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {tLoc.desc}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition duration-200 cursor-pointer active:scale-95 shrink-0"
          >
            📣 {tLoc.create_btn}
          </button>
        )}
      </section>

      {/* Grid Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-270px)] min-h-[580px]">
        
        {/* LEFT COMPARTMENT: Channels list */}
        <section className="rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-150/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              {tLoc.channels_label}
            </h2>
            <div className="mt-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tLoc.search_placeholder}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredChannels.length === 0 ? (
              <p className="text-xs text-zinc-450 italic text-center py-8">{tLoc.no_channels}</p>
            ) : (
              filteredChannels.map((c) => {
                const isActive = c.id === activeChannelId
                
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50/10 shadow-sm"
                        : "border-zinc-100 hover:border-zinc-350 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${
                        isActive ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      }`}>
                        {c.isCustom ? "📣" : c.isPrivate ? "🔒" : "#"}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wide">
                          {c.name}
                        </h4>
                        {c.description && (
                          <p className="text-[10px] text-zinc-400 font-bold truncate max-w-[150px]">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {c.unreadCount > 0 && (
                        <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                      {!c.canReply && (
                        <span className="text-xs" title="Diffusion seule (sans réponses)">🔇</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* CENTER & RIGHT COMPARTMENT: Active Message Log */}
        <section className="lg:col-span-2 rounded-2xl border border-zinc-200/60 bg-white shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900 flex flex-col overflow-hidden">
          {activeChannel ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-150/60 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                    {activeChannel.isCustom ? "📣" : activeChannel.isPrivate ? "🔒" : "#"} {activeChannel.name}
                    {!activeChannel.canReply && (
                      <span className="bg-red-500/10 text-red-500 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Lecture Seule</span>
                    )}
                  </h3>
                  {activeChannel.description && (
                    <p className="text-[10px] text-zinc-400 font-bold">{activeChannel.description}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    // Trigger popup with targets details
                    const fakeMsg = {
                      senderName: activeChannel.creatorName,
                      senderRole: "Créateur",
                      senderClubName: "EVO SPORTS",
                      content: activeChannel.description || "Canal de messagerie",
                      createdAt: new Date().toISOString(),
                      views: []
                    }
                    setSelectedMessageDetails(fakeMsg)
                  }}
                  className="text-[9px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full uppercase tracking-wider cursor-pointer hover:bg-emerald-500/20"
                >
                  👥 {activeRecipients.length} destinataires
                </button>
              </div>

              {/* Chat Log Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-zinc-50/[0.02]">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
                    Aucun message dans ce canal. Rédigez le premier message !
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.senderId === userSession.id
                    
                    return (
                      <div 
                        key={msg.id}
                        onClick={() => setSelectedMessageDetails(msg)}
                        className={`flex items-start gap-3 cursor-pointer group animate-in fade-in duration-200 ${
                          isOwnMessage ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-white font-black text-xs bg-zinc-800`}>
                          {msg.senderName.substring(0, 1).toUpperCase()}
                        </div>

                        {/* Bubble */}
                        <div className={`space-y-1.5 max-w-[70%]`}>
                          <div className={`flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}>
                            <span>{msg.senderName}</span>
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded text-[8px] uppercase">{msg.senderRole}</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className={`text-xs p-3 rounded-2xl border leading-relaxed font-semibold transition hover:brightness-95 shadow-sm ${
                            isOwnMessage
                              ? "bg-emerald-600 border-emerald-700 text-white"
                              : "bg-white dark:bg-zinc-950/40 border-zinc-150/60 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                          }`}>
                            <p className="whitespace-pre-line">{msg.content}</p>

                            {/* SIGNATURE CARD (UNDER THE MESSAGE) */}
                            <div className={`mt-3 pt-2 border-t text-[8px] font-black uppercase tracking-widest flex items-center gap-2 select-none ${
                              isOwnMessage ? "border-emerald-500 text-emerald-100" : "border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500"
                            }`}>
                              <span>✍️ Signature :</span>
                              <span className="font-bold">{msg.senderName}</span>
                              <span>|</span>
                              <span className="font-bold">{msg.senderRole || "Membre"}</span>
                              <span>|</span>
                              <span className="font-bold">{msg.senderClubName || "Club"}</span>
                              {msg.senderClubLogo && (
                                <img
                                  src={msg.senderClubLogo}
                                  alt="Club Logo"
                                  className="h-3 w-3 object-contain rounded-full"
                                />
                              )}
                            </div>
                          </div>

                          {/* Viewed Indicator */}
                          {isOwnMessage && (
                            <div className="text-[9px] text-zinc-400 font-bold text-right pr-2">
                              👁️ {tLoc.vignette_read} {msg.views.length}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer */}
              <div className="p-3 border-t border-zinc-150/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/10">
                {isReadOnlyChannel ? (
                  <div className="text-center p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold text-xs">
                    {tLoc.replies_disabled}
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMsgText}
                      onChange={(e) => setNewMsgText(e.target.value)}
                      placeholder={tLoc.placeholder_msg}
                      disabled={isPending}
                      className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isPending || !newMsgText.trim()}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-black uppercase text-xs tracking-wider px-5 py-3 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {tLoc.send}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400 text-xs italic">
              {tLoc.no_channels}
            </div>
          )}
        </section>

      </div>

      {/* CREATE BROADCAST/MESSAGE MODAL */}
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
              {/* Subject/Name */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.modal_name} *</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Ex: Organisation déplacement Coupe..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.modal_desc}</label>
                <input
                  type="text"
                  value={channelDesc}
                  onChange={(e) => setChannelDesc(e.target.value)}
                  placeholder="Ex: Messages et consignes logistiques"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none"
                />
              </div>

              {/* Toggle Replies (canReply) */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canReply}
                    onChange={(e) => setCanReply(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{tLoc.modal_reply_toggle}</span>
                </label>
              </div>

              {/* Draft Message Text */}
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2">{tLoc.modal_draft} *</label>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  rows={3}
                  placeholder="Écrivez le message initial..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-300 focus:outline-none resize-none"
                />
              </div>

              {/* Custom Recipients Tree */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-4">
                <label className="block text-xs font-black text-zinc-500 uppercase">{tLoc.modal_targets}</label>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "ALL"}
                      onChange={() => setTargetType("ALL")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{tLoc.modal_targets_all}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={targetType === "CUSTOM"}
                      onChange={() => setTargetType("CUSTOM")}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{tLoc.modal_targets_custom}</span>
                  </label>
                </div>

                {targetType === "CUSTOM" && (
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800 space-y-6 max-h-[30vh] overflow-y-auto">
                    
                    {/* Teams Tree */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        📁 {tLoc.modal_teams}
                      </h4>
                      {recipientStructure.teams.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic">Aucune équipe</p>
                      ) : (
                        recipientStructure.teams.map((team) => {
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
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Staff members */}
                    <div className="space-y-3 border-t border-zinc-200/60 dark:border-zinc-800 pt-4">
                      <h4 className="text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        📁 {tLoc.modal_staff}
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                {tLoc.cancel}
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={isPending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {tLoc.create}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MESSAGE DETAILS MODAL (CLICK ON BUBBLE) */}
      {selectedMessageDetails && (() => {
        // Compute read stats
        const viewsCount = selectedMessageDetails.views.length
        const totalTargetsCount = activeRecipients.length
        const ratioText = `${viewsCount} / ${totalTargetsCount}`
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <h2 className="text-lg font-black uppercase text-zinc-900 dark:text-white">
                  {tLoc.detail_title}
                </h2>
                <button
                  onClick={() => setSelectedMessageDetails(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5">
                {/* Sender details */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-250/50 dark:border-zinc-800 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-black text-xs bg-zinc-800 shrink-0">
                    {selectedMessageDetails.senderName.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                      {selectedMessageDetails.senderName}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold">
                      {tLoc.sender_role_prefix}: <span className="text-zinc-700 dark:text-zinc-300">{selectedMessageDetails.senderRole || "Membre"}</span>
                      {selectedMessageDetails.senderClubName && (
                        <> | {tLoc.club_prefix}: <span className="text-zinc-700 dark:text-zinc-300">{selectedMessageDetails.senderClubName}</span></>
                      )}
                    </p>
                  </div>
                </div>

                {/* Message Content */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">{tLoc.detail_content}</h4>
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/10 border border-zinc-200 dark:border-zinc-800/80 text-xs font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                    {selectedMessageDetails.content}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold text-right">
                    ⌛ {new Date(selectedMessageDetails.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Read receipts details */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                      👁️ {tLoc.detail_views}
                    </h4>
                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                      {tLoc.detail_read_ratio.replace("{ratio}", ratioText)}
                    </span>
                  </div>

                  {selectedMessageDetails.views.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-4 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      {tLoc.detail_no_views}
                    </p>
                  ) : (
                    <div className="max-h-[15vh] overflow-y-auto space-y-2 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
                      {selectedMessageDetails.views.map((v: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold text-zinc-850 dark:text-zinc-300">
                          <span>✅ {v.userName} <span className="text-[10px] text-zinc-400 font-bold">({v.userRole})</span></span>
                          <span className="text-zinc-400 font-bold">{tLoc.vignette_read} {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recipients List */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest">
                    👥 {tLoc.detail_recipients} ({activeRecipients.length})
                  </h4>
                  <div className="max-h-[15vh] overflow-y-auto grid grid-cols-2 gap-2 bg-zinc-50/50 dark:bg-zinc-950/20 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800">
                    {activeRecipients.map((rec: any, idx: number) => {
                      const hasRead = selectedMessageDetails.views.some((v: any) => v.userName === rec.name)
                      
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          <span>{hasRead ? "🟢" : "⚪"}</span>
                          <span>{rec.name} <span className="text-[9px] text-zinc-400">({rec.role})</span></span>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setSelectedMessageDetails(null)}
                  className="px-5 py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold transition shadow cursor-pointer active:scale-95"
                >
                  Fermer
                </button>
              </div>

            </div>
          </div>
        )
      })()}

    </div>
  )
}
