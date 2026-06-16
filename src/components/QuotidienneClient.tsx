"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createQuestionnaire, submitDailyWellness, applyQuestionnaireIndices, deleteQuestionnaire, saveQuestionnaireTemplate } from "@/app/dashboard/quotidienne/actions"
import ExcelJS from "exceljs"

interface PlayerResponse {
  id: string
  playerId: string
  playerName: string
  sleepQuality: number
  fatigue: number
  stress: number
  soreness: number
  heartRate: number
  answers?: Record<string, any> | null
  createdAt: string
}

interface Questionnaire {
  id: string
  teamCategoryId: string | null
  teamCategoryName: string
  timeLimit: number
  createdAt: string
  scheduledFor: string
  expiresAt: string
  active: boolean
  isApplied: boolean
  questions?: any[] | null
  responses: PlayerResponse[]
}

interface ClientPlayer {
  id: string
  name: string
  email: string
  teamCategoryId: string | null
  teamCategoryName: string
}

interface QuotidienneClientProps {
  isStaff: boolean
  categories: Array<{ id: string; name: string }>
  players: ClientPlayer[]
  history: Questionnaire[]
  activeQuestionnaire: {
    id: string
    teamCategoryId: string | null
    timeLimit: number
    createdAt: string
    scheduledFor: string
    expiresAt: string
    active: boolean
    questions?: any[] | null
  } | null
  hasResponded: boolean
  draftResponse: {
    sleepQuality: number
    fatigue: number
    stress: number
    soreness: number
    heartRate: number
    answers?: Record<string, any> | null
  } | null
  currentPlayerId: string | null
  currentPlayerName: string
  clubTemplate: any[] | null
}

