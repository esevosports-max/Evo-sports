"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  type: string // "GRATUIT" | "PAYANT"
  durationYears: number
  durationMonths: number
  durationDays: number
  durationHours: number
  durationMinutes: number
  durationSeconds: number
  billingPeriodType: string // "BOTH" | "MONTHLY" | "ANNUAL"
  priceMonthly: number
  priceYearly: number
  paymentMethods: string
  maxTeams: number
  staffLimits: Record<string, number> | null
  hasDashboard: boolean
  hasPayment: boolean
  hasPlanning: boolean
  hasMessaging: boolean
  hasPolls: boolean
  hasStructure: boolean
  hasStaff: boolean
  hasPlayers: boolean
  hasTactical: boolean
  hasTrainings: boolean
  hasMatches: boolean
  hasInjuries: boolean
  hasMedical: boolean
  hasTests: boolean
  hasWelfare: boolean
  hasGPS: boolean
  hasRbac: boolean
  hasSupport: boolean
  featuresList: string[] | null
  popular: boolean
  colorTheme: string
}

const getThemeStyles = (theme: string, popular: boolean) => {
  const styles: Record<string, {
    text: string
    border: string
    bgGradient: string
    button: string
    check: string
  }> = {
    sky: {
      text: "text-sky-600 dark:text-sky-400",
      border: popular 
        ? "border-sky-500 ring-2 ring-sky-500/10 dark:border-sky-500 dark:ring-sky-500/10 z-10 animate-pulse-slow" 
        : "border-zinc-200 dark:border-zinc-800 hover:border-sky-500/50 dark:hover:border-sky-500/40",
      bgGradient: "from-sky-400 to-blue-500",
      button: popular 
        ? "bg-sky-500 text-white hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-500/20" 
        : "border border-sky-500/50 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-500/30 dark:hover:bg-sky-950/20",
      check: "text-sky-500",
    },
    indigo: {
      text: "text-indigo-600 dark:text-indigo-400",
      border: popular
        ? "border-indigo-500 ring-2 ring-indigo-500/10 dark:border-indigo-500 dark:ring-indigo-500/10 z-10 animate-pulse-slow"
        : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/40",
      bgGradient: "from-violet-400 to-indigo-500",
      button: popular
        ? "bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20"
        : "border border-indigo-500/50 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-950/20",
      check: "text-indigo-500",
    },
    emerald: {
      text: "text-emerald-600 dark:text-emerald-400",
      border: popular
        ? "border-emerald-500 ring-2 ring-emerald-500/10 dark:border-emerald-500 dark:ring-emerald-500/10 z-10 animate-pulse-slow"
        : "border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40",
      bgGradient: "from-emerald-400 to-teal-500",
      button: popular
        ? "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20"
        : "border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-950/20",
      check: "text-emerald-500",
    },
    amber: {
      text: "text-amber-600 dark:text-amber-400",
      border: popular
        ? "border-amber-500 ring-2 ring-amber-500/10 dark:border-amber-500 dark:ring-amber-500/10 z-10 animate-pulse-slow"
        : "border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/40",
      bgGradient: "from-amber-400 to-orange-500",
      button: popular
        ? "bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20"
        : "border border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-950/20",
      check: "text-amber-500",
    },
    rose: {
      text: "text-rose-600 dark:text-rose-400",
      border: popular
        ? "border-rose-500 ring-2 ring-rose-500/10 dark:border-rose-500 dark:ring-rose-500/10 z-10 animate-pulse-slow"
        : "border-zinc-200 dark:border-zinc-800 hover:border-rose-500/50 dark:hover:border-rose-500/40",
      bgGradient: "from-rose-400 to-pink-500",
      button: popular
        ? "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20"
        : "border border-rose-500/50 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-500/30 dark:hover:bg-rose-950/20",
      check: "text-rose-500",
    },
    purple: {
      text: "text-purple-600 dark:text-purple-400",
      border: popular
        ? "border-purple-500 ring-2 ring-purple-500/10 dark:border-purple-500 dark:ring-purple-500/10 z-10 animate-pulse-slow"
        : "border-zinc-200 dark:border-zinc-800 hover:border-purple-500/50 dark:hover:border-purple-500/40",
      bgGradient: "from-purple-400 to-fuchsia-500",
      button: popular
        ? "bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/20"
        : "border border-purple-500/50 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-500/30 dark:hover:bg-purple-950/20",
      check: "text-purple-500",
    },
  }
  return styles[theme] || styles.sky
}

