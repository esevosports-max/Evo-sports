"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createPlayer, deletePlayer, updatePlayer as updatePlayerAction, toggleBlockPlayer, convoquerPlayersAction, getSentConvocationsAction, deleteConvocationAction } from "@/app/dashboard/effectifs/actions"

interface Category {
  id: string
  name: string
  maxPlayers: number
  playersCount: number
}

interface Player {
  id: string
  name: string
  email: string
  password?: string
  isBlocked?: boolean
  number: number
  position: string
  age: number
  height: string
  weight?: string
  foot: string
  teamCategoryId: string | null
  teamCategoryName: string | null
  isInjured: boolean
  injuryReturn: Date | string | null
  gpsStats?: {
    maxSpeed: string
    distance: string
  }
  latestIndex?: {
    sleepHours: number | null
    sleepQuality: number | null
    stress: number | null
    soreness: number | null
    fatigue: number | null
    rpe: number | null
    heartRate: number | null
    date: string
  } | null
  latestTest?: {
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
}

interface EffectifsClientProps {
  initialPlayers: Player[]
  categories: Category[]
  userRole?: string
}

export default function EffectifsClient({ initialPlayers, categories, userRole }: EffectifsClientProps) {
  const isPlayer = userRole === "JOUEUR"
  const restrictedRoles = [
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "ENTRAINEUR_GARDIENS",
    "PREPARATEUR_PHYSIQUE",
    "MEDECIN"
  ]
  const canManage = !userRole || (!restrictedRoles.includes(userRole) && userRole !== "JOUEUR")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState<"Tous" | "Gardien" | "Défenseur" | "Milieu" | "Attaquant">("Tous")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Tous")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Form states
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newNum, setNewNum] = useState(12)
  const [newPos, setNewPos] = useState<"Gardien" | "Défenseur" | "Milieu" | "Attaquant">("Milieu")
  const [newAge, setNewAge] = useState(22)
  const [newHeight, setNewHeight] = useState("180cm")
  const [newWeight, setNewWeight] = useState("75kg")
  const [newFoot, setNewFoot] = useState<"Gaucher" | "Droitier" | "Ambidextre">("Droitier")
  const [selectedCatId, setSelectedCatId] = useState<string>("")

  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  // Convocation modal states
  const [isConvModalOpen, setIsConvModalOpen] = useState(false)
  const [convMessage, setConvMessage] = useState("Vous êtes convoqué pour le prochain match de l'équipe.")
  const [convSelectedPlayers, setConvSelectedPlayers] = useState<string[]>([])
  const [convDate, setConvDate] = useState("")
  const [convTime, setConvTime] = useState("18:00")
  const [convLocation, setConvLocation] = useState("Stade municipal")
  const [convSearch, setConvSearch] = useState("")
  const [convCategoryFilter, setConvCategoryFilter] = useState("Tous")
  const canConvoquer = userRole !== "JOUEUR"