export default function QuotidienneClient({
  isStaff,
  categories,
  players,
  history,
  activeQuestionnaire,
  hasResponded,
  draftResponse,
  currentPlayerId,
  currentPlayerName,
  clubTemplate
}: QuotidienneClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // --- Staff States ---
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous")
  const [timeLimit, setTimeLimit] = useState<number>(15)
  const [scheduledDateInput, setScheduledDateInput] = useState<string>("")
  const [staffStatusFilter, setStaffStatusFilter] = useState<"all" | "active" | "expired" | "scheduled">("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // --- Player States ---
  const [sleepScore, setSleepScore] = useState<number>(4)
  const [fatigueScore, setFatigueScore] = useState<number>(4)
  const [stressScore, setStressScore] = useState<number>(4)
  const [sorenessScore, setSorenessScore] = useState<number>(4)
  const [heartRateInput, setHeartRateInput] = useState<string>("")

  // --- Dynamic Player Answers ---
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, any>>({})

  // Initialize dynamic answers when questionnaire changes
  useEffect(() => {
    if (!isStaff && activeQuestionnaire && activeQuestionnaire.questions) {
      const initialAnswers: Record<string, any> = {}
      activeQuestionnaire.questions.forEach((q: any) => {
        if (q.type === "SCALE" || q.type === "SCALE_10") {
          initialAnswers[q.key] = q.type === "SCALE_10" ? 5 : 4
        } else if (q.type === "NUMBER") {
          initialAnswers[q.key] = ""
        }
      })
      setDynamicAnswers(initialAnswers)
    }
  }, [activeQuestionnaire, isStaff])

  // --- Staff Template Management States ---
  const [templateQuestions, setTemplateQuestions] = useState<any[]>(() => {
    return clubTemplate || [
      { id: "sleep", text: "Qualité du sommeil (cette nuit)", type: "SCALE", key: "sleepQuality", active: true },
      { id: "fatigue", text: "Niveau de Fatigue Générale", type: "SCALE", key: "fatigue", active: true },
      { id: "stress", text: "Niveau de Stress / Anxiété", type: "SCALE", key: "stress", active: true },
      { id: "soreness", text: "Douleurs Musculaires / Courbatures", type: "SCALE", key: "soreness", active: true },
      { id: "heartRate", text: "Fréquence cardiaque au repos", type: "NUMBER", key: "heartRate", active: true }
    ]
  })

  const [newQuestionText, setNewQuestionText] = useState("")
  const [newQuestionType, setNewQuestionType] = useState<"SCALE" | "SCALE_10" | "NUMBER">("SCALE")

  // Countdown timer for active questionnaire
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false)

  // Heart rate stopwatch (1 minute)
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(60)
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate remaining time for the questionnaire
  useEffect(() => {
    if (!isStaff && activeQuestionnaire && !hasResponded) {
      const checkTime = () => {
        const expiresAtTime = new Date(activeQuestionnaire.expiresAt).getTime()
        const now = Date.now()
        const diff = Math.max(0, Math.floor((expiresAtTime - now) / 1000))
        setRemainingSeconds(diff)
        if (diff <= 0) {
          setIsTimeExpired(true)
        }
      }

      checkTime()
      const interval = setInterval(checkTime, 1000)
      return () => clearInterval(interval)
    }
  }, [isStaff, activeQuestionnaire, hasResponded])

  // Stopwatch Logic
  const startStopwatch = () => {
    if (stopwatchRunning) return
    setStopwatchRunning(true)
    timerRef.current = setInterval(() => {
      setStopwatchSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setStopwatchRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseStopwatch = () => {
    if (!stopwatchRunning) return
    clearInterval(timerRef.current!)
    setStopwatchRunning(false)
  }

  const resetStopwatch = () => {
    clearInterval(timerRef.current!)
    setStopwatchRunning(false)
    setStopwatchSeconds(60)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const handleHeartRateChange = (val: string) => {
    // Only allow numbers and max length 3
    const cleanVal = val.replace(/[^0-9]/g, "")
    if (cleanVal.length <= 3) {
      setHeartRateInput(cleanVal)
    }
  }

  // --- Actions handlers ---
  const handleCreateQuestionnaire = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    const targetCategoryId = selectedCategory === "Tous" ? null : selectedCategory

    startTransition(async () => {
      const res = await createQuestionnaire(targetCategoryId, timeLimit, scheduledDateInput || undefined)
      if (res.success) {
        setSuccessMsg(scheduledDateInput ? "Questionnaire planifié avec succès !" : "Questionnaire lancé avec succès !")
        setScheduledDateInput("")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Erreur de création")
      }
    })
  }

  const handleSubmitTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeQuestionnaire) return
    setErrorMsg("")
    setSuccessMsg("")

    let finalAnswers: Record<string, any> = {}

    if (activeQuestionnaire.questions) {
      // Dynamic questions validation
      for (const q of activeQuestionnaire.questions) {
        const val = dynamicAnswers[q.key]
        if (q.type === "NUMBER") {
          const numVal = parseInt(val)
          if (isNaN(numVal)) {
            setErrorMsg(`Veuillez répondre à la question : ${q.text}`)
            return
          }
          if (q.key === "heartRate" && (numVal < 30 || numVal > 220)) {
            setErrorMsg("Veuillez entrer une fréquence cardiaque cohérente (30 - 220 BPM).")
            return
          }
          finalAnswers[q.key] = numVal
        } else {
          // SCALE or SCALE_10 type
          const maxVal = q.type === "SCALE_10" ? 10 : 7
          const scaleVal = parseInt(val)
          if (isNaN(scaleVal) || scaleVal < 1 || scaleVal > maxVal) {
            setErrorMsg(`Veuillez répondre à la question : ${q.text}`)
            return
          }
          finalAnswers[q.key] = scaleVal
        }
      }
    } else {
      // Fallback/Legacy validation
      if (!heartRateInput) {
        setErrorMsg("Veuillez saisir votre fréquence cardiaque après l'arrêt du chrono.")
        return
      }
      const bpm = parseInt(heartRateInput)
      if (isNaN(bpm) || bpm < 30 || bpm > 220) {
        setErrorMsg("Veuillez entrer une fréquence cardiaque cohérente (30 - 220 BPM).")
        return
      }
      finalAnswers = {
        sleepQuality: sleepScore,
        fatigue: fatigueScore,
        stress: stressScore,
        soreness: sorenessScore,
        heartRate: bpm
      }
    }

    startTransition(async () => {
      const res = await submitDailyWellness(activeQuestionnaire.id, finalAnswers)
      if (res.success) {
        setSuccessMsg("Fiche clinique soumise avec succès !")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Erreur de soumission")
      }
    })
  }

  const handleApplyIndices = async (questionnaireId: string) => {
    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await applyQuestionnaireIndices(questionnaireId)
      if (res.success) {
        setSuccessMsg("Indices des joueurs mis à jour avec succès dans leur profil !")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Erreur lors de la mise à jour des indices")
      }
    })
  }

  const handleDeleteQuestionnaire = async (questionnaireId: string, isScheduled: boolean) => {
    if (!confirm(isScheduled ? "Voulez-vous vraiment annuler ce questionnaire planifié ?" : "Voulez-vous vraiment supprimer ce questionnaire ? Les indices correspondants des joueurs seront également supprimés.")) {
      return
    }
    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await deleteQuestionnaire(questionnaireId)
      if (res.success) {
        setSuccessMsg(isScheduled ? "Questionnaire planifié annulé avec succès !" : "Questionnaire supprimé avec succès !")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Erreur lors de la suppression du questionnaire")
      }
    })
  }

  const handleUpdateQuestionText = (id: string, newText: string) => {
    setTemplateQuestions(prev => prev.map(q => q.id === id ? { ...q, text: newText } : q))
  }

  const handleToggleQuestionActive = (id: string) => {
    setTemplateQuestions(prev => prev.map(q => q.id === id ? { ...q, active: !q.active } : q))
  }

  const handleDeleteQuestionFromTemplate = (id: string) => {
    setTemplateQuestions(prev => prev.filter(q => q.id !== id))
  }

  const handleAddQuestionToTemplate = () => {
    if (!newQuestionText.trim()) return
    const newId = `custom_${Date.now()}`
    const newKey = `custom_${Date.now()}`
    setTemplateQuestions(prev => [
      ...prev,
      {
        id: newId,
        text: newQuestionText.trim(),
        type: newQuestionType,
        key: newKey,
        active: true
      }
    ])
    setNewQuestionText("")
  }

  const handleSaveTemplate = async () => {
    setErrorMsg("")
    setSuccessMsg("")
    startTransition(async () => {
      const res = await saveQuestionnaireTemplate(templateQuestions)
      if (res.success) {
        setSuccessMsg("Configuration du questionnaire enregistrée avec succès !")
        router.refresh()
      } else {
        setErrorMsg(res.error || "Erreur de sauvegarde")
      }
    })
  }

  // Export responses to Excel (French formatting with semicolons)
  const handleExportCSV = async (q: Questionnaire) => {
    // Determine targeted players
    const targetedPlayers = q.teamCategoryId
      ? players.filter((p) => p.teamCategoryId === q.teamCategoryId)
      : players

    const headers = ["Joueur"]
    if (q.questions) {
      q.questions.forEach((quest) => {
        headers.push(quest.text)
      })
    } else {
      headers.push("Sommeil", "Fatigue", "Stress", "Courbatures", "Pouls (BPM)")
    }
    headers.push("Forme")

    const rows = targetedPlayers.map((p) => {
      const r = q.responses.find((resp) => resp.playerId === p.id)
      const row = [p.name]
      if (q.questions) {
        q.questions.forEach((quest) => {
          if (r) {
            const val = r.answers ? r.answers[quest.key] : (r as any)[quest.key]
            if (val !== undefined && val !== null) {
              if (quest.type === "SCALE" || quest.type === "SCALE_10") {
                const maxVal = quest.type === "SCALE_10" ? 10 : 7
                row.push(`${val}/${maxVal}`)
              } else {
                row.push(quest.key === "heartRate" ? `❤️ ${val}` : val.toString())
              }
            } else {
              row.push("N/A")
            }
          } else {
            row.push("N/A")
          }
        })
      } else {
        row.push(
          r ? `${r.sleepQuality}/7` : "N/A",
          r ? `${r.fatigue}/7` : "N/A",
          r ? `${r.stress}/7` : "N/A",
          r ? `${r.soreness}/7` : "N/A",
          r ? `❤️ ${r.heartRate}` : "N/A"
        )
      }

      // Add Readiness Score (Forme)
      if (r) {
        const score = q.questions
          ? getDynamicReadinessScore(q.questions, r.answers)
          : getReadinessScore(r.sleepQuality, r.fatigue, r.stress, r.soreness)
        row.push(`${score}%`)
      } else {
        row.push("N/A")
      }

      return row
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Rapport Forme")

    // Ensure grid lines are visible
    worksheet.views = [{ showGridLines: true }]

    // Add header row
    const headerRow = worksheet.addRow(headers)
    headerRow.height = 28

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF059669" } // Emerald 600
      }
      cell.font = {
        name: "Segoe UI",
        color: { argb: "FFFFFFFF" },
        bold: true,
        size: 11
      }
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true }
      cell.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "medium", color: { argb: "FF047857" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      }
    })

    // Add data rows
    rows.forEach((rowData) => {
      const dataRow = worksheet.addRow(rowData)
      dataRow.height = 22

      dataRow.eachCell((cell, colNumber) => {
        const valStr = cell.value ? String(cell.value) : ""

        // Default cell style
        cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF1F2937" } }
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        }

        if (colNumber === 1) {
          cell.alignment = { vertical: "middle", horizontal: "left" }
          cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF0F172A" } }
        } else {
          cell.alignment = { vertical: "middle", horizontal: "center" }
        }

        // Conditional styling based on value (Green = good, Yellow = moderate, Red = bad)
        if (valStr.includes("/")) {
          const parts = valStr.split("/")
          const score = parseInt(parts[0])
          const max = parseInt(parts[1])
          if (!isNaN(score) && !isNaN(max)) {
            const half = max / 2
            if (score <= Math.floor(half - 0.5)) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2F8F0" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF065F46" }, bold: true }
            } else if (score <= Math.floor(half + 1.5)) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF92400E" }, bold: true }
            } else {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF991B1B" }, bold: true }
            }
          }
        } else if (valStr.includes("%")) {
          const scoreNum = parseInt(valStr.replace("%", ""))
          if (!isNaN(scoreNum)) {
            if (scoreNum >= 70) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2F8F0" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF065F46" }, bold: true }
            } else if (scoreNum >= 50) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF92400E" }, bold: true }
            } else {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } }
              cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF991B1B" }, bold: true }
            }
          }
        } else if (valStr === "N/A") {
          cell.font = { name: "Segoe UI", size: 10, color: { argb: "FF94A3B8" } }
        }
      })
    })

    // Auto fit column widths with padding
    worksheet.columns.forEach((column) => {
      let maxLen = 0
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: true }, (cell) => {
          const val = cell.value ? String(cell.value) : ""
          if (val.length > maxLen) {
            maxLen = val.length
          }
        })
      }
      column.width = Math.max(14, maxLen + 4)
    })

    // Write file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `rapport_daily_${q.teamCategoryName.replace(/\s+/g, "_")}_${new Date(q.createdAt).toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- Filtering History ---
  const filteredHistory = history.filter((q) => {
    const now = new Date()
    const isScheduled = new Date(q.scheduledFor) > now
    const isExpired = new Date(q.expiresAt) <= now || !q.active
    const isActive = !isScheduled && !isExpired

    if (staffStatusFilter === "active") return isActive
    if (staffStatusFilter === "expired") return isExpired
    if (staffStatusFilter === "scheduled") return isScheduled
    return true
  })

  // Formatting helpers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getButtonBg = (value: number, selected: number) => {
    if (value !== selected) {
      return "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 font-bold"
    }
    if (value <= 2) {
      return "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md font-black scale-105"
    }
    if (value <= 5) {
      return "bg-amber-500 text-white shadow-amber-500/20 shadow-md font-black scale-105"
    }
    return "bg-red-500 text-white shadow-red-500/20 shadow-md font-black scale-105"
  }

  const getReadinessScore = (sleep: number, fatigue: number, stress: number, soreness: number) => {
    // 1 is best, 7 is worst. Convert to wellness positive values (8 - rating)
    const posSleep = 8 - sleep
    const posFatigue = 8 - fatigue
    const posStress = 8 - stress
    const posSoreness = 8 - soreness
    return Math.round(((posSleep + posFatigue + posStress + posSoreness) / 28) * 100)
  }

  const getDynamicReadinessScore = (questions: any[] | null | undefined, answersObj: Record<string, any> | null | undefined) => {
    if (!questions || questions.length === 0) return 100
    const scaleQuestions = questions.filter(q => q.type === "SCALE" || q.type === "SCALE_10")
    if (scaleQuestions.length === 0) return 100
    let sum = 0
    let count = 0
    let maxPossiblePoints = 0
    scaleQuestions.forEach(q => {
      const val = answersObj ? answersObj[q.key] : undefined
      if (val !== undefined && val !== null) {
        const numVal = Number(val)
        if (!isNaN(numVal)) {
          if (q.type === "SCALE_10") {
            sum += (11 - numVal)
            maxPossiblePoints += 10
          } else {
            sum += (8 - numVal)
            maxPossiblePoints += 7
          }
          count++
        }
      }
    })
    if (count === 0 || maxPossiblePoints === 0) return 100
    return Math.round((sum / maxPossiblePoints) * 100)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Messages */}
      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-xs font-bold text-red-500 animate-in fade-in">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs font-bold text-emerald-500 animate-in fade-in">
          🎉 {successMsg}
        </div>
      )}

      {isStaff ? (
        /* ==================== STAFF DASHBOARD ==================== */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Plan & Config daily questionnaire (Right Panel - Col 1) */}
          <div className="xl:col-span-1 space-y-6 h-fit">
            
            {/* Configuration card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>⚙️</span> Configuration du questionnaire
                </h2>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Modifiez le texte des questions, activez/désactivez ou ajoutez/supprimez des questions du test.
                </p>
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {templateQuestions.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-950/20 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        q.type === "SCALE" ? "bg-emerald-500/10 text-emerald-500" :
                        q.type === "SCALE_10" ? "bg-teal-500/10 text-teal-500" :
                        "bg-purple-500/10 text-purple-500"
                      }`}>
                        {q.type === "SCALE" ? "Échelle 1-7" : q.type === "SCALE_10" ? "Échelle 1-10" : "Nombre"}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Toggle active status */}
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.active}
                            onChange={() => handleToggleQuestionActive(q.id)}
                            className="rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 w-3 h-3 cursor-pointer"
                          />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">Actif</span>
                        </label>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestionFromTemplate(q.id)}
                          className="text-red-500 hover:text-red-600 text-[9px] font-bold uppercase transition-all cursor-pointer"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => handleUpdateQuestionText(q.id, e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                      placeholder="Texte de la question"
                    />
                  </div>
                ))}
              </div>

              {/* Add New Question Section */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-[10px] font-black text-zinc-500 uppercase">➕ Ajouter une question :</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="ex: Niveau d'énergie"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewQuestionType("SCALE")}
                      className={`py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer text-center border ${
                        newQuestionType === "SCALE"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      Échelle (1-7)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionType("SCALE_10")}
                      className={`py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer text-center border ${
                        newQuestionType === "SCALE_10"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      Échelle (1-10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewQuestionType("NUMBER")}
                      className={`py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer text-center border ${
                        newQuestionType === "NUMBER"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      Nombre
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestionToTemplate}
                    disabled={!newQuestionText.trim()}
                    className="w-full py-2 rounded-xl bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 text-zinc-850 dark:text-zinc-205 font-black text-[9px] uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Ajouter au questionnaire
                  </button>
                </div>
              </div>

              {/* Save template */}
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isPending}
                className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider py-3 shadow-md shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-center"
              >
                {isPending ? "Enregistrement..." : "Enregistrer les questions 💾"}
              </button>
            </div>

            {/* Plan daily questionnaire card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>📢</span> Planifier Fiche Quotidienne
                </h2>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Lancer un nouveau questionnaire à remplir immédiatement avec une limite de temps.
                </p>
              </div>

              <form onSubmit={handleCreateQuestionnaire} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase">Équipe cible :</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  >
                    <option value="Tous">Tout le club</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase">Limite de temps :</label>
                  <select
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 heure</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase">Programmer l&apos;envoi (optionnel) :</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateInput}
                    onChange={(e) => setScheduledDateInput(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                  />
                  <p className="text-[8px] text-zinc-400">
                    Laissez vide pour envoyer immédiatement.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-emerald-600 dark:text-emerald-400 border border-zinc-300 dark:border-zinc-700 font-black uppercase text-[10px] tracking-wider py-3 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-center"
                >
                  {isPending ? "Création..." : scheduledDateInput ? "Planifier le questionnaire" : "Lancer le questionnaire"}
                </button>
              </form>
            </div>
          </div>

          {/* List and results of questionnaires (Left Panel - Col 2) */}
          <div className="xl:col-span-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 gap-3">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>📊</span> Questionnaires Envoyés ({filteredHistory.length})
                </h2>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Sélectionnez un questionnaire pour afficher les réponses et exporter les résultats.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Statut :</span>
                <select
                  value={staffStatusFilter}
                  onChange={(e) => setStaffStatusFilter(e.target.value as any)}
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                >
                  <option value="all">Tous les questionnaires</option>
                  <option value="active">En cours</option>
                  <option value="scheduled">Planifiés</option>
                  <option value="expired">Terminés</option>
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500 font-bold">
                Aucun questionnaire n&apos;a été trouvé pour ce filtre.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHistory.map((q) => {
                  const now = new Date()
                  const isScheduled = new Date(q.scheduledFor) > now
                  const isCurrentExpired = new Date(q.expiresAt) <= now || !q.active
                  const isExpanded = expandedId === q.id
                  const targetedPlayers = q.teamCategoryId
                    ? players.filter((p) => p.teamCategoryId === q.teamCategoryId)
                    : players

                  const respondCount = q.responses.length
                  const targetCount = targetedPlayers.length
                  const rate = targetCount > 0 ? Math.round((respondCount / targetCount) * 100) : 0

                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border transition-all ${
                        isExpanded
                          ? "border-emerald-500 bg-emerald-500/[0.01]"
                          : "border-zinc-200 bg-zinc-50/20 hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/20 dark:hover:bg-zinc-950/40"
                      }`}
                    >
                      {/* Header row */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                        className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                              {q.teamCategoryName}
                            </span>
                            {isScheduled ? (
                              <span className="rounded bg-sky-500/10 text-sky-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                📅 Planifié
                              </span>
                            ) : !isCurrentExpired ? (
                              <span className="rounded bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                ⏳ En cours
                              </span>
                            ) : (
                              <span className="rounded bg-zinc-150 text-zinc-550 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                ✔️ Terminé
                              </span>
                            )}
                            {q.isApplied && (
                              <span className="rounded bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                📑 Indices reportés
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold">
                            {isScheduled ? `Planifié pour le ${formatDate(q.scheduledFor)}` : `Lancé le ${formatDate(q.scheduledFor)}`} (Limite: {q.timeLimit}m)
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-zinc-400 uppercase">Taux de réponse</p>
                            <p className="text-xs font-black text-zinc-850 dark:text-zinc-200">
                              {respondCount} / {targetCount} ({rate}%)
                            </p>
                          </div>
                          <span className="text-zinc-300 dark:text-zinc-700 text-lg">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* Detail Table Container */}
                      {isExpanded && (
                        <div className="border-t border-zinc-100 dark:border-zinc-850 p-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => handleExportCSV(q)}
                              className="rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-emerald-600 dark:text-emerald-400 border border-zinc-300 dark:border-zinc-700 font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 transition-all cursor-pointer"
                            >
                              Exporter vers Excel
                            </button>

                            <button
                              onClick={() => handleApplyIndices(q.id)}
                              disabled={isPending || q.isApplied || q.responses.length === 0}
                              className="rounded-lg bg-zinc-200 hover:bg-zinc-300 disabled:bg-zinc-150 disabled:text-zinc-400 disabled:border-zinc-250 disabled:cursor-not-allowed dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 text-emerald-600 dark:text-emerald-400 border border-zinc-300 dark:border-zinc-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 transition-all cursor-pointer"
                            >
                              {q.isApplied ? "Indices Appliqués" : "Mettre à jour les indices"}
                            </button>

                            {isScheduled && (
                              <button
                                onClick={() => handleDeleteQuestionnaire(q.id, true)}
                                disabled={isPending}
                                className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 transition-all cursor-pointer dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                              >
                                Annuler le questionnaire
                              </button>
                            )}

                            {isCurrentExpired && (
                              <button
                                onClick={() => handleDeleteQuestionnaire(q.id, false)}
                                disabled={isPending}
                                className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 transition-all cursor-pointer dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-900/50"
                              >
                                Supprimer le questionnaire
                              </button>
                            )}
                          </div>

                          {/* Responsive table */}
                          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                                  <th className="py-2.5 px-3">Joueur</th>
                                  {q.questions ? q.questions.map((quest) => (
                                    <th key={quest.id} className="py-2.5 px-3 text-center">{quest.text}</th>
                                  )) : (
                                    <>
                                      <th className="py-2.5 px-3 text-center">Sommeil</th>
                                      <th className="py-2.5 px-3 text-center">Fatigue</th>
                                      <th className="py-2.5 px-3 text-center">Stress</th>
                                      <th className="py-2.5 px-3 text-center">Courbatures</th>
                                      <th className="py-2.5 px-3 text-center">Pouls (BPM)</th>
                                    </>
                                  )}
                                  <th className="py-2.5 px-3 text-center">Forme</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                {targetedPlayers.map((p) => {
                                  const r = q.responses.find((resp) => resp.playerId === p.id)

                                  return (
                                    <tr key={p.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40">
                                      <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">
                                        {p.name}
                                      </td>
                                      
                                      {q.questions ? q.questions.map((quest) => {
                                        const val = r ? (r.answers ? r.answers[quest.key] : (r as any)[quest.key]) : null
                                        return (
                                          <td key={quest.id} className="py-2.5 px-3 text-center font-bold">
                                            {val !== null && val !== undefined ? (
                                              (quest.type === "SCALE" || quest.type === "SCALE_10") ? (
                                                (() => {
                                                  const maxVal = quest.type === "SCALE_10" ? 10 : 7
                                                  const half = maxVal / 2
                                                  let colorClass = "text-red-500 bg-red-500/10"
                                                  if (val <= Math.floor(half - 0.5)) {
                                                    colorClass = "text-emerald-500 bg-emerald-500/10"
                                                  } else if (val <= Math.floor(half + 1.5)) {
                                                    colorClass = "text-amber-500 bg-amber-500/10"
                                                  }
                                                  return (
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${colorClass}`}>
                                                      {val}/{maxVal}
                                                    </span>
                                                  )
                                                })()
                                              ) : (
                                                <span className="text-zinc-900 dark:text-zinc-100 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-black text-[10px]">
                                                  {quest.key === "heartRate" ? `❤️ ${val}` : val}
                                                </span>
                                              )
                                            ) : "N/A"}
                                          </td>
                                        )
                                      }) : (
                                        <>
                                          <td className="py-2.5 px-3 text-center font-bold">
                                            {r ? (
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                r.sleepQuality <= 2 ? "text-emerald-500 bg-emerald-500/10" : r.sleepQuality <= 5 ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10"
                                              }`}>
                                                {r.sleepQuality}/7
                                              </span>
                                            ) : "N/A"}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold">
                                            {r ? (
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                r.fatigue <= 2 ? "text-emerald-500 bg-emerald-500/10" : r.fatigue <= 5 ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10"
                                              }`}>
                                                {r.fatigue}/7
                                              </span>
                                            ) : "N/A"}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold">
                                            {r ? (
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                r.stress <= 2 ? "text-emerald-500 bg-emerald-500/10" : r.stress <= 5 ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10"
                                              }`}>
                                                {r.stress}/7
                                              </span>
                                            ) : "N/A"}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold">
                                            {r ? (
                                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                r.soreness <= 2 ? "text-emerald-500 bg-emerald-500/10" : r.soreness <= 5 ? "text-amber-500 bg-amber-500/10" : "text-red-500 bg-red-500/10"
                                              }`}>
                                                {r.soreness}/7
                                              </span>
                                            ) : "N/A"}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold">
                                            {r ? (
                                              <span className="text-zinc-900 dark:text-zinc-100 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-black text-[10px]">
                                                ❤️ {r.heartRate}
                                              </span>
                                            ) : "N/A"}
                                          </td>
                                        </>
                                      )}

                                      <td className="py-2.5 px-3 text-center">
                                        {r ? (
                                          (() => {
                                            const score = q.questions
                                              ? getDynamicReadinessScore(q.questions, r.answers)
                                              : getReadinessScore(r.sleepQuality, r.fatigue, r.stress, r.soreness)
                                            return (
                                              <span className={`text-[10px] font-black uppercase ${
                                                score >= 70 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500"
                                              }`}>
                                                {score}%
                                              </span>
                                            )
                                          })()
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
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================== PLAYER QUESTIONNAIRE ==================== */
        <div className="max-w-2xl mx-auto">
          {!activeQuestionnaire ? (
            /* Scenario 1: No active questionnaire for this player's category */
            <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center space-y-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <span className="text-4xl block">📬</span>
              <h3 className="text-base font-black text-zinc-850 dark:text-white uppercase tracking-wider">
                Aucun questionnaire en attente
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Votre préparateur physique ou staff n&apos;a pas lancé de fiche clinique pour votre équipe actuellement. Nous vous informerons dès qu&apos;un test sera planifié !
              </p>
            </div>
          ) : hasResponded && draftResponse ? (
            /* Scenario 2: Active questionnaire exists but player has already answered it */
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.02] p-8 text-center space-y-6 shadow-sm dark:border-emerald-800/40">
              <span className="text-4xl block animate-bounce">🚀</span>
              <div>
                <h3 className="text-lg font-black text-emerald-500 uppercase tracking-wide">
                  Questionnaire complété aujourd&apos;hui !
                </h3>
                <p className="text-xs text-zinc-500 mt-2">
                  Vos indicateurs de forme ont été envoyés à la base de données. Le staff mettra à jour vos indices sous peu.
                </p>
              </div>

              <div className="inline-block rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-md dark:bg-zinc-900 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-450 font-black uppercase tracking-widest">
                  Indice de Readiness Estimé
                </p>
                <p className="text-3xl font-black text-emerald-500 mt-2">
                  {activeQuestionnaire.questions
                    ? getDynamicReadinessScore(activeQuestionnaire.questions, draftResponse.answers)
                    : getReadinessScore(
                        draftResponse.sleepQuality,
                        draftResponse.fatigue,
                        draftResponse.stress,
                        draftResponse.soreness
                      )}%
                </p>
                <div className="text-[10px] text-zinc-500 mt-3 font-semibold space-y-1.5 text-left border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  {activeQuestionnaire.questions ? activeQuestionnaire.questions.map((quest) => {
                    const val = draftResponse.answers ? draftResponse.answers[quest.key] : (draftResponse as any)[quest.key]
                    return (
                      <div key={quest.id} className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">{quest.text} :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">
                          {quest.type === "SCALE" ? `${val}/7` : quest.key === "heartRate" ? `❤️ ${val} BPM` : val}
                        </span>
                      </div>
                    )
                  }) : (
                    <>
                      <div className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">Qualité du sommeil :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">{draftResponse.sleepQuality}/7</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">Niveau de Fatigue :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">{draftResponse.fatigue}/7</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">Niveau de Stress :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">{draftResponse.stress}/7</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">Douleurs Musculaires :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">{draftResponse.soreness}/7</span>
                      </div>
                      <div className="flex justify-between gap-6">
                        <span className="text-zinc-400 font-bold">Pulsations :</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-200">❤️ {draftResponse.heartRate} BPM</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : isTimeExpired ? (
            /* Scenario 3: Time expired */
            <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.02] p-12 text-center space-y-4 shadow-sm dark:border-red-800/40">
              <span className="text-4xl block">⏳</span>
              <h3 className="text-base font-black text-red-500 uppercase tracking-wider">
                Le temps est écoulé !
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                La limite de temps fixée par le staff pour répondre à ce questionnaire de forme quotidienne a expiré. Vous ne pouvez plus soumettre de réponses.
              </p>
            </div>
          ) : (
            /* Scenario 4: Questionnaire active & player needs to answer */
            <form onSubmit={handleSubmitTest} className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">
              
              {/* Header with Countdown timer */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-100 dark:border-zinc-850 gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    Fiche Clinique Journalière ({currentPlayerName})
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold">
                    Répondez sincèrement sur chaque échelle pour adapter les charges de travail.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl text-red-500 animate-pulse self-start sm:self-auto">
                  <span className="text-[10px] font-black uppercase">Temps Restant :</span>
                  <span className="text-xs font-black font-mono">{formatTime(remainingSeconds)}</span>
                </div>
              </div>

              {/* Part 1: Wellness Scales & Questions */}
              <div className="space-y-6">
                {activeQuestionnaire.questions ? (
                  activeQuestionnaire.questions.filter((q: any) => q.active).map((q: any, idx: number) => {
                    if (q.type === "SCALE" || q.type === "SCALE_10") {
                      const maxVal = q.type === "SCALE_10" ? 10 : 7
                      const score = dynamicAnswers[q.key] !== undefined ? dynamicAnswers[q.key] : (q.type === "SCALE_10" ? 5 : 4)
                      const nums = Array.from({ length: maxVal }, (_, i) => i + 1)
                      
                      const getScaleButtonBg = (value: number, selected: number, max: number) => {
                        if (value !== selected) {
                          return "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 font-bold"
                        }
                        const half = max / 2
                        if (value <= Math.floor(half - 0.5)) {
                          return "bg-emerald-500 text-white shadow-emerald-500/20 shadow-md font-black scale-105"
                        }
                        if (value <= Math.floor(half + 1.5)) {
                          return "bg-amber-500 text-white shadow-amber-500/20 shadow-md font-black scale-105"
                        }
                        return "bg-red-500 text-white shadow-red-500/20 shadow-md font-black scale-105"
                      }

                      return (
                        <div key={q.id} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            <span>{idx + 1}. {q.text}</span>
                            <span className="text-zinc-500">Sélectionné : <strong className="text-emerald-500">{score}</strong></span>
                          </div>
                          <div className={`grid ${maxVal === 10 ? 'grid-cols-10' : 'grid-cols-7'} gap-1`}>
                            {nums.map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setDynamicAnswers(prev => ({ ...prev, [q.key]: num }))}
                                className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${getScaleButtonBg(num, score, maxVal)}`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] text-zinc-400 font-black uppercase tracking-wider">
                            <span>1 - Excellent / Optimal</span>
                            <span>{maxVal} - Très mauvais / Difficile</span>
                          </div>
                        </div>
                      )
                    } else {
                      // NUMBER type
                      const val = dynamicAnswers[q.key] !== undefined ? dynamicAnswers[q.key] : ""
                      const isHeartRate = q.key === "heartRate"
                      return (
                        <div key={q.id} className="space-y-4 pt-4 border-t border-zinc-150 dark:border-zinc-850">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-450">
                            {idx + 1}. {q.text}
                          </h5>

                          <div className="rounded-2xl border border-zinc-150 dark:border-zinc-800 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            {/* If heartRate, show stopwatch */}
                            {isHeartRate && (
                              <div className="space-y-2">
                                <p className="text-[10px] text-zinc-400 font-black uppercase">Mesure cardiaque (Chrono 1 minute) :</p>
                                <div className="flex items-center gap-4">
                                  <span className="text-3xl font-black font-mono text-zinc-800 dark:text-white tracking-widest">
                                    {formatTime(stopwatchSeconds)}
                                  </span>
                                  
                                  <div className="flex items-center gap-1.5">
                                    {!stopwatchRunning ? (
                                      <button
                                        type="button"
                                        onClick={startStopwatch}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Démarrer ▶️
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={pauseStopwatch}
                                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Pause ⏸️
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={resetStopwatch}
                                      className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      Reset 🔄
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Input box */}
                            <div className="space-y-2 w-full md:w-fit min-w-[200px]">
                              <label className="text-[10px] font-black text-zinc-500 uppercase block">
                                Valeur numérique :
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  maxLength={5}
                                  value={val}
                                  onChange={(e) => {
                                    const cleanVal = e.target.value.replace(/[^0-9]/g, "")
                                    setDynamicAnswers(prev => ({ ...prev, [q.key]: cleanVal }))
                                  }}
                                  placeholder={isHeartRate ? "ex: 65" : "ex: 10"}
                                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-black pl-8"
                                />
                                <span className="absolute left-3 top-3 text-red-500 font-bold text-xs">{isHeartRate ? "❤️" : "🔢"}</span>
                                {isHeartRate && <span className="absolute right-3 top-3 text-[10px] text-zinc-400 font-bold">BPM</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })
                ) : (
                  <>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                      Partie 1 : Indicateurs de Wellness (Échelle 1 à 7)
                    </h4>

                    {/* Sleep Scale */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>1. Qualité du sommeil (cette nuit)</span>
                        <span className="text-zinc-500">Sélectionné : <strong className="text-emerald-500">{sleepScore}</strong></span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSleepScore(num)}
                            className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${getButtonBg(num, sleepScore)}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-400 font-black uppercase tracking-wider">
                        <span>1 - Excellent / Réparateur</span>
                        <span>7 - Très mauvais / Insomnie</span>
                      </div>
                    </div>

                    {/* Fatigue Scale */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>2. Niveau de Fatigue Générale</span>
                        <span className="text-zinc-500">Sélectionné : <strong className="text-emerald-500">{fatigueScore}</strong></span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFatigueScore(num)}
                            className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${getButtonBg(num, fatigueScore)}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-400 font-black uppercase tracking-wider">
                        <span>1 - Très en forme / Frais</span>
                        <span>7 - Épuisé / Fatigué</span>
                      </div>
                    </div>

                    {/* Stress Scale */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>3. Niveau de Stress / Anxiété</span>
                        <span className="text-zinc-500">Sélectionné : <strong className="text-emerald-500">{stressScore}</strong></span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setStressScore(num)}
                            className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${getButtonBg(num, stressScore)}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-400 font-black uppercase tracking-wider">
                        <span>1 - Relaxé / Aucun stress</span>
                        <span>7 - Très anxieux / Tendu</span>
                      </div>
                    </div>

                    {/* Soreness Scale */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        <span>4. Douleurs Musculaires / Courbatures</span>
                        <span className="text-zinc-500">Sélectionné : <strong className="text-emerald-500">{sorenessScore}</strong></span>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSorenessScore(num)}
                            className={`py-2 text-xs rounded-lg transition-all cursor-pointer ${getButtonBg(num, sorenessScore)}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[8px] text-zinc-400 font-black uppercase tracking-wider">
                        <span>1 - Muscles très frais</span>
                        <span>7 - Courbatures intenses</span>
                      </div>
                    </div>

                    {/* Part 2: Heart Rate & Rest Stopwatch */}
                    <div className="space-y-4 pt-6 border-t border-zinc-150 dark:border-zinc-850">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-450">
                        Partie 2 : Pouls après le réveil (Repos)
                      </h4>

                      <div className="rounded-2xl border border-zinc-150 dark:border-zinc-800 p-5 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Stopwatch displays */}
                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-450 font-black uppercase">Mesure cardiaque (Chrono 1 minute) :</p>
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-black font-mono text-zinc-800 dark:text-white tracking-widest">
                              {formatTime(stopwatchSeconds)}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {!stopwatchRunning ? (
                                <button
                                  type="button"
                                  onClick={startStopwatch}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Démarrer ▶️
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={pauseStopwatch}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Pause ⏸️
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={resetStopwatch}
                                className="px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Reset 🔄
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* BPM input box */}
                        <div className="space-y-2 w-full md:w-fit min-w-[200px]">
                          <label className="text-[10px] font-black text-zinc-500 uppercase block">
                            Battements de coeur (3 chiffres max) :
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              pattern="[0-9]*"
                              maxLength={3}
                              value={heartRateInput}
                              onChange={(e) => handleHeartRateChange(e.target.value)}
                              placeholder="ex: 65"
                              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-black pl-8"
                            />
                            <span className="absolute left-3 top-3 text-red-500 font-bold text-xs">❤️</span>
                            <span className="absolute right-3 top-3 text-[10px] text-zinc-400 font-bold">BPM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Submit button */}
              <div className="pt-6 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
                <button
                  type="submit"
                  disabled={isPending || isTimeExpired}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider py-3 px-6 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Soumission..." : "Soumettre le test 💾"}
                </button>
              </div>

            </form>
          )}
        </div>
      )}
    </div>
  )
}