export default function Pricing() {
  const { t, language } = useLanguage()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await fetch("/api/public/plans")
        const json = await res.json()
        if (json.success && json.data) {
          setPlans(json.data)
        }
      } catch (e) {
        console.error("Error fetching subscription plans:", e)
      } finally {
        setLoading(false)
      }
    }
    loadPlans()
  }, [])

  const handleSelectPlan = (planName: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedPlan", planName)
      sessionStorage.setItem("selectedBillingPeriod", billingPeriod)
    }
  }

  const getPlanDetails = (p: SubscriptionPlan) => {
    const activeFeatures: string[] = []

    if (p.hasDashboard) activeFeatures.push(language === "EN" ? "Dashboard / Overview" : language === "AR" ? "لوحة التحكم / نظرة عامة" : "Tableau de Bord (Vue d'ensemble)")
    if (p.hasPayment) activeFeatures.push(language === "EN" ? "Subscription & Payments" : language === "AR" ? "الاشتراك والمدفوعات" : "Abonnement & Paiement (Formules & règlements)")
    if (p.hasPlanning) activeFeatures.push(language === "EN" ? "Club Planning / Shared Agenda" : language === "AR" ? "تخطيط النادي / جدول الأعمال المشترك" : "Planning du Club (Agenda officiel partagé)")
    if (p.hasMessaging) activeFeatures.push(language === "EN" ? "Messaging / Internal Chat" : language === "AR" ? "الرسائل / الدردشة الداخلية" : "Messagerie (Discussions internes)")
    if (p.hasPolls) activeFeatures.push(language === "EN" ? "Polls & Consultations" : language === "AR" ? "الاستطلاعات والتصويت" : "Sondages (Consultations & votes)")
    if (p.hasStructure) activeFeatures.push(language === "EN" ? "My Club & Teams / Structure" : language === "AR" ? "ناديي وفرقي / الهيكل" : "Mon Club & Équipes (Infos & structures)")
    if (p.hasStaff) activeFeatures.push(language === "EN" ? "Technical Staff / Members" : language === "AR" ? "الطاقم الفني / الأعضاء" : "Staff Technique (Membres du staff)")
    if (p.hasPlayers) activeFeatures.push(language === "EN" ? "Players / Roster" : language === "AR" ? "اللاعبين / القائمة" : "Effectifs (Liste des joueurs)")
    if (p.hasTactical) activeFeatures.push(language === "EN" ? "Composition & Tactics" : language === "AR" ? "التشكيل والتكتيك" : "Composition (Feuille de match & tactique)")
    if (p.hasTrainings) activeFeatures.push(language === "EN" ? "Trainings planning" : language === "AR" ? "تخطيط التدريبات" : "Entraînements (Planification des séances)")
    if (p.hasMatches) activeFeatures.push(language === "EN" ? "Matches / Schedule" : language === "AR" ? "المباريات / الجدول" : "Matchs (Calendrier des rencontres)")
    if (p.hasInjuries) activeFeatures.push(language === "EN" ? "Injuries tracking / Infirmary" : language === "AR" ? "متابعة الإصابات / العيادة" : "Suivi Blessures (Infirmerie & convalescence)")
    if (p.hasMedical) activeFeatures.push(language === "EN" ? "Medical dossier / Health record" : language === "AR" ? "الملف الطبي / السجل الصحي" : "Dossier Médical (Suivi de santé confidentiel)")
    if (p.hasTests) activeFeatures.push(language === "EN" ? "Physical Tests / Athletic check" : language === "AR" ? "الاختبارات البدنية" : "Tests Physiques (Évaluation athlétique)")
    if (p.hasWelfare) activeFeatures.push(language === "EN" ? "Daily Welfare / Form & RPE" : language === "AR" ? "الاستبيان اليومي / الحالة والجهد" : "Fiche Quotidienne (Forme & RPE)")
    if (p.hasGPS) activeFeatures.push(language === "EN" ? "Live GPS Telemetry" : language === "AR" ? "تتبع نظام تحديد المواقع المباشر" : "Télémétrie GPS en direct")

    const norm = p.name.toLowerCase().trim()
    if (norm === "gratuit" || norm === "free" || norm === "trial") {
      return {
        name: language === "EN" ? "Free" : language === "AR" ? "مجاني" : "Gratuit",
        description: language === "EN" ? "Try the platform and discover the basic features." : language === "AR" ? "جرب المنصة واكتشف الميزات الأساسية." : (p.description || "Pour essayer la plateforme."),
        features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList || [
          language === "EN" ? "1 single category / team" : language === "AR" ? "فئة/فريق واحد فقط" : "1 seule catégorie / équipe",
          language === "EN" ? "Up to 15 player profiles" : language === "AR" ? "حتى 15 ملف لاعب" : "Jusqu'à 15 profils de joueurs",
          language === "EN" ? "Standard training schedule" : language === "AR" ? "تخطيط التدريبات القياسي" : "Planification standard d'entraînements"
        ])
      }
    }
    
    if (norm === "1 équipe" || norm === "1 equipe" || norm === "1 team") {
      return {
        name: t("pricing_1eq"),
        description: t("pricing_1eq_desc") || p.description,
        features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList ? p.featuresList.map((f, i) => t(`pricing_1eq_f${i + 1}`) || f) : [
          t("pricing_1eq_f1"),
          t("pricing_1eq_f2"),
          t("pricing_1eq_f3"),
          t("pricing_1eq_f4"),
          t("pricing_1eq_f5"),
        ])
      }
    }
    
    if (norm === "club") {
      return {
        name: t("pricing_club"),
        description: t("pricing_club_desc") || p.description,
        features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList ? p.featuresList.map((f, i) => t(`pricing_club_f${i + 1}`) || f) : [
          t("pricing_club_f1"),
          t("pricing_club_f2"),
          t("pricing_club_f3"),
          t("pricing_club_f4"),
          t("pricing_club_f5"),
        ])
      }
    }
    
    if (norm === "professionnel" || norm === "pro") {
      return {
        name: t("pricing_pro"),
        description: t("pricing_pro_desc") || p.description,
        features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList ? p.featuresList.map((f, i) => t(`pricing_pro_f${i + 1}`) || f) : [
          t("pricing_pro_f1"),
          t("pricing_pro_f2"),
          t("pricing_pro_f3"),
          t("pricing_pro_f4"),
          t("pricing_pro_f5"),
        ])
      }
    }
    
    if (norm === "elite") {
      return {
        name: t("pricing_elite"),
        description: t("pricing_elite_desc") || p.description,
        features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList ? p.featuresList.map((f, i) => t(`pricing_elite_f${i + 1}`) || f) : [
          t("pricing_elite_f1"),
          t("pricing_elite_f2"),
          t("pricing_elite_f3"),
          t("pricing_elite_f4"),
          t("pricing_elite_f5"),
        ])
      }
    }

    return {
      name: p.name,
      description: p.description || "",
      features: activeFeatures.length > 0 ? activeFeatures : (p.featuresList || [])
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200 min-h-screen">
      {/* Header Block */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 [mask-image:radial-gradient(100%_100%_at_top,white,transparent)]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl font-sport font-black italic uppercase tracking-wide text-zinc-900 sm:text-5xl dark:text-white">
            {t("pricing_title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {t("pricing_subtitle")}
          </p>

          {/* Billing Toggle Slider */}
          <div className="mt-8 flex items-center justify-center gap-4" dir="ltr">
            <span
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                billingPeriod === "monthly" ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-650"
              }`}
              onClick={() => setBillingPeriod("monthly")}
            >
              {t("pricing_monthly")}
            </span>
            <div
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="flex items-center cursor-pointer"
            >
              <button
                type="button"
                className="relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent bg-zinc-200 transition-colors duration-200 ease-in-out focus:outline-none dark:bg-zinc-800 pointer-events-none"
                role="switch"
                aria-checked={billingPeriod === "yearly"}
              >
                <span
                  style={{
                    transform: billingPeriod === "yearly" ? "translateX(20px)" : "translateX(0px)"
                  }}
                  className="inline-block h-5 w-5 rounded-full bg-emerald-500 shadow ring-0 transition-transform duration-200 ease-in-out"
                />
              </button>
            </div>
            <span
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                billingPeriod === "yearly" ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-650"
              }`}
              onClick={() => setBillingPeriod("yearly")}
            >
              {t("pricing_yearly")}
              <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-normal">
                {t("pricing_save_20")}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            /* Beautiful Loading Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-6">
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                  <div className="space-y-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {plans.map((p) => {
                const details = getPlanDetails(p)
                const styles = getThemeStyles(p.colorTheme, p.popular)

                // Price display logic
                let priceLabel = ""
                let periodLabel = ""
                if (p.type === "GRATUIT") {
                  priceLabel = language === "EN" ? "Free" : language === "AR" ? "مجاني" : "Gratuit"
                  periodLabel = p.durationDays > 0 ? `${p.durationDays} ${language === "EN" ? "days" : language === "AR" ? "أيام" : "jours"}` : (language === "EN" ? "trial" : "essai")
                } else {
                  // Payant
                  const hasMonthly = p.billingPeriodType === "BOTH" || p.billingPeriodType === "MONTHLY"
                  const hasYearly = p.billingPeriodType === "BOTH" || p.billingPeriodType === "ANNUAL"

                  if (billingPeriod === "monthly" && hasMonthly) {
                    priceLabel = `${p.priceMonthly.toLocaleString()} DZD`
                    periodLabel = t("pricing_per_month")
                  } else if (billingPeriod === "yearly" && hasYearly) {
                    priceLabel = `${p.priceYearly.toLocaleString()} DZD`
                    periodLabel = t("pricing_per_year")
                  } else {
                    // Fallback to whichever is defined
                    if (hasMonthly) {
                      priceLabel = `${p.priceMonthly.toLocaleString()} DZD`
                      periodLabel = t("pricing_per_month")
                    } else {
                      priceLabel = `${p.priceYearly.toLocaleString()} DZD`
                      periodLabel = t("pricing_per_year")
                    }
                  }
                }

                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md ${styles.border} dark:bg-zinc-900`}
                  >
                    {/* Accent line at the top */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${styles.bgGradient}`} />

                    {p.popular && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-2xs font-extrabold text-white uppercase tracking-widest shadow-sm">
                        {t("pricing_popular") || "Recommandé"}
                      </span>
                    )}

                    <div className="flex-1 space-y-4 pt-2">
                      <h3 className={`text-xl font-bold ${styles.text}`}>{details.name}</h3>
                      <p className="text-sm text-zinc-550 dark:text-zinc-400 min-h-12 leading-relaxed">{details.description}</p>
                      <div className="pt-4 flex items-baseline" dir="ltr">
                        <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">{priceLabel}</span>
                        {periodLabel && (
                          <span className="ml-1.5 text-xs text-zinc-450 dark:text-zinc-500 font-bold">/{periodLabel}</span>
                        )}
                      </div>

                      <ul className="pt-6 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                        {details.features.map((feat) => (
                          <li key={feat} className="flex items-start space-x-3 text-sm text-zinc-650 dark:text-zinc-300">
                            <svg className={`h-4 w-4 flex-shrink-0 mt-0.5 ${styles.check}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs leading-normal">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-8">
                      <Link
                        href="/register"
                        onClick={() => handleSelectPlan(p.name)}
                        className={`block w-full rounded-xl py-3 text-center text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${styles.button}`}
                      >
                        {t("pricing_select")}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
