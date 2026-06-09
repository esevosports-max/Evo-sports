"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

interface SummaryClientProps {
  user: {
    name: string | null
    email: string | null
  }
  roleLabel: string
  currentGradient: string
  permissionsCount: number
  subscription?: {
    plan: string
    status: string
    expires: string | null
  } | null
  metrics?: {
    teamsCount: number
    playersCount: number
    injuriesCount: number
    availableCount: number
    unavailableCount: number
    rehabCount: number
    staffCount: number
  } | null
}

export default function DashboardSummaryClient({
  subscription,
  metrics,
}: SummaryClientProps) {
  const [activeTab, setActiveTab] = useState<"sport" | "medical" | "club">("sport")
  const { t, language } = useLanguage()

  const m = metrics || {
    teamsCount: 0,
    playersCount: 0,
    injuriesCount: 0,
    availableCount: 0,
    unavailableCount: 0,
    rehabCount: 0,
    staffCount: 0,
  }

  // The 4 tabs of 4 items each (dynamically translated)
  const tabsData = {
    sport: {
      title: t("db_tab_title_sport"),
      icon: "⚽",
      metrics: [
        { label: t("db_metric_teams"), value: m.teamsCount.toString(), sub: t("db_metric_teams_sub"), desc: t("db_metric_teams_desc"), link: "/dashboard/equipe" },
        { label: t("db_metric_roster"), value: m.playersCount.toString(), sub: t("db_metric_roster_sub"), desc: t("db_metric_roster_desc"), link: "/dashboard/effectifs" },
      ],
    },

    medical: {
      title: t("db_tab_title_medical"),
      icon: "🏥",
      metrics: [
        { label: t("db_metric_injuries"), value: m.injuriesCount.toString(), sub: t("db_metric_injuries_sub"), desc: t("db_metric_injuries_desc"), link: "/dashboard/medical/blessures" },
        { label: t("db_metric_available"), value: m.availableCount.toString(), sub: t("db_metric_available_sub"), desc: t("db_metric_available_desc"), link: "/dashboard/effectifs" },
        { label: t("db_metric_unavailable"), value: m.unavailableCount.toString(), sub: t("db_metric_unavailable_sub"), desc: t("db_metric_unavailable_desc"), link: "/dashboard/medical/blessures" },
        { label: t("db_metric_rehab"), value: m.rehabCount.toString(), sub: t("db_metric_rehab_sub"), desc: t("db_metric_rehab_desc"), link: "/dashboard/medical/blessures" },
      ],
    },
    club: {
      title: t("db_tab_title_club"),
      icon: "⚙️",
      metrics: [
        { label: t("db_metric_staff"), value: m.staffCount.toString(), sub: t("db_metric_staff_sub"), desc: t("db_metric_staff_desc"), link: "/dashboard/staff" },
      ],
    },
  }

  const currentTab = tabsData[activeTab]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Page Title & Tab Metrics selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black uppercase tracking-wider text-zinc-950">
              {t("db_title")}
            </h2>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
              {t("db_subtitle")}
            </p>
          </div>

          {subscription && (
            <div className="inline-flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/60 px-3.5 py-2 rounded-2xl dark:bg-zinc-800/10 dark:border-zinc-800 shadow-sm self-start">
              <span className="text-sm">💳</span>
              <div className="text-left leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    {t("db_plan_offer")} {subscription.plan}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wide ${
                    subscription.status === "Essai"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400"
                      : subscription.status === "Actif"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                  }`}>
                    {subscription.status === "Essai" ? t("db_plan_trial") : subscription.status}
                  </span>
                </div>
                {subscription.expires && (
                  <p className="text-[9px] text-zinc-400 font-bold mt-1">
                    {t("db_plan_expires")} {new Date(subscription.expires).toLocaleDateString(
                      language === "FR" ? "fr-FR" : language === "EN" ? "en-US" : "ar-EG",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Onglets with Digital Indices */}
        <div className="flex flex-wrap gap-2 bg-zinc-100/80 p-1.5 rounded-2xl">
          {[
            { key: "sport", label: t("db_tab_sport"), icon: "⚽", count: "2" },
            { key: "medical", label: t("db_tab_medical"), icon: "🏥", count: "4" },
            { key: "club", label: t("db_tab_admin"), icon: "⚙️", count: "1" },
          ].map((tabInfo) => {
            const active = activeTab === tabInfo.key
            return (
              <button
                key={tabInfo.key}
                onClick={() => setActiveTab(tabInfo.key as any)}
                className={`flex items-center gap-2.5 py-2.5 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer border ${
                  active
                    ? "bg-white text-emerald-600 border-emerald-500/15 shadow-sm font-black"
                    : "text-zinc-500 hover:text-zinc-850 hover:bg-white/40 border-transparent"
                }`}
              >
                <span>{tabInfo.icon}</span>
                <span>{tabInfo.label}</span>
                <span className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-bold ${
                  active 
                    ? "bg-emerald-500/15 text-emerald-600" 
                    : "bg-zinc-200/80 text-zinc-650"
                }`}>
                  {tabInfo.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid of 4 Metric Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <span className="text-xl">{currentTab.icon}</span>
          <h3 className="text-xs font-black uppercase text-zinc-900 tracking-widest">
            {currentTab.title} — {t("db_summary_title")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentTab.metrics.map((metric, index) => (
            <Link
              key={index}
              href={metric.link}
              className="group rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-48 border-zinc-100 hover:border-emerald-500/20"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider group-hover:text-emerald-500 transition-colors">
                    {metric.label}
                  </span>
                  <span className="text-xs group-hover:scale-110 transition-transform">➡️</span>
                </div>
                <p className="text-3xl font-black text-zinc-950 tracking-tight">{metric.value}</p>
                <p className="text-xs font-bold text-emerald-600">{metric.sub}</p>
              </div>

              <div className="border-t border-zinc-100 pt-3 text-[10px] font-semibold text-zinc-550 leading-relaxed">
                {metric.desc}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Access Actions Links */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("db_shortcuts_title")}
          </h4>
          <p className="text-[11px] text-zinc-500 font-semibold mt-1">{t("db_shortcuts_desc")}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href="/dashboard/messagerie" className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 transition-colors">
            💬 {t("db_shortcut_msg")}
          </Link>
          <Link href="/dashboard/quotidienne" className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 transition-colors">
            📝 {t("db_shortcut_wellness")}
          </Link>
        </div>
      </div>

    </div>
  )
}
