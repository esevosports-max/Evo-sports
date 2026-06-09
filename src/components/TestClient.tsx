"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createPhysicalTest, deletePhysicalTest } from "@/app/dashboard/test/actions"

interface ClientPlayer {
  id: string
  name: string
  teamCategoryId: string | null
  teamCategoryName: string
}

interface PhysicalTest {
  id: string
  playerId: string
  playerName: string
  playerCategoryName: string
  playerCategoryId: string | null
  vma: number
  vo2Max: number
  sprint10m: number
  sprint30m: number
  cmj: number
  sj: number
  illinois: number
  fat: number
  date: string
  createdAt: string
}

interface PlayerProfile {
  id: string
  name: string
  position: string
  number: number | null
  teamCategoryName: string
}

interface TestClientProps {
  isStaff: boolean
  categories: Array<{ id: string; name: string }>
  players: ClientPlayer[]
  tests: PhysicalTest[]
  playerProfile: PlayerProfile | null
}

// Global score calculation based on typical football physical benchmarks
function calculatePhysicalScore(t: {
  vma: number
  vo2Max: number
  sprint10m: number
  sprint30m: number
  cmj: number
  sj: number
  illinois: number
  fat: number
}) {
  // Normalize each metric to a score from 0 to 100
  // VMA: 12 km/h is 0%, 22 km/h is 100%
  const vmaScore = Math.max(0, Math.min(100, ((t.vma - 12) / 10) * 100))
  // VO2 Max: 40 ml/kg is 0%, 80 ml/kg is 100%
  const vo2Score = Math.max(0, Math.min(100, ((t.vo2Max - 40) / 40) * 100))
  // Sprint 10m: lower is better. 2.4s is 0%, 1.5s is 100%
  const sprint10Score = Math.max(0, Math.min(100, ((2.4 - t.sprint10m) / 0.9) * 100))
  // Sprint 30m: lower is better. 4.8s is 0%, 3.5s is 100%
  const sprint30Score = Math.max(0, Math.min(100, ((4.8 - t.sprint30m) / 1.3) * 100))
  // CMJ: 20 cm is 0%, 65 cm is 100%
  const cmjScore = Math.max(0, Math.min(100, ((t.cmj - 20) / 45) * 100))
  // SJ: 15 cm is 0%, 60 cm is 100%
  const sjScore = Math.max(0, Math.min(100, ((t.sj - 15) / 45) * 100))
  // Illinois: lower is better. 21s is 0%, 13.5s is 100%
  const illinoisScore = Math.max(0, Math.min(100, ((21 - t.illinois) / 7.5) * 100))
  // Body fat: ideal is 10%. Subtract 10 points for each 1% deviation.
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
}

function getScoreDefinition(score: number) {
  if (score >= 85) {
    return {
      grade: "Elite 🏆",
      description: "Performances exceptionnelles. L'athlète possède des aptitudes physiques de niveau professionnel/élite sur toutes les dimensions mesurées.",
      color: "text-emerald-500",
      bgClass: "bg-emerald-500/10 border-emerald-500/20"
    }
  }
  if (score >= 70) {
    return {
      grade: "Très Bien 👍",
      description: "Excellent profil athlétique de compétition. Niveau solide nécessitant de légers réglages ciblés en explosivité ou vitesse de pointe.",
      color: "text-blue-500",
      bgClass: "bg-blue-500/10 border-blue-500/20"
    }
  }
  if (score >= 50) {
    return {
      grade: "Standard ⚡",
      description: "Aptitudes athlétiques normales pour la compétition. Le joueur doit développer son endurance foncière et optimiser sa composition corporelle.",
      color: "text-amber-500",
      bgClass: "bg-amber-500/10 border-amber-500/20"
    }
  }
  return {
    grade: "En Développement 📈",
    description: "Niveau athlétique en deçà des attentes compétitives. Un programme individualisé de renforcement et de développement de la VMA est recommandé.",
    color: "text-red-500",
    bgClass: "bg-red-500/10 border-red-500/20"
  }
}

