"use client"

import { useState, useTransition, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  createPhysicalTest,
  deletePhysicalTest,
  DEFAULT_PHYSICAL_TEST_TEMPLATE,
  savePhysicalTestTemplateAction
} from "@/app/dashboard/test/actions"

interface PhysicalQuality {
  key: string
  label: string
  icon: string
  unit: string
  min: number
  max: number
  defaultValue: number
  isDefault: boolean
}

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
  customValues?: any
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
  initialTemplate?: any
}

// Global score calculation based on physical test template
function calculatePhysicalScore(t: any, template: PhysicalQuality[]) {
  const values = {
    vma: t.vma,
    vo2Max: t.vo2Max,
    sprint10m: t.sprint10m,
    sprint30m: t.sprint30m,
    cmj: t.cmj,
    sj: t.sj,
    illinois: t.illinois,
    fat: t.fat,
    ...(t.customValues || {})
  }

  if (!template || template.length === 0) return 0

  const scores: number[] = []

  template.forEach((q) => {
    const val = values[q.key]
    if (val === undefined || val === null) return

    if (q.key === "vma") {
      scores.push(Math.max(0, Math.min(100, ((val - 12) / 10) * 100)))
    } else if (q.key === "vo2Max") {
      scores.push(Math.max(0, Math.min(100, ((val - 40) / 40) * 100)))
    } else if (q.key === "sprint10m") {
      scores.push(Math.max(0, Math.min(100, ((2.4 - val) / 0.9) * 100)))
    } else if (q.key === "sprint30m") {
      scores.push(Math.max(0, Math.min(100, ((4.8 - val) / 1.3) * 100)))
    } else if (q.key === "cmj") {
      scores.push(Math.max(0, Math.min(100, ((val - 20) / 45) * 100)))
    } else if (q.key === "sj") {
      scores.push(Math.max(0, Math.min(100, ((val - 15) / 45) * 100)))
    } else if (q.key === "illinois") {
      scores.push(Math.max(0, Math.min(100, ((21 - val) / 7.5) * 100)))
    } else if (q.key === "fat") {
      scores.push(Math.max(0, Math.min(100, 100 - Math.abs(val - 10) * 10)))
    } else {
      const range = q.max - q.min
      if (range > 0) {
        const pct = ((val - q.min) / range) * 100
        scores.push(Math.max(0, Math.min(100, pct)))
      } else {
        scores.push(50)
      }
    }
  })

  if (scores.length === 0) return 0
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
  return Math.round(avg)
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
  playerProfile,
  initialTemplate
}: TestClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // --- Staff States ---
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Tous")
  const [searchQuery, setSearchQuery] = useState("")

  // --- Physical Test Customization States ---
  const [isCustomizingTemplate, setIsCustomizingTemplate] = useState(false)
  const [template, setTemplate] = useState<PhysicalQuality[]>(() => {
    if (initialTemplate) {
      try {
        return typeof initialTemplate === "string" ? JSON.parse(initialTemplate) : initialTemplate
      } catch (e) {
        console.error("Error parsing template:", e)
      }
    }
    return DEFAULT_PHYSICAL_TEST_TEMPLATE
  })

  // Dynamic values state for form inputs
  const [formValues, setFormValues] = useState<Record<string, number>>(() => {
    const initialValues: Record<string, number> = {}
    const activeTemplate = initialTemplate || DEFAULT_PHYSICAL_TEST_TEMPLATE
    const resolvedTemplate = typeof activeTemplate === "string" ? JSON.parse(activeTemplate) : activeTemplate
    resolvedTemplate.forEach((q: any) => {
      initialValues[q.key] = q.defaultValue
    })
    return initialValues
  })

  // Dynamic customization form states
  const [newQualityLabel, setNewQualityLabel] = useState("")
  const [newQualityIcon, setNewQualityIcon] = useState("💪")
  const [newQualityUnit, setNewQualityUnit] = useState("")
  const [newQualityMin, setNewQualityMin] = useState(0)
  const [newQualityMax, setNewQualityMax] = useState(100)
  const [newQualityDefault, setNewQualityDefault] = useState(50)

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
        Number(formValues["vma"] || 0),
        Number(formValues["vo2Max"] || 0),
        Number(formValues["sprint10m"] || 0),
        Number(formValues["sprint30m"] || 0),
        Number(formValues["cmj"] || 0),
        Number(formValues["sj"] || 0),
        Number(formValues["illinois"] || 0),
        Number(formValues["fat"] || 0),
        formValues
      )

      if (res.success) {
        const playerObj = players.find((p) => p.id === selectedPlayerId)
        setSuccessMsg(`Test physique enregistré avec succès pour ${playerObj?.name || "le joueur"} !`)
        setSelectedPlayerId("")
        
        // Reset form to template default values
        const resetValues: Record<string, number> = {}
        template.forEach(q => {
          resetValues[q.key] = q.defaultValue
        })
        setFormValues(resetValues)
        
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

  // --- Template Customization Handlers ---
  const handleRemoveQuality = (key: string) => {
    setTemplate((prev) => prev.filter((q) => q.key !== key))
  }

  const handleAddQuality = () => {
    if (!newQualityLabel) return
    const key = `custom_${newQualityLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "_")}`
    if (template.some((q) => q.key === key)) {
      alert("Une qualité avec ce nom existe déjà.")
      return
    }
    const newQ: PhysicalQuality = {
      key,
      label: newQualityLabel,
      icon: newQualityIcon,
      unit: newQualityUnit || "unit",
      min: Number(newQualityMin),
      max: Number(newQualityMax),
      defaultValue: Number(newQualityDefault),
      isDefault: false
    }
    setTemplate((prev) => [...prev, newQ])
    setNewQualityLabel("")
    setNewQualityUnit("")
    setNewQualityMin(0)
    setNewQualityMax(100)
    setNewQualityDefault(50)
  }

  const handleSaveTemplate = async () => {
    setErrorMsg("")
    setSuccessMsg("")
    startTransition(async () => {
      const res = await savePhysicalTestTemplateAction(template)
      if (res.success) {
        setSuccessMsg("Modèle de test physique enregistré avec succès !")
        setIsCustomizingTemplate(false)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Erreur lors de l'enregistrement du modèle.")
      }
    })
  }

  // --- Export to CSV ---
  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Joueur",
      "Equipe",
      ...template.map(q => `${q.label} (${q.unit})`),
      "Note Globale (/100)"
    ]

    const rows = filteredTests.map((t) => {
      const values = {
        vma: t.vma,
        vo2Max: t.vo2Max,
        sprint10m: t.sprint10m,
        sprint30m: t.sprint30m,
        cmj: t.cmj,
        sj: t.sj,
        illinois: t.illinois,
        fat: t.fat,
        ...(t.customValues || {})
      } as Record<string, any>

      return [
        formatDate(t.createdAt),
        t.playerName,
        t.playerCategoryName,
        ...template.map(q => (values[q.key] !== undefined ? values[q.key].toString() : "")),
        calculatePhysicalScore(t, template).toString()
      ]
    })

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
    return calculatePhysicalScore(latestTest, template)
  }, [latestTest, template])

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
                Saisie et suivi des tests athlétiques personnalisables avec calcul de note globale.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCustomizingTemplate(true)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5"
              >
                ⚙️ Personnaliser
              </button>
              <button
                onClick={handleExportCSV}
                disabled={filteredTests.length === 0}
                className="rounded-xl bg-zinc-200 hover:bg-zinc-300 disabled:opacity-50 text-emerald-600 border border-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-emerald-400 dark:border-zinc-700 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all cursor-pointer"
              >
                Exporter vers Excel
              </button>
            </div>
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
                    const score = calculatePhysicalScore(t, template)
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
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-[10px] font-bold text-zinc-400 pt-1">
                            {template.map((q) => {
                              const valuesObj = {
                                vma: t.vma,
                                vo2Max: t.vo2Max,
                                sprint10m: t.sprint10m,
                                sprint30m: t.sprint30m,
                                cmj: t.cmj,
                                sj: t.sj,
                                illinois: t.illinois,
                                fat: t.fat,
                                ...(t.customValues || {})
                              } as Record<string, any>
                              const val = valuesObj[q.key]
                              return (
                                <div key={q.key}>
                                  <p className="text-[8px] text-zinc-450 uppercase flex items-center gap-0.5">
                                    <span>{q.icon}</span> {q.label}
                                  </p>
                                  <p className="text-zinc-850 dark:text-zinc-200 font-extrabold">
                                    {val !== undefined && val !== null ? `${val} ${q.unit}` : "-"}
                                  </p>
                                </div>
                              )
                            })}
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
                  Saisie des tests physiques pour les aptitudes configurées.
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
                  {template.map((q) => (
                    <div
                      key={q.key}
                      className="p-3 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl space-y-2 border border-zinc-100 dark:border-zinc-850 animate-in fade-in duration-200"
                    >
                      <p className="text-[9px] font-black text-blue-500 dark:text-blue-450 uppercase tracking-widest flex items-center gap-1.5">
                        <span>{q.icon}</span> {q.label}
                      </p>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase">
                          Valeur ({q.unit}) :
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          min={q.min}
                          max={q.max}
                          value={formValues[q.key] !== undefined ? formValues[q.key] : q.defaultValue}
                          onChange={(e) =>
                            setFormValues((prev) => ({
                              ...prev,
                              [q.key]: Number(e.target.value)
                            }))
                          }
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white font-bold"
                        />
                      </div>
                    </div>
                  ))}
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

          {/* Detailed parameter breakdown cards */}
          {latestTest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {template.map((q) => {
                const valuesObj = {
                  vma: latestTest.vma,
                  vo2Max: latestTest.vo2Max,
                  sprint10m: latestTest.sprint10m,
                  sprint30m: latestTest.sprint30m,
                  cmj: latestTest.cmj,
                  sj: latestTest.sj,
                  illinois: latestTest.illinois,
                  fat: latestTest.fat,
                  ...(latestTest.customValues || {})
                } as Record<string, any>
                const val = valuesObj[q.key]
                return (
                  <div
                    key={q.key}
                    className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-2">
                      <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span>{q.icon}</span> {q.label}
                      </h4>
                      <span className="text-xs">{q.icon}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] text-zinc-450 font-bold uppercase">Valeur</span>
                        <span className="text-sm font-black text-zinc-850 dark:text-zinc-200">
                          {val !== undefined && val !== null ? `${val} ${q.unit}` : "-"}
                        </span>
                      </div>
                      <p className="text-[8px] text-zinc-450 font-medium">
                        Cible min: {q.min} | max: {q.max}
                      </p>
                    </div>
                  </div>
                )
              })}
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
                      {template.map((q) => (
                        <th key={q.key} className="py-3 px-4 text-center">
                          {q.icon} {q.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300 font-medium">
                    {tests.map((t) => {
                      const score = calculatePhysicalScore(t, template)
                      const def = getScoreDefinition(score)
                      const valuesObj = {
                        vma: t.vma,
                        vo2Max: t.vo2Max,
                        sprint10m: t.sprint10m,
                        sprint30m: t.sprint30m,
                        cmj: t.cmj,
                        sj: t.sj,
                        illinois: t.illinois,
                        fat: t.fat,
                        ...(t.customValues || {})
                      } as Record<string, any>
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
                          {template.map((q) => {
                            const val = valuesObj[q.key]
                            return (
                              <td key={q.key} className="py-3 px-4 text-center">
                                {val !== undefined && val !== null ? `${val} ${q.unit}` : "-"}
                              </td>
                            )
                          })}
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

      {/* Modal: Customize Physical Test Form */}
      {isCustomizingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
              <div>
                <h2 className="text-sm font-black uppercase text-zinc-900 dark:text-white flex items-center gap-2">
                  ⚙️ Personnaliser le Test Physique
                </h2>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Configurez le formulaire et l&apos;historique de votre club en gérant les qualités évaluées.
                </p>
              </div>
              <button
                onClick={() => setIsCustomizingTemplate(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Content - List of current qualities */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Qualités Actuelles ({template.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {template.map((q) => (
                    <div
                      key={q.key}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-150 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{q.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-white">{q.label}</p>
                          <p className="text-[9px] text-zinc-400">
                            Unité: {q.unit} | Cible: {q.min} - {q.max} | Def: {q.defaultValue}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuality(q.key)}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-500/10 dark:hover:bg-red-500/5 rounded transition-colors text-xs font-bold"
                        title="Supprimer cette qualité"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form to add a new custom quality */}
              <div className="border-t border-zinc-100 dark:border-zinc-850 pt-4 space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  ➕ Ajouter une nouvelle qualité
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Nom de la qualité :</label>
                    <input
                      type="text"
                      placeholder="ex: Souplesse"
                      value={newQualityLabel}
                      onChange={(e) => setNewQualityLabel(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Icone / Emoji :</label>
                    <select
                      value={newQualityIcon}
                      onChange={(e) => setNewQualityIcon(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    >
                      <option value="💪">💪 Force</option>
                      <option value="⚡">⚡ Vitesse</option>
                      <option value="🫁">🫁 Endurance</option>
                      <option value="🏃">🏃 Course</option>
                      <option value="🦘">🦘 Saut/CMJ</option>
                      <option value="🚀">🚀 Explosivité</option>
                      <option value="🔄">🔄 Agilité</option>
                      <option value="⚖️">⚖️ Poids</option>
                      <option value="🎯">🎯 Précision</option>
                      <option value="⏱️">⏱️ Chrono</option>
                      <option value="📐">📐 Souplesse</option>
                      <option value="🩹">🩹 Récupération</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Unité (ex: s, cm, %) :</label>
                    <input
                      type="text"
                      placeholder="ex: cm"
                      value={newQualityUnit}
                      onChange={(e) => setNewQualityUnit(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Valeur Min :</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newQualityMin}
                      onChange={(e) => setNewQualityMin(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Valeur Max :</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newQualityMax}
                      onChange={(e) => setNewQualityMax(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">Valeur par défaut :</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newQualityDefault}
                      onChange={(e) => setNewQualityDefault(Number(e.target.value))}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuality}
                  className="w-full rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-bold uppercase text-[9px] tracking-wider py-2 transition-colors cursor-pointer"
                >
                  + Ajouter à la liste
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-4">
              <button
                type="button"
                onClick={() => setIsCustomizingTemplate(false)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Enregistrer le Modèle
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
