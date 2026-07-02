"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/LanguageProvider"

interface CompletedEvent {
  id: string
  clubId: string
  title: string
  type: "MATCH" | "TRAINING"
  date: string
  time: string
  location: string
  details: string | null
  score: string | null
  status: string
  assignedTeam: string | null
}

interface TeamCategory {
  id: string
  name: string
  league: string
  coach: string
}

interface WorkloadClientProps {
  initialEvents: CompletedEvent[]
  teamCategories: TeamCategory[]
  roleName: string
}

interface ActivityItem {
  id: string
  name: string
  duration: number
  rpe: number
  ua: number
  inm: number
}

interface SessionData {
  id: string
  title: string
  type: "MATCH" | "TRAINING"
  date: string
  time: string
  duration: number
  rpe: number
  ua: number
  inm: number
  opponent?: string
  score?: string
}

interface WeeklyMetrics {
  weekLabel: string
  startDateStr: string
  endDateStr: string
  activeDaysCount: number
  sessionsCount: number
  weeklyLoad: number
  averageLoad: number
  standardDeviation: number
  monotonicity: number
  strain: number
  fitness: number
  sessions: SessionData[]
}

export default function WorkloadClient({ initialEvents, teamCategories, roleName }: WorkloadClientProps) {
  const { t, language } = useLanguage()

  // Selected team category
  const [selectedCategory, setSelectedCategory] = useState<string>("")

  // Set default category on mount
  useEffect(() => {
    if (teamCategories.length > 0) {
      setSelectedCategory(teamCategories[0].name)
    }
  }, [teamCategories])

  // Helper to format dates to French locale
  const formatDateLocale = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  }

  // Parse all events into a unified SessionData structure
  const parsedSessions: SessionData[] = initialEvents.map(event => {
    let duration = 0
    let rpe = 0
    let ua = 0
    let inm = 0
    let opponent = ""

    if (event.type === "MATCH") {
      if (event.details) {
        try {
          const report = JSON.parse(event.details)
          duration = parseFloat(report.duration) || 90
          rpe = parseFloat(report.rpe) || 0
          inm = parseFloat(report.inm) || 0
          ua = parseFloat(report.ua) || (duration * rpe)
          opponent = report.opponent || ""
        } catch {
          duration = 90
          rpe = 0
          inm = 0
          ua = 0
        }
      } else {
        duration = 90
        rpe = 0
        inm = 0
        ua = 0
      }
    } else {
      // TRAINING
      if (event.details) {
        try {
          const activities = JSON.parse(event.details)
          if (Array.isArray(activities) && activities.length > 0) {
            duration = activities.reduce((sum, act) => sum + (parseFloat(act.duration) || 0), 0)
            ua = activities.reduce((sum, act) => sum + (parseFloat(act.ua) || 0), 0)
            const totalInmSum = activities.reduce((sum, act) => sum + ((parseFloat(act.inm) || 0) * (parseFloat(act.duration) || 0)), 0)
            inm = duration > 0 ? parseFloat((totalInmSum / duration).toFixed(2)) : 0
            rpe = duration > 0 ? parseFloat((ua / duration).toFixed(2)) : 0
          }
        } catch {
          duration = 0
          rpe = 0
          ua = 0
          inm = 0
        }
      }
    }

    return {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      time: event.time,
      duration,
      rpe,
      ua,
      inm,
      opponent,
      score: event.score || undefined
    }
  })

  // Filter sessions by selected category
  const filteredSessions = parsedSessions.filter(session => {
    const event = initialEvents.find(e => e.id === session.id)
    return event?.assignedTeam === selectedCategory
  })

  // Calculate calendar weeks (Monday to Sunday) going back 4 weeks
  const getWeeklyData = (): WeeklyMetrics[] => {
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
    const currentMonday = new Date(now)
    currentMonday.setDate(now.getDate() + distanceToMonday)
    currentMonday.setHours(0, 0, 0, 0)

    const weeksData: WeeklyMetrics[] = []

    for (let i = 0; i < 4; i++) {
      const monday = new Date(currentMonday)
      monday.setDate(currentMonday.getDate() - (i * 7))

      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)

      // Filter sessions that fall in this week
      const weeklySessions = filteredSessions.filter(s => {
        const sDate = new Date(s.date + "T00:00:00")
        return sDate >= monday && sDate <= sunday
      }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())

      const sessionsCount = weeklySessions.length
      const uniqueDates = new Set(weeklySessions.map(s => s.date))
      const activeDaysCount = uniqueDates.size

      let weeklyLoad = 0
      let averageLoad = 0
      let standardDeviation = 0
      let monotonicity = 0
      let strain = 0
      let fitness = 0

      if (sessionsCount > 0) {
        weeklyLoad = weeklySessions.reduce((sum, s) => sum + s.ua, 0)
        averageLoad = weeklyLoad / sessionsCount

        // Standard Deviation
        let varianceSum = 0
        weeklySessions.forEach(s => {
          varianceSum += Math.pow(s.ua - averageLoad, 2)
        })
        const variance = varianceSum / sessionsCount
        standardDeviation = Math.sqrt(variance)

        // Monotonicity = Moyenne / Ecart-type
        monotonicity = standardDeviation > 0.01 ? (averageLoad / standardDeviation) : 0

        // Strain (Contrainte) = Moyenne / Monotonie (as literally requested by user: "puis la contrainte c est la charge moiyenne diviser par la monotonie")
        strain = monotonicity > 0.01 ? (averageLoad / monotonicity) : 0

        // Fitness = Weekly load - Strain
        fitness = weeklyLoad - strain
      }

      // Determine week label based on translation/context
      let label = ""
      if (i === 0) {
        label = language === "EN" ? "Current Week" : language === "AR" ? "الأسبوع الحالي" : "Semaine Actuelle"
      } else if (i === 1) {
        label = language === "EN" ? "Last Week (W-1)" : language === "AR" ? "الأسبوع الماضي (S-1)" : "Semaine S-1"
      } else {
        label = language === "EN" ? `Week W-${i}` : language === "AR" ? `الأسبوع (S-${i})` : `Semaine S-${i}`
      }

      weeksData.push({
        weekLabel: label,
        startDateStr: formatDateLocale(monday),
        endDateStr: formatDateLocale(sunday),
        activeDaysCount,
        sessionsCount,
        weeklyLoad: Math.round(weeklyLoad * 100) / 100,
        averageLoad: Math.round(averageLoad * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        monotonicity: Math.round(monotonicity * 100) / 100,
        strain: Math.round(strain * 100) / 100,
        fitness: Math.round(fitness * 100) / 100,
        sessions: weeklySessions
      })
    }

    return weeksData
  }

  const weeklyData = getWeeklyData()

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
            {language === "EN" ? "ATHLETIC PERFORMANCE" : language === "AR" ? "الأداء الرياضي" : "PERFORMANCE ATHLÉTIQUE"}
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
            {language === "EN" ? "Workload Analysis" : language === "AR" ? "تحليل حمولة العمل" : "Suivi de la Charge de Travail"}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold dark:text-zinc-400 mt-1">
            {language === "EN"
              ? "Calculates weekly workload metrics, standard deviation, strain and fitness indicators based on closed session reports."
              : language === "AR"
                ? "حساب مقاييس حمولة العمل الأسبوعية، الانحراف المعياري، مؤشرات الإجهاد واللياقة البدنية بناءً على الحصص المغلقة."
                : "Calcule les indicateurs de charge hebdomadaire, écart-type, monotonie, contrainte et fitness selon les séances clôturées."
            }
          </p>
        </div>

        {/* Category selector */}
        <div className="flex flex-col min-w-[200px]">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
            {language === "EN" ? "Team Category" : language === "AR" ? "فئة الفريق" : "Catégorie d'équipe"}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-850 px-4 py-2.5 text-xs font-bold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
          >
            {teamCategories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Weeks (Displaying 4 weeks cards) */}
      <div className="space-y-8">
        {weeklyData.map((week, idx) => {
          return (
            <div
              key={idx}
              className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
            >
              {/* Week Title & Dates Header */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-950">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                    {week.weekLabel}
                  </h3>
                  <span className="text-[10px] font-black text-blue-200 tracking-wider uppercase mt-1 block">
                    {language === "EN" ? "From" : language === "AR" ? "من" : "Du"} {week.startDateStr} {language === "EN" ? "to" : language === "AR" ? "إلى" : "au"} {week.endDateStr}
                  </span>
                </div>

                <div className="flex gap-4 select-none mt-2 sm:mt-0">
                  <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 block">{language === "EN" ? "ACTIVE DAYS" : language === "AR" ? "أيام النشاط" : "JOURS ACTIFS"}</span>
                    <span className="text-xs font-black">{week.activeDaysCount} {week.activeDaysCount > 1 ? (language === "EN" ? "Days" : language === "AR" ? "أيام" : "jours") : (language === "EN" ? "Day" : language === "AR" ? "يوم" : "jour")}</span>
                  </div>
                  <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm border border-white/5 text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 block">{language === "EN" ? "SESSIONS" : language === "AR" ? "الحصص" : "SÉANCES"}</span>
                    <span className="text-xs font-black">{week.sessionsCount} {week.sessionsCount > 1 ? (language === "EN" ? "Sessions" : language === "AR" ? "حصص" : "séances") : (language === "EN" ? "Session" : language === "AR" ? "حصة" : "séance")}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Main Indicators Table (Blue style) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-blue-50 dark:border-blue-900/30 pb-2">
                    {language === "EN" ? "1. Workload Performance Indices" : language === "AR" ? "1. مؤشرات حمولة العمل والأداء" : "1. INDICES DE PERFORMANCE DE CHARGE"}
                  </h4>

                  <div className="rounded-2xl border border-blue-100 overflow-hidden dark:border-zinc-800 shadow-inner">
                    <table className="w-full text-left border-collapse text-[10px] font-bold text-zinc-650 dark:text-zinc-300">
                      <thead>
                        <tr className="bg-blue-600 dark:bg-blue-900/60 text-white font-black uppercase select-none text-[9px] tracking-wider">
                          <th className="p-3.5 text-center">{language === "EN" ? "Weekly Load" : language === "AR" ? "الحمولة الأسبوعية" : "Charge Hebdo (UA)"}</th>
                          <th className="p-3.5 text-center">{language === "EN" ? "Average Load" : language === "AR" ? "متوسط الحمولة" : "Charge Moyenne (UA)"}</th>
                          <th className="p-3.5 text-center">{language === "EN" ? "Std Dev" : language === "AR" ? "الانحراف المعياري" : "Écart-Type"}</th>
                          <th className="p-3.5 text-center">{language === "EN" ? "Monotonicity" : language === "AR" ? "الرتابة" : "Monotonie"}</th>
                          <th className="p-3.5 text-center">{language === "EN" ? "Strain" : language === "AR" ? "الإجهاد" : "Contrainte (UA)"}</th>
                          <th className="p-3.5 text-center">{language === "EN" ? "Fitness Index" : language === "AR" ? "مؤشر اللياقة" : "Indice Fitness"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-50/30 dark:bg-zinc-950/20 text-center font-extrabold text-xs">
                          <td className="p-4 text-blue-600 dark:text-blue-400 text-sm font-black border-r border-blue-50 dark:border-zinc-800">{week.weeklyLoad}</td>
                          <td className="p-4 border-r border-blue-50 dark:border-zinc-800">{week.averageLoad}</td>
                          <td className="p-4 border-r border-blue-50 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">{week.standardDeviation}</td>
                          <td className="p-4 border-r border-blue-50 dark:border-zinc-800">{week.monotonicity}</td>
                          <td className="p-4 border-r border-blue-50 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400">{week.strain}</td>
                          <td className={`p-4 font-black text-sm ${week.fitness > 0
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                              : week.fitness < 0
                                ? "text-red-500 dark:text-red-400 bg-red-500/5"
                                : "text-zinc-600 dark:text-zinc-400"
                            }`}>
                            {week.fitness}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Detailed list of sessions in the week */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-b border-blue-50 dark:border-blue-900/30 pb-2">
                    {language === "EN" ? "2. Session Log Details" : language === "AR" ? "2. سجل تفاصيل الحصص" : "2. REGISTRE DES SÉANCES COMPTABILISÉES"}
                  </h4>

                  {week.sessions.length === 0 ? (
                    <div className="p-6 text-center bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase select-none">
                      {language === "EN"
                        ? "No completed training sessions or matches found for this week."
                        : language === "AR"
                          ? "لا توجد تدريبات أو مباريات مغلقة مسجلة لهذا الأسبوع."
                          : "Aucune séance (entraînement ou match) clôturée pour cette semaine."
                      }
                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-150 overflow-hidden dark:border-zinc-800">
                      <table className="w-full text-left border-collapse text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-950 text-zinc-500 font-black uppercase select-none text-[8px] tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                            <th className="p-3">{language === "EN" ? "Session Name" : language === "AR" ? "اسم الحصة" : "Séance"}</th>
                            <th className="p-3 text-center">{language === "EN" ? "Type" : language === "AR" ? "النوع" : "Type"}</th>
                            <th className="p-3 text-center">{language === "EN" ? "Date" : language === "AR" ? "التاريخ" : "Date & Heure"}</th>
                            <th className="p-3 text-center">{language === "EN" ? "Duration" : language === "AR" ? "المدة" : "Durée"}</th>
                            <th className="p-3 text-center">{language === "EN" ? "RPE (avg)" : language === "AR" ? "الجهد (متوسط)" : "RPE"}</th>
                            <th className="p-3 text-center text-blue-600 dark:text-blue-400">{language === "EN" ? "Charge (UA)" : language === "AR" ? "الحمولة (UA)" : "Charge (UA)"}</th>
                            <th className="p-3 text-center">{language === "EN" ? "INM (avg)" : language === "AR" ? "المؤشر (متوسط)" : "INM"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {week.sessions.map((session) => (
                            <tr
                              key={session.id}
                              className="border-b border-zinc-150 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/50"
                            >
                              <td className="p-3 uppercase font-black text-zinc-900 dark:text-white">
                                {session.type === "MATCH" && session.opponent ? (
                                  <span className="flex items-center gap-1.5">
                                    <span>Match VS {session.opponent}</span>
                                    {session.score && (
                                      <span className="rounded bg-blue-500/10 px-1 py-0.5 text-[8px] font-extrabold text-blue-600 dark:text-blue-400">
                                        {session.score}
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  session.title
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${session.type === "MATCH"
                                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  }`}>
                                  {session.type === "MATCH" ? "⚽ Match" : "🏃‍♂️ Entraînement"}
                                </span>
                              </td>
                              <td className="p-3 text-center text-zinc-500 font-bold">
                                {session.date.split("-").reverse().join("/")} à {session.time}
                              </td>
                              <td className="p-3 text-center font-bold">{session.duration} min</td>
                              <td className="p-3 text-center font-bold text-zinc-500 dark:text-zinc-400">
                                {session.rpe} / 10
                              </td>
                              <td className="p-3 text-center text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                                {session.ua}
                              </td>
                              <td className="p-3 text-center font-bold">
                                {session.inm || "-"} / 4
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
