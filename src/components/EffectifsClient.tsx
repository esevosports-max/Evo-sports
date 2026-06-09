"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createPlayer, deletePlayer } from "@/app/dashboard/effectifs/actions"

interface Category {
  id: string
  name: string
  maxPlayers: number
  playersCount: number
}

interface Player {
  id: string
  name: string
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
}

export default function EffectifsClient({ initialPlayers, categories }: EffectifsClientProps) {
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
  const [newNum, setNewNum] = useState(12)
  const [newPos, setNewPos] = useState<"Gardien" | "Défenseur" | "Milieu" | "Attaquant">("Milieu")
  const [newAge, setNewAge] = useState(22)
  const [newHeight, setNewHeight] = useState("180cm")
  const [newWeight, setNewWeight] = useState("75kg")
  const [newFoot, setNewFoot] = useState<"Gaucher" | "Droitier" | "Ambidextre">("Droitier")
  const [selectedCatId, setSelectedCatId] = useState<string>("")

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
        teamCategoryId: selectedCatId
      })

      if (res.success) {
        setSuccessMsg(`Joueur ${fullName} ajouté avec succès !`)
        setNewFirstName("")
        setNewLastName("")
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
            Effectifs
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Gérez la liste des joueurs licenciés et attribuez-les aux différentes équipes du club.
          </p>
        </div>

        {/* Filters */}
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

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer ml-auto lg:ml-0"
          >
            Ajouter un Joueur ➕
          </button>
        </div>
      </section>

      {/* Roster Cards/Table Full Width List */}
      <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              Joueurs ({filteredPlayers.length})
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
                  className="relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-52 overflow-hidden group dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Background design glow */}
                  <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full group-hover:scale-150 transition-all duration-300" />
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(player.id, player.name)}
                    className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 hover:scale-110 transition-all cursor-pointer font-black text-sm z-20"
                    title="Supprimer le joueur"
                  >
                    ✕
                  </button>

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-350 font-semibold">
                  {filteredPlayers.map((player) => {
                    const idx = player.latestIndex
                    const tst = player.latestTest
                    return (
                      <tr key={player.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20">
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
                              <p className="font-bold text-zinc-900 dark:text-white truncate max-w-[120px]">
                                {player.name}
                              </p>
                              <p className="text-[8px] text-zinc-400 font-medium">{player.position}</p>
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
    </div>
  )
}
