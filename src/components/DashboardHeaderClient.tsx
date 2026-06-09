"use client"

import { useLanguage } from "@/components/LanguageProvider"

interface DashboardHeaderClientProps {
  userName: string
  roleLabel: string
  roleName: string
}

export default function DashboardHeaderClient({ userName, roleLabel, roleName }: DashboardHeaderClientProps) {
  const { t } = useLanguage()

  // Replace {name} placeholder if present
  const welcomeText = t("db_header_welcome").replace("{name}", userName)
  const isManager = roleName === "MANAGER_EVO_SPORTS"
  const descriptionText = isManager ? t("db_header_description_manager") : t("db_header_description")

  return (
    <section className="rounded-2xl border border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-900 p-6 sm:p-8 shadow-md dark:border-zinc-800 text-white space-y-4 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("db_header_status_online")}
            </span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase animate-pulse">
            {welcomeText}
          </h1>
          
          <p className="text-xs text-zinc-350 max-w-2xl font-semibold leading-relaxed">
            {descriptionText}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4 space-y-1 md:text-right min-w-[200px] shadow-lg shadow-black/10">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{t("db_header_role")}</p>
          <h3 className="text-sm font-black text-emerald-450 uppercase tracking-wider">
            {roleLabel}
          </h3>
          <p className="text-[9px] text-zinc-500 font-bold">{t("db_header_overview")}</p>
        </div>
      </div>
    </section>
  )
}