  // Convocation history states
  const [convActiveTab, setConvActiveTab] = useState<"send" | "history">("send")
  const [sentConvocations, setSentConvocations] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editNum, setEditNum] = useState(12)
  const [editPos, setEditPos] = useState<"Gardien" | "Défenseur" | "Milieu" | "Attaquant">("Milieu")
  const [editAge, setEditAge] = useState(22)
  const [editHeight, setEditHeight] = useState("180cm")
  const [editWeight, setEditWeight] = useState("75kg")
  const [editFoot, setEditFoot] = useState<"Gaucher" | "Droitier" | "Ambidextre">("Droitier")
  const [editCatId, setEditCatId] = useState<string>("")

  const handleEditClick = (player: Player) => {
    setEditingPlayer(player)
    
    // Split full name into first and last name
    const parts = player.name.split(" ")
    const lastName = parts.pop() || ""
    const firstName = parts.join(" ")
    
    setEditFirstName(firstName)
    setEditLastName(lastName)
    setEditEmail(player.email || "")
    setEditPassword("") // Leave empty by default
    setEditNum(player.number)
    setEditPos(player.position as any)
    setEditAge(player.age)
    setEditHeight(player.height)
    setEditWeight(player.weight || "75kg")
    setEditFoot(player.foot as any)
    setEditCatId(player.teamCategoryId || "")
    
    setIsEditModalOpen(true)
  }

  const handleEditPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlayer) return
    setSuccessMsg("")
    setErrorMsg("")

    const formattedFirstName = editFirstName.trim()
      .split(/([- ])/)
      .map((part) => {
        if (part === "-" || part === " ") return part
        if (part.length === 0) return ""
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      })
      .join("")

    const formattedLastName = editLastName.trim().toUpperCase()

    if (!formattedFirstName || !formattedLastName) {
      setErrorMsg("Le prénom et le nom sont requis.")
      return
    }

    if (!editEmail.trim()) {
      setErrorMsg("L'email est requis.")
      return
    }

    if (!editCatId) {
      setErrorMsg("Veuillez sélectionner une équipe. Ce champ est obligatoire.")
      return
    }

    const fullName = `${formattedFirstName} ${formattedLastName}`

    // Check capacity limit client-side if category changed
    if (editCatId !== editingPlayer.teamCategoryId) {
      const cat = categories.find((c) => c.id === editCatId)
      if (cat && cat.playersCount >= cat.maxPlayers) {
        setErrorMsg(`L'équipe "${cat.name}" a déjà atteint sa limite d'effectif (${cat.maxPlayers} max).`)
        return
      }
    }

    // Check if the jersey number is already taken in this team by someone else
    const numberTaken = initialPlayers.some(
      (p) => p.id !== editingPlayer.id && p.teamCategoryId === editCatId && p.number === Number(editNum)
    )
    if (numberTaken) {
      setErrorMsg("Ce numéro est déjà choisi par un autre joueur de cette équipe.")
      return
    }

    startTransition(async () => {
      const res = await updatePlayerAction({
        id: editingPlayer.id,
        name: fullName,
        number: Number(editNum),
        position: editPos,
        age: Number(editAge),
        height: editHeight,
        weight: editWeight,
        foot: editFoot,
        teamCategoryId: editCatId,
        email: editEmail.trim(),
        password: editPassword
      })

      if (res.success) {
        setSuccessMsg(`Joueur ${fullName} modifié avec succès !`)
        setIsEditModalOpen(false)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleSendConvocation = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg("")

    if (convSelectedPlayers.length === 0) {
      setErrorMsg("Il faut sélectionner au moins un joueur.")
      return
    }

    startTransition(async () => {
      const res = await convoquerPlayersAction({
        playerIds: convSelectedPlayers,
        message: convMessage,
        date: convDate,
        time: convTime,
        location: convLocation
      })

      if (res.success) {
        setSuccessMsg("Convocation envoyée avec succès aux joueurs sélectionnés !")
        setIsConvModalOpen(false)
        setConvSelectedPlayers([])
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de l'envoi de la convocation.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    const res = await getSentConvocationsAction()
    if (res.success && res.convocations) {
      const grouped: Record<string, any> = {}
      res.convocations.forEach((conv: any) => {
        const key = `${conv.title}-${conv.message}`
        if (!grouped[key]) {
          grouped[key] = {
            title: conv.title,
            message: conv.message,
            createdAt: conv.createdAt,
            expiresAt: conv.expiresAt,
            players: []
          }
        }
        const playerName = conv.user?.name || "Joueur"
        const jersey = conv.user?.player?.number ? ` (N°${conv.user.player.number})` : ""
        grouped[key].players.push(`${playerName}${jersey}`)
      })
      setSentConvocations(Object.values(grouped))
    }
    setLoadingHistory(false)
  }

  useEffect(() => {
    if (isConvModalOpen && convActiveTab === "history") {
      loadHistory()
    }
  }, [isConvModalOpen, convActiveTab])

  const handleDeleteConvocation = async (title: string, message: string) => {
    if (!confirm("Voulez-vous vraiment annuler/supprimer cette convocation ?")) {
      return
    }
    const res = await deleteConvocationAction(title, message)
    if (res.success) {
      setSuccessMsg("Convocation annulée avec succès !")
      loadHistory()
      router.refresh()
      setTimeout(() => setSuccessMsg(""), 5000)
    } else {
      setErrorMsg(res.error || "Erreur de suppression de la convocation.")
      setTimeout(() => setErrorMsg(""), 5000)
    }
  }

  const handleToggleBlock = (id: string, name: string, isBlocked?: boolean) => {
    const actionWord = isBlocked ? "débloquer" : "bloquer"
    if (!confirm(`Voulez-vous vraiment ${actionWord} le joueur ${name} ?`)) {
      return
    }

    startTransition(async () => {
      const res = await toggleBlockPlayer(id)
      if (res.success) {
        setSuccessMsg(`Statut du joueur ${name} modifié.`)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Impossible de modifier le statut.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg("")

    const formattedFirstName = newFirstName.trim()
      .split(/([- ])/)
      .map((part) => {
        if (part === "-" || part === " ") return part
        if (part.length === 0) return ""
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      })
      .join("")

    const formattedLastName = newLastName.trim().toUpperCase()

    if (!formattedFirstName || !formattedLastName) {
      setErrorMsg("Le prénom et le nom sont requis.")
      return
    }

    if (!newEmail.trim()) {
      setErrorMsg("L'email est requis.")
      return
    }

    if (!newPassword.trim()) {
      setErrorMsg("Le mot de passe est requis.")
      return
    }

    if (!selectedCatId) {
      setErrorMsg("Veuillez sélectionner une équipe. Ce champ est obligatoire.")
      return
    }

    const fullName = `${formattedFirstName} ${formattedLastName}`

    // Double check capacity limit client-side
    const cat = categories.find((c) => c.id === selectedCatId)
    if (cat && cat.playersCount >= cat.maxPlayers) {
      setErrorMsg(`L'équipe "${cat.name}" a déjà atteint sa limite d'effectif (${cat.maxPlayers} max).`)
      return
    }

    // Check if the jersey number is already taken in this team
    const numberTaken = initialPlayers.some(
      (p) => p.teamCategoryId === selectedCatId && p.number === Number(newNum)
    )
    if (numberTaken) {
      setErrorMsg(
        "Ce numéro est déjà choisi, veuillez le modifier."
      )
      return
    }

    startTransition(async () => {
      const res = await createPlayer({
        name: fullName,
        number: Number(newNum),
        position: newPos,
        age: Number(newAge),
        height: newHeight,
        weight: newWeight,
        foot: newFoot,
        teamCategoryId: selectedCatId,
        email: newEmail.trim(),
        password: newPassword
      })

      if (res.success) {
        setSuccessMsg(`Joueur ${fullName} ajouté avec succès !`)
        setNewFirstName("")
        setNewLastName("")
        setNewEmail("")
        setNewPassword("")
        setNewWeight("75kg")
        setNewNum((prev) => prev + 1)
        setSelectedCatId("")
        setIsModalOpen(false)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le joueur ${name} ?`)) {
      return
    }

    startTransition(async () => {
      const res = await deletePlayer(id)
      if (res.success) {
        setSuccessMsg(`Joueur ${name} supprimé.`)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Impossible de supprimer le joueur.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  // Filter players by position and selected category
  const filteredPlayers = initialPlayers.filter((p) => {
    const matchesPosition = filter === "Tous" || p.position === filter
    const matchesCategory =
      selectedCategoryFilter === "Tous" ||
      (selectedCategoryFilter === "Sans équipe" && !p.teamCategoryId) ||
      p.teamCategoryId === selectedCategoryFilter
    return matchesPosition && matchesCategory
  })

  // Selected category info for form validation
  const selectedCat = categories.find((c) => c.id === selectedCatId)
  const isSelectedCatFull = selectedCat ? selectedCat.playersCount >= selectedCat.maxPlayers : false

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {isPlayer ? "Mes Stats" : "Effectifs"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {isPlayer 
              ? "Visualisez vos statistiques individuelles, votre profil et vos derniers indices de performance physique."
              : "Gérez la liste des joueurs licenciés et attribuez-les aux différentes équipes du club."
            }
          </p>
        </div>

        {/* Filters */}
        {!isPlayer && (
          <div className="flex flex-wrap gap-3 items-center">
            {/* Team Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-zinc-450 dark:text-zinc-400 uppercase">Équipe :</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-sm outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Tous">Toutes les équipes</option>
                <option value="Sans équipe">Sans équipe</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.playersCount}/{cat.maxPlayers})
                  </option>
                ))}
              </select>
            </div>

            {/* Position Filter tabs */}
            <div className="flex flex-wrap gap-1.5 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-800 shrink-0">
              {(["Tous", "Gardien", "Défenseur", "Milieu", "Attaquant"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilter(pos)}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider ${
                    filter === pos
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {pos}s
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto lg:ml-0">
              {canConvoquer && (
                <button
                  type="button"
                  onClick={() => {
                    setConvActiveTab("send")
                    setConvSelectedPlayers([])
                    setConvMessage("Vous êtes convoqué pour le prochain match de l'équipe.")
                    setConvDate(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                    setConvTime("18:00")
                    setConvLocation("Stade municipal")
                    setIsConvModalOpen(true)
                  }}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  Convoquer 📢
                </button>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  Ajouter un Joueur ➕
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {successMsg && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-black text-emerald-650 dark:text-emerald-400 text-center">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-black text-red-655 dark:text-red-400 text-center">
          {errorMsg}
        </div>
      )}

      {/* Roster Cards/Table Full Width List */}
      <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              {isPlayer ? "Mon Profil & Stats" : `Joueurs (${filteredPlayers.length})`}
            </h3>
            <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 text-[9px] font-black uppercase border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
                }`}
              >
                🎴 Cartes
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-300"
                }`}
              >
                📊 Indices & Capacités
              </button>
            </div>
          </div>

          {filteredPlayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-12 text-center text-zinc-500 font-bold dark:border-zinc-850">
              Aucun joueur trouvé avec ces filtres.
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-auto space-y-4 group dark:border-zinc-800 dark:bg-zinc-900 ${
                    player.isBlocked ? "opacity-75 bg-zinc-50/50 dark:bg-zinc-950/20" : ""
                  }`}
                >
                  {/* Background design glow */}
                  <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:scale-150 transition-all duration-300" />

                  {(() => {
                    const isActiveInjured = player.isInjured && (
                      !player.injuryReturn || new Date(player.injuryReturn) > new Date()
                    );
                    return (
                      <>
                        <div className="flex gap-4 items-start relative z-10">
                          <svg
                            viewBox="0 0 100 100"
                            className={`w-12 h-12 fill-current shrink-0 ${
                              isActiveInjured
                                ? "text-red-500 dark:text-red-400"
                                : "text-emerald-500 dark:text-emerald-400"
                            }`}
                          >
                            <path d="M 80 10 L 65 10 C 60 20 40 20 35 10 L 20 10 L 5 25 L 20 35 L 20 90 L 80 90 L 80 35 L 95 25 Z" />
                            <text
                              x="50"
                              y="62"
                              textAnchor="middle"
                              className="fill-white dark:fill-zinc-900 font-extrabold text-2xl font-sans"
                            >
                              {player.number}
                            </text>
                          </svg>
                          <div className="min-w-0 pr-6">
                            <h4 className={`text-xs font-black uppercase truncate tracking-wide flex items-center gap-1.5 ${
                              isActiveInjured
                                ? "text-red-600 dark:text-red-500"
                                : "text-zinc-900 dark:text-white"
                            }`}>
                              {isActiveInjured && <span className="animate-pulse">🩹</span>}
                              {player.name}
                            </h4>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className="inline-flex rounded-md bg-zinc-100 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-zinc-650 dark:bg-zinc-800 dark:text-zinc-300">
                                {player.position}
                              </span>
                              {player.teamCategoryName ? (
                                <span className={`inline-flex rounded-md px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider border ${
                                  isActiveInjured
                                    ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-100 dark:border-red-900"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900"
                                }`}>
                                  ⚽ {player.teamCategoryName}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-md bg-zinc-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-zinc-450 dark:bg-zinc-900 dark:text-zinc-500 border border-zinc-150 dark:border-zinc-800">
                                  Sans équipe
                                </span>
                              )}
                              {player.isBlocked && (
                                <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-amber-700 border border-amber-250 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 animate-pulse">
                                  Bloqué
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="grid grid-cols-4 gap-1 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-[9px] font-bold text-zinc-400">
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Âge</p>
                      <p className="text-zinc-850 dark:text-zinc-200 text-[10px] font-black">{player.age} ans</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Taille</p>
                      <p className="text-zinc-850 dark:text-zinc-200 text-[10px] font-black">{player.height}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Poids</p>
                      <p className="text-zinc-850 dark:text-zinc-200 text-[10px] font-black">{player.weight || "75kg"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-zinc-400 uppercase">Pied</p>
                      <p className="text-zinc-850 dark:text-zinc-200 text-[10px] font-black">{player.foot}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-zinc-950 rounded-xl px-3 py-1.5 text-[9px] font-bold text-zinc-500 dark:text-zinc-400 flex justify-between">
                    <span>Vitesse Max: <strong className="text-emerald-600 dark:text-emerald-400">{player.gpsStats?.maxSpeed || "En attente"}</strong></span>
                    <span>Dist/Séance: <strong className="text-emerald-600 dark:text-emerald-400">{player.gpsStats?.distance || "En attente"}</strong></span>
                  </div>

                  {/* Actions Row */}
                  {canManage && (
                    <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => handleEditClick(player)}
                        className="flex-1 py-2 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleToggleBlock(player.id, player.name, player.isBlocked)}
                        className={`flex-1 py-2 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          player.isBlocked
                            ? "bg-amber-500 text-white hover:bg-amber-450"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-750 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {player.isBlocked ? "Débloquer" : "Bloquer"}
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.name)}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-655 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer dark:bg-red-950/20 dark:text-red-400"
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-955 text-[9px] font-black text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                    <th className="py-3 px-4">Joueur</th>
                    <th className="py-3 px-4 text-center">Sommeil</th>
                    <th className="py-3 px-4 text-center">Stress</th>
                    <th className="py-3 px-4 text-center">Fatigue</th>
                    <th className="py-3 px-4 text-center">Courbatures</th>
                    <th className="py-3 px-4 text-center">RPE</th>
                    <th className="py-3 px-4 text-center">FC (bpm)</th>
                    <th className="py-3 px-4 text-center font-bold">VMA / VO2</th>
                    <th className="py-3 px-4 text-center">Sprint 10/30m</th>
                    <th className="py-3 px-4 text-center">Explo / Agil / Gras</th>
                    {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-350 font-semibold">
                  {filteredPlayers.map((player) => {
                    const idx = player.latestIndex
                    const tst = player.latestTest
                    return (
                      <tr
                        key={player.id}
                        className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 ${
                          player.isBlocked ? "opacity-75 bg-zinc-50/30 dark:bg-zinc-950/10" : ""
                        }`}
                      >
                        {/* Name and jersey number */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <svg
                              viewBox="0 0 100 100"
                              className={`w-8 h-8 fill-current shrink-0 ${
                                player.isInjured
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-emerald-500 dark:text-emerald-400"
                              }`}
                            >
                              <path d="M 80 10 L 65 10 C 60 20 40 20 35 10 L 20 10 L 5 25 L 20 35 L 20 90 L 80 90 L 80 35 L 95 25 Z" />
                              <text
                                x="50"
                                y="62"
                                textAnchor="middle"
                                className="fill-white dark:fill-zinc-900 font-black text-3xl font-sans"
                              >
                                {player.number}
                              </text>
                            </svg>
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white truncate max-w-[120px]" title={player.name}>
                                {player.name}
                              </p>
                              <p className="text-[8px] text-zinc-450 dark:text-zinc-400 font-medium">
                                {player.position} {player.isBlocked ? "| 🔒 Bloqué" : ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Sleep */}
                        <td className="py-3 px-4 text-center">
                          {idx?.sleepHours ? (
                            <span className="text-zinc-850 dark:text-zinc-200 font-black">
                              {idx.sleepHours}h <span className="text-[8px] text-zinc-400">({idx.sleepQuality}/7)</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Stress */}
                        <td className="py-3 px-4 text-center">
                          {idx?.stress !== undefined && idx?.stress !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${idx.stress > 4 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                              {idx.stress}/7
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Fatigue */}
                        <td className="py-3 px-4 text-center">
                          {idx?.fatigue !== undefined && idx?.fatigue !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${idx.fatigue > 4 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                              {idx.fatigue}/7
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Courbatures */}
                        <td className="py-3 px-4 text-center">
                          {idx?.soreness !== undefined && idx?.soreness !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${idx.soreness > 4 ? "text-amber-500 bg-amber-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                              {idx.soreness}/7
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* RPE */}
                        <td className="py-3 px-4 text-center">
                          {idx?.rpe !== undefined && idx?.rpe !== null ? (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${idx.rpe > 6 ? "text-red-500 bg-red-500/10" : "text-emerald-500 bg-emerald-500/10"}`}>
                              {idx.rpe}/10
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* FC */}
                        <td className="py-3 px-4 text-center">
                          {idx?.heartRate ? (
                            <span className="text-zinc-850 dark:text-zinc-200 font-black">
                              {idx.heartRate} <span className="text-[8px] text-zinc-400 font-normal">bpm</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Endurance VMA / VO2 */}
                        <td className="py-3 px-4 text-center">
                          {tst ? (
                            <div className="flex flex-col items-center">
                              <span className="text-zinc-900 dark:text-white font-extrabold">{tst.vma} km/h</span>
                              <span className="text-[8px] text-emerald-500 font-bold">{tst.vo2Max} ml/kg</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Sprint */}
                        <td className="py-3 px-4 text-center">
                          {tst ? (
                            <div className="flex flex-col items-center text-[9px] font-bold">
                              <span>10m: {tst.sprint10m}s</span>
                              <span className="text-blue-500">30m: {tst.sprint30m}s</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Explo / Agil / Gras */}
                        <td className="py-3 px-4 text-center text-[9px]">
                          {tst ? (
                            <div className="flex flex-col items-center gap-0.5 font-bold">
                              <span>CMJ: {tst.cmj}cm | SJ: {tst.sj}cm</span>
                              <span>Agil: <strong className="text-amber-500">{tst.illinois}s</strong> | Gras: <strong className="text-cyan-500">{tst.fat}%</strong></span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-bold">N/A</span>
                          )}
                        </td>

                        {/* Actions Cell */}
                        {canManage && (
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex gap-1.5 justify-end">
                              <button
                                onClick={() => handleEditClick(player)}
                                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-750 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleToggleBlock(player.id, player.name, player.isBlocked)}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                  player.isBlocked
                                    ? "bg-amber-500 text-white hover:bg-amber-450"
                                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-750 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                                }`}
                              >
                                {player.isBlocked ? "Débloquer" : "Bloquer"}
                              </button>
                              <button
                                onClick={() => handleDelete(player.id, player.name)}
                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer dark:bg-red-950/20 dark:text-red-400"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Modal Dialog for Adding a Player */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-2xl dark:border-zinc-850 dark:bg-zinc-900 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-white cursor-pointer font-black text-sm"
              title="Fermer"
            >
              ✕
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Ajouter un Nouveau Joueur
            </h3>

            {errorMsg && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 text-center animate-pulse">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LACAZETTE"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alexandre"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: joueur@evo-sports.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Mot de passe</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: MotDePasse123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Âge</label>
                  <input
                    type="number"
                    required
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Taille</label>
                  <input
                    type="text"
                    required
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Poids</label>
                  <input
                    type="text"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Poste (Position)</label>
                  <select
                    value={newPos}
                    onChange={(e) => setNewPos(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-1.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  >
                    <option value="Gardien">Gardien</option>
                    <option value="Défenseur">Défenseur</option>
                    <option value="Milieu">Milieu</option>
                    <option value="Attaquant">Attaquant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">N° Maillot</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={newNum}
                    onChange={(e) => setNewNum(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Pied</label>
                  <select
                    value={newFoot}
                    onChange={(e) => setNewFoot(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-1 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  >
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                    <option value="Ambidextre">Ambi.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Équipe / Catégorie</label>
                <select
                  value={selectedCatId}
                  required
                  onChange={(e) => {
                    setSelectedCatId(e.target.value)
                    setErrorMsg("")
                  }}
                  className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold ${
                    isSelectedCatFull ? "border-red-500 text-red-600 focus:border-red-500" : ""
                  }`}
                >
                  <option value="">Sélectionner une équipe</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} disabled={cat.playersCount >= cat.maxPlayers}>
                      {cat.name} ({cat.playersCount}/{cat.maxPlayers} joueurs){cat.playersCount >= cat.maxPlayers ? " - [PLEIN]" : ""}
                    </option>
                  ))}
                </select>
                {selectedCat && (
                  <div className="mt-1 flex justify-between text-[8px] font-black uppercase">
                    <span className={isSelectedCatFull ? "text-red-500" : "text-emerald-600"}>
                      Effectif : {selectedCat.playersCount} / {selectedCat.maxPlayers} Max
                    </span>
                    {isSelectedCatFull && (
                      <span className="text-red-500 font-bold">⚠️ Limite atteinte</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPending || isSelectedCatFull}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider py-3 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                {isPending ? "Ajout..." : "Ajouter Joueur ➕"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Editing a Player */}
      {isEditModalOpen && editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-2xl dark:border-zinc-850 dark:bg-zinc-900 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => {
                setIsEditModalOpen(false)
                setEditingPlayer(null)
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-white cursor-pointer font-black text-sm"
              title="Fermer"
            >
              ✕
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              Modifier le Joueur : {editingPlayer.name}
            </h3>

            {errorMsg && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-650 text-center animate-pulse">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEditPlayer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Nom</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LACAZETTE"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Alexandre"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: joueur@evo-sports.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Mot de passe</label>
                  <input
                    type="text"
                    placeholder="Laisser vide pour ne pas changer"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Âge</label>
                  <input
                    type="number"
                    required
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Taille</label>
                  <input
                    type="text"
                    required
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Poids</label>
                  <input
                    type="text"
                    required
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Poste (Position)</label>
                  <select
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-1.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  >
                    <option value="Gardien">Gardien</option>
                    <option value="Défenseur">Défenseur</option>
                    <option value="Milieu">Milieu</option>
                    <option value="Attaquant">Attaquant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">N° Maillot</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={editNum}
                    onChange={(e) => setEditNum(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Pied</label>
                  <select
                    value={editFoot}
                    onChange={(e) => setEditFoot(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-1 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 font-bold"
                  >
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                    <option value="Ambidextre">Ambi.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Équipe / Catégorie</label>
                <select
                  value={editCatId}
                  required
                  onChange={(e) => {
                    setEditCatId(e.target.value)
                    setErrorMsg("")
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                >
                  <option value="">Sélectionner une équipe</option>
                  {categories.map((cat) => {
                    const isSameCat = cat.id === editingPlayer.teamCategoryId
                    const isCatFull = cat.playersCount >= cat.maxPlayers
                    return (
                      <option key={cat.id} value={cat.id} disabled={!isSameCat && isCatFull}>
                        {cat.name} ({cat.playersCount}/{cat.maxPlayers} joueurs){(!isSameCat && isCatFull) ? " - [PLEIN]" : ""}
                      </option>
                    )
                  })}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider py-3 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
              >
                {isPending ? "Modification..." : "Modifier Joueur 💾"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Convocation */}
      {isConvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-2xl dark:border-zinc-850 dark:bg-zinc-900 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Close button */}
            <button
              onClick={() => setIsConvModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-white cursor-pointer font-black text-sm"
              title="Fermer"
            >
              ✕
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white pb-3 border-b border-zinc-100 dark:border-zinc-800">
              📢 Gestion des Convocations
            </h3>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 gap-4">
              <button
                type="button"
                onClick={() => setConvActiveTab("send")}
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
                  convActiveTab === "send"
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                }`}
              >
                Nouvelle Convocation 📢
              </button>
              <button
                type="button"
                onClick={() => setConvActiveTab("history")}
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer text-center ${
                  convActiveTab === "history"
                    ? "border-amber-500 text-amber-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                }`}
              >
                Envoyées / Historique 📜
              </button>
            </div>

            {convActiveTab === "send" ? (
              <form onSubmit={handleSendConvocation} className="space-y-4 animate-in fade-in duration-200">
                {/* Message */}
                <div>
                  <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Message de convocation</label>
                  <textarea
                    required
                    rows={2}
                    value={convMessage}
                    onChange={(e) => setConvMessage(e.target.value)}
                    placeholder="Ex: Merci de vous présenter en tenue officielle..."
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>

                {/* Date / Time / Lieu */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={convDate}
                      onChange={(e) => setConvDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Heure</label>
                    <input
                      type="time"
                      required
                      value={convTime}
                      onChange={(e) => setConvTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Lieu</label>
                    <input
                      type="text"
                      required
                      value={convLocation}
                      onChange={(e) => setConvLocation(e.target.value)}
                      placeholder="Ex: Stade municipal"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                {/* Selection of players */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[9px] font-black text-zinc-500 uppercase">
                      Sélectionner les joueurs ({convSelectedPlayers.length} sélectionné(s))
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allIds = initialPlayers.map(p => p.id)
                          setConvSelectedPlayers(allIds)
                        }}
                        className="text-[8px] font-black uppercase text-amber-600 hover:text-amber-500 cursor-pointer"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        type="button"
                        onClick={() => setConvSelectedPlayers([])}
                        className="text-[8px] font-black uppercase text-zinc-500 hover:text-zinc-400 cursor-pointer"
                      >
                        Effacer
                      </button>
                    </div>
                  </div>

                  {/* Player search / filter in modal */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Rechercher un joueur..."
                      value={convSearch}
                      onChange={(e) => setConvSearch(e.target.value)}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] text-zinc-900 outline-none focus:border-amber-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                    <select
                      value={convCategoryFilter}
                      onChange={(e) => setConvCategoryFilter(e.target.value)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    >
                      <option value="Tous">Toutes catégories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Players Checkbox List */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-48 overflow-y-auto p-2 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-950/20 custom-scrollbar">
                    {(() => {
                      const filtered = initialPlayers.filter(p => {
                        const matchesSearch = p.name.toLowerCase().includes(convSearch.toLowerCase())
                        const matchesCat = convCategoryFilter === "Tous" || p.teamCategoryId === convCategoryFilter
                        return matchesSearch && matchesCat
                      })

                      if (filtered.length === 0) {
                        return <p className="text-[10px] text-zinc-400 font-bold text-center py-4">Aucun joueur ne correspond</p>
                      }

                      return filtered.map((player) => {
                        const isChecked = convSelectedPlayers.includes(player.id)
                        return (
                          <label
                            key={player.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 ${
                              isChecked
                                ? "bg-amber-500/5 border-amber-500/20 text-zinc-900 dark:text-white font-black"
                                : "border-transparent text-zinc-700 dark:text-zinc-350"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setConvSelectedPlayers(prev => prev.filter(id => id !== player.id))
                                } else {
                                  setConvSelectedPlayers(prev => [...prev, player.id])
                                }
                              }}
                              className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer h-3.5 w-3.5"
                            />
                            <div className="flex justify-between w-full text-[11px]">
                              <span>N°{player.number} - {player.name}</span>
                              <span className="text-[9px] text-zinc-450 uppercase font-black">{player.teamCategoryName || "Sans catégorie"}</span>
                            </div>
                          </label>
                        )
                      })
                    })()}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-250 disabled:text-zinc-500 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider py-3 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  {isPending ? "Envoi..." : "Envoyer la Convocation 🚀"}
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
                    <span className="text-[10px] font-black uppercase text-zinc-400">Chargement de l'historique...</span>
                  </div>
                ) : sentConvocations.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400">
                    <p className="text-xs font-bold">Aucune convocation envoyée récemment.</p>
                    <p className="text-[10px] text-zinc-550">Les convocations sont supprimées de l'historique 24h après leur date d'expiration.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    {sentConvocations.map((conv, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20 space-y-2 relative group hover:border-amber-500/30 transition-all">
                        <button
                          onClick={() => handleDeleteConvocation(conv.title, conv.message)}
                          className="absolute top-3 right-3 text-[10px] font-black text-red-500 hover:text-red-400 transition-colors cursor-pointer uppercase tracking-wider"
                          title="Annuler cette convocation"
                        >
                          Annuler 🗑️
                        </button>
                        <div className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1.5">
                          <span>🔔 {conv.title}</span>
                          <span className="text-zinc-400 font-medium">| Envoyée le {new Date(conv.createdAt).toLocaleDateString('fr-FR')} à {new Date(conv.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-zinc-850 dark:text-zinc-200 font-semibold whitespace-pre-wrap">{conv.message}</p>
                        {conv.expiresAt && (
                          <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
                            ⏳ Supprimée automatiquement le : {new Date(conv.expiresAt).toLocaleDateString('fr-FR')} à {new Date(conv.expiresAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                          <span className="block text-[8px] font-black uppercase text-zinc-400">Joueurs convoqués :</span>
                          <p className="text-[10px] text-zinc-650 dark:text-zinc-400 font-bold leading-relaxed">{conv.players.join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