export default function TestClient({
  isStaff,
  categories,
  players,
  tests,
  playerProfile
}: TestClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // --- Staff States ---
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Tous")
  const [searchQuery, setSearchQuery] = useState("")

  // Form parameters
  const [vma, setVma] = useState(16.5)
  const [vo2Max, setVo2Max] = useState(62.0)
  const [sprint10m, setSprint10m] = useState(1.85)
  const [sprint30m, setSprint30m] = useState(3.90)
  const [cmj, setCmj] = useState(42.0)
  const [sj, setSj] = useState(38.0)
  const [illinois, setIllinois] = useState(16.2)
  const [fat, setFat] = useState(11.5)

  // --- Actions Handlers ---
  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (!selectedPlayerId) {
      setErrorMsg("Veuillez sélectionner un joueur.")
      return
    }

    startTransition(async () => {
      const res = await createPhysicalTest(
        selectedPlayerId,
        Number(vma),
        Number(vo2Max),
        Number(sprint10m),
        Number(sprint30m),
        Number(cmj),
        Number(sj),
        Number(illinois),
        Number(fat)
      )

      if (res.success) {
        const playerObj = players.find((p) => p.id === selectedPlayerId)
        setSuccessMsg(`Test physique enregistré avec succès pour ${playerObj?.name || "le joueur"} !`)
        setSelectedPlayerId("")
        setVma(16.5)
        setVo2Max(62.0)
        setSprint10m(1.85)
        setSprint30m(3.90)
        setCmj(42.0)
        setSj(38.0)
        setIllinois(16.2)
        setFat(11.5)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur lors de l'enregistrement.")
      }
    })
  }

  const handleDelete = async (testId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce test physique ?")) return
    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await deletePhysicalTest(testId)
      if (res.success) {
        setSuccessMsg("Test physique supprimé avec succès.")
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur de suppression.")
      }
    })
  }

  // --- Export to CSV ---
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Joueur",
      "Equipe",
      "VMA (km/h)",
      "VO2 Max (ml/kg/min)",
      "Sprint 10m (s)",
      "Sprint 30m (s)",
      "CMJ (cm)",
      "SJ (cm)",
      "Illinois (s)",
      "Masse Grasse (%)",
      "Note Globale (/100)"
    ]

    const rows = filteredTests.map((t) => [
      formatDate(t.createdAt),
      t.playerName,
      t.playerCategoryName,
      t.vma.toString(),
      t.vo2Max.toString(),
      t.sprint10m.toString(),
      t.sprint30m.toString(),
      t.cmj.toString(),
      t.sj.toString(),
      t.illinois.toString(),
      t.fat.toString(),
      calculatePhysicalScore(t).toString()
    ])

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `evaluation_physique_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Filtering tests for staff ---
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchesCategory =
        selectedCategoryFilter === "Tous" || t.playerCategoryId === selectedCategoryFilter
      const matchesSearch =
        t.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.playerCategoryName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [tests, selectedCategoryFilter, searchQuery])

  // --- Helper formatting ---
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // --- Player stats extraction ---
  const latestTest = tests[0] || null

  const playerPhysicalScore = useMemo(() => {
    if (!latestTest) return 0
    return calculatePhysicalScore(latestTest)
  }, [latestTest])

  const scoreDefinition = useMemo(() => {
    return getScoreDefinition(playerPhysicalScore)
  }, [playerPhysicalScore])

  // SVG Gauge calculations
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = useMemo(() => {
    return circumference - (playerPhysicalScore / 100) * circumference
  }, [playerPhysicalScore, circumference])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs font-bold text-red-500">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-500">
          🎉 {successMsg}
        </div>
      )}

      {isStaff ? (
        /* ========================================================== */
        /* ==================== STAFF SUB-PAGE ==================== */
        /* ========================================================== */
        <div className="space-y-6">
          {/* Header Banner */}
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
                Tests Physiques & Aptitudes (Staff)
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Saisie et suivi des 5 catégories de tests athlétiques avec calcul de note globale.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredTests.length === 0}
              className="rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-emerald-600 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-emerald-400 dark:border-zinc-700 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all cursor-pointer"
            >
              Exporter vers Excel
            </button>
          </section>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left panel: tests roster list */}
            <div className="xl:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-850 pb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white self-start sm:self-auto">
                  Historique des évaluations ({filteredTests.length})
                </h3>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Rechercher un joueur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 sm:w-48 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-medium"
                  />

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  >
                    <option value="Tous">Toutes les équipes</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tests listing */}
              {filteredTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-400 text-xs font-bold">
                  Aucune évaluation physique enregistrée.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTests.map((t) => {
                    const score = calculatePhysicalScore(t)
                    const def = getScoreDefinition(score)
                    return (
                      <div
                        key={t.id}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 p-5 shadow-sm space-y-4 hover:shadow transition-all relative group flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        {/* Player name & score */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2 pr-12">
                            <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                              {t.playerName}
                            </h4>
                            <span className="rounded bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-450 px-1.5 py-0.5 text-[8px] font-black uppercase">
                              {t.playerCategoryName}
                            </span>
                            <span className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${def.bgClass} ${def.color}`}>
                              Note: {score}/100 ({def.grade})
                            </span>
                          </div>

                          {/* Grid of parameters */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px] font-bold text-zinc-400 pt-1">
                            <div>
                              <p className="text-[8px] text-zinc-450 uppercase">Endurance</p>
                              <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">VMA: {t.vma} km/h</p>
                              <p className="text-zinc-500 font-medium">VO2: {t.vo2Max} ml/kg</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-450 uppercase">Vitesse</p>
                              <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">10m: {t.sprint10m}s</p>
                              <p className="text-zinc-500 font-medium">30m: {t.sprint30m}s</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-450 uppercase">Explosivité</p>
                              <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">CMJ: {t.cmj} cm</p>
                              <p className="text-zinc-500 font-medium">SJ: {t.sj} cm</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-450 uppercase">Agilité</p>
                              <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">Illinois: {t.illinois}s</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-zinc-450 uppercase">Morphologie</p>
                              <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">Masse gr.: {t.fat}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Date and Delete actions */}
                        <div className="flex md:flex-col items-end gap-2 justify-between w-full md:w-auto border-t md:border-t-0 border-zinc-100 dark:border-zinc-850 pt-2 md:pt-0">
                          <p className="text-[9px] text-zinc-450">Évalué le {formatDate(t.date)}</p>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-red-500 hover:text-red-650 bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded px-2.5 py-1 text-[8px] font-black uppercase cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right panel: log physical test form */}
            <div className="xl:col-span-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02] dark:border-emerald-500/10 p-6 shadow-sm h-fit space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-850 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                  Enregistrer une Évaluation
                </h3>
                <p className="text-[9px] text-zinc-400 mt-1">
                  Saisie des tests physiques pour les 5 catégories athlétiques.
                </p>
              </div>

              <form onSubmit={handleAddTest} className="space-y-4">
                {/* Player Select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-500 uppercase">Sélectionner le joueur :</label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  >
                    <option value="">-- Choisir un joueur --</option>
                    {categories.map((cat) => {
                      const catPlayers = players.filter((p) => p.teamCategoryId === cat.id)
                      if (catPlayers.length === 0) return null
                      return (
                        <optgroup key={cat.id} label={cat.name}>
                          {catPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      )
                    })}
                    {players.filter((p) => !p.teamCategoryId).length > 0 && (
                      <optgroup label="Sans équipe">
                        {players
                          .filter((p) => !p.teamCategoryId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Categories blocks */}
                <div className="space-y-4">
                  {/* 1. Endurance */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">⚡ 1. Endurance</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">VMA (km/h) :</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="10"
                          max="25"
                          value={vma}
                          onChange={(e) => setVma(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">VO2 Max (ml/kg) :</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="30"
                          max="90"
                          value={vo2Max}
                          onChange={(e) => setVo2Max(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Vitesse */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">🏃 2. Vitesse</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Sprint 10m (s) :</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min="1.3"
                          max="3.0"
                          value={sprint10m}
                          onChange={(e) => setSprint10m(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Sprint 30m (s) :</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min="3.0"
                          max="6.5"
                          value={sprint30m}
                          onChange={(e) => setSprint30m(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Explosivité */}
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850">
                    <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest">🦘 3. Explosivité</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">CMJ (cm) :</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          min="15"
                          max="80"
                          value={cmj}
                          onChange={(e) => setCmj(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">SJ (cm) :</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          min="10"
                          max="75"
                          value={sj}
                          onChange={(e) => setSj(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 & 5. Agilité & Morphologie */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">🔄 4. Agilité</p>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Illinois (s) :</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="11"
                          max="25"
                          value={illinois}
                          onChange={(e) => setIllinois(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">📊 5. Morphologie</p>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">Masse grasse (%) :</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          min="5"
                          max="25"
                          value={fat}
                          onChange={(e) => setFat(Number(e.target.value))}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-emerald-600 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-emerald-400 dark:border-zinc-700 font-black uppercase text-[10px] tracking-wider py-3 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                >
                  {isPending ? "Enregistrement..." : "Enregistrer le test physique"}
                </button>
              </form>
            </div>

          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* ==================== PLAYER SUB-PAGE ==================== */
        /* ========================================================== */
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner - Player Profile summary */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl font-bold text-emerald-600">
                {playerProfile?.number || "🏃‍♂️"}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white uppercase">
                  {playerProfile?.name}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {playerProfile?.position} • {playerProfile?.teamCategoryName}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-black text-emerald-650 bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
              🧪 Fiche d&apos;aptitudes physiques
            </span>
          </section>

          {/* Dynamic Score section with SVG Circular Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SVG Circular progress card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col items-center justify-center text-center space-y-4 md:col-span-1">
              <p className="text-[10px] font-black text-zinc-450 uppercase tracking-widest">Note Athlétique Globale</p>
              
              <div className="relative flex items-center justify-center w-36 h-36">
                {/* SVG Gauge */}
                <svg className="w-36 h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-zinc-100 dark:stroke-zinc-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-emerald-500 transition-all duration-700 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Inner score label */}
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">
                    {latestTest ? playerPhysicalScore : "N/A"}
                  </span>
                  {latestTest && <span className="text-[9px] font-bold text-zinc-450 uppercase">/100</span>}
                </div>
              </div>

              {latestTest && (
                <div className="space-y-1">
                  <p className={`text-xs font-black uppercase ${scoreDefinition.color}`}>
                    Profil {scoreDefinition.grade}
                  </p>
                </div>
              )}
            </div>

            {/* Score Definition & Legend Explanation Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:col-span-2 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white mb-2">
                  Définition de votre Note Physique
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {latestTest
                    ? scoreDefinition.description
                    : "Aucune évaluation physique n'a encore été enregistrée pour vous. Votre note globale sera calculée dès que le staff technique aura saisi vos résultats physiques."}
                </p>
              </div>

              {/* Legends list */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 text-[10px] font-bold text-zinc-450">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>≥ 85 : Élite 🏆</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span>70 - 84 : Très Bien 👍</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span>50 - 69 : Standard ⚡</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span>&lt; 50 : En Développement 📈</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed parameter breakdown cards (5 categories) */}
          {latestTest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 1. Endurance */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">⚡ 1. Endurance</h4>
                  <span className="text-xs">🫁</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">VMA</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.vma} km/h</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">VO2 Max</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.vo2Max} ml/kg/min</span>
                  </div>
                </div>
              </div>

              {/* 2. Vitesse */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">🏃 2. Vitesse</h4>
                  <span className="text-xs">⚡</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">Sprint 10m</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.sprint10m} s</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">Sprint 30m</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.sprint30m} s</span>
                  </div>
                </div>
              </div>

              {/* 3. Explosivité */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest">🦘 3. Explosivité</h4>
                  <span className="text-xs">🚀</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">CMJ (Détente)</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.cmj} cm</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">SJ (Détente)</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.sj} cm</span>
                  </div>
                </div>
              </div>

              {/* 4. Agilité */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">🔄 4. Agilité</h4>
                  <span className="text-xs">🔄</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">Test Illinois</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.illinois} s</span>
                  </div>
                  <p className="text-[8px] text-zinc-450 font-medium">Mobilité multidirectionnelle.</p>
                </div>
              </div>

              {/* 5. Morphologie */}
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
                <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">📊 5. Morphologie</h4>
                  <span className="text-xs">⚖️</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-450 font-bold uppercase">Masse grasse</span>
                    <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">{latestTest.fat} %</span>
                  </div>
                  <p className="text-[8px] text-zinc-450 font-medium">Calculée par mesure des plis cutanés.</p>
                </div>
              </div>
            </div>
          )}

          {/* Player history list */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              Historique complet de vos performances
            </h3>

            {tests.length === 0 ? (
              <div className="text-center p-8 text-zinc-400 font-bold text-xs">
                Aucun test physique n&apos;a encore été enregistré pour vous.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-850">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-950 text-[9px] font-black text-zinc-500 uppercase tracking-wider border-b border-zinc-250 dark:border-zinc-800">
                      <th className="py-3 px-4">Date de l&apos;évaluation</th>
                      <th className="py-3 px-4 text-center">Note Globale</th>
                      <th className="py-3 px-4 text-center">Endurance</th>
                      <th className="py-3 px-4 text-center">Vitesse</th>
                      <th className="py-3 px-4 text-center">Explosivité</th>
                      <th className="py-3 px-4 text-center">Agilité</th>
                      <th className="py-3 px-4 text-center">Morphologie</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300 font-medium">
                    {tests.map((t) => {
                      const score = calculatePhysicalScore(t)
                      const def = getScoreDefinition(score)
                      return (
                        <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                          <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                            {formatDate(t.date)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${def.bgClass} ${def.color}`}>
                              {score}/100
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            VMA: {t.vma} | VO2: {t.vo2Max}
                          </td>
                          <td className="py-3 px-4 text-center">
                            10m: {t.sprint10m}s | 30m: {t.sprint30m}s
                          </td>
                          <td className="py-3 px-4 text-center">
                            CMJ: {t.cmj}cm | SJ: {t.sj}cm
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {t.illinois}s
                          </td>
                          <td className="py-3 px-4 text-center">
                            {t.fat}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
