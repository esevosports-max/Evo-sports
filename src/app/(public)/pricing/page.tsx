"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

export default function Pricing() {
  const { t } = useLanguage()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      name: t("pricing_1eq"),
      price: billingPeriod === "monthly" ? t("pricing_price_1eq_monthly") : t("pricing_price_1eq_yearly"),
      period: billingPeriod === "monthly" ? t("pricing_per_month") : t("pricing_per_year"),
      description: t("pricing_1eq_desc"),
      features: [
        t("pricing_1eq_f1"),
        t("pricing_1eq_f2"),
        t("pricing_1eq_f3"),
        t("pricing_1eq_f4"),
        t("pricing_1eq_f5"),
      ],
      cta: t("pricing_select"),
      popular: false,
      href: "/register",
      color: {
        text: "text-sky-600 dark:text-sky-400",
        border: "border-zinc-200 dark:border-zinc-800 hover:border-sky-500/50 dark:hover:border-sky-500/40",
        bgGradient: "from-sky-400 to-blue-500",
        button: "border border-sky-500/50 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:border-sky-500/30 dark:hover:bg-sky-950/20",
        check: "text-sky-500",
      }
    },
    {
      name: t("pricing_club"),
      price: billingPeriod === "monthly" ? t("pricing_price_club_monthly") : t("pricing_price_club_yearly"),
      period: billingPeriod === "monthly" ? t("pricing_per_month") : t("pricing_per_year"),
      description: t("pricing_club_desc"),
      features: [
        t("pricing_club_f1"),
        t("pricing_club_f2"),
        t("pricing_club_f3"),
        t("pricing_club_f4"),
        t("pricing_club_f5"),
      ],
      cta: t("pricing_select"),
      popular: false,
      href: "/register",
      color: {
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/40",
        bgGradient: "from-violet-400 to-indigo-500",
        button: "border border-indigo-500/50 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-950/20",
        check: "text-indigo-500",
      }
    },
    {
      name: t("pricing_pro"),
      price: billingPeriod === "monthly" ? t("pricing_price_pro_monthly") : t("pricing_price_pro_yearly"),
      period: billingPeriod === "monthly" ? t("pricing_per_month") : t("pricing_per_year"),
      description: t("pricing_pro_desc"),
      features: [
        t("pricing_pro_f1"),
        t("pricing_pro_f2"),
        t("pricing_pro_f3"),
        t("pricing_pro_f4"),
        t("pricing_pro_f5"),
      ],
      cta: t("pricing_select"),
      popular: true,
      href: "/register",
      color: {
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500 ring-2 ring-emerald-500/10 dark:border-emerald-500 dark:ring-emerald-500/10 z-10",
        bgGradient: "from-emerald-400 to-teal-500",
        button: "bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20",
        check: "text-emerald-500",
      }
    },
    {
      name: t("pricing_elite"),
      price: billingPeriod === "monthly" ? t("pricing_price_elite_monthly") : t("pricing_price_elite_yearly"),
      period: billingPeriod === "monthly" ? t("pricing_per_month") : t("pricing_per_year"),
      description: t("pricing_elite_desc"),
      features: [
        t("pricing_elite_f1"),
        t("pricing_elite_f2"),
        t("pricing_elite_f3"),
        t("pricing_elite_f4"),
        t("pricing_elite_f5"),
      ],
      cta: t("pricing_select"),
      popular: false,
      href: "/register",
      color: {
        text: "text-amber-600 dark:text-amber-400",
        border: "border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/40",
        bgGradient: "from-amber-400 to-orange-500",
        button: "border border-amber-500/50 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-950/20",
        check: "text-amber-500",
      }
    }
  ]

  const handleSelectPlan = (planName: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("selectedPlan", planName)
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
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
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-zinc-200 transition-colors duration-200 ease-in-out focus:outline-none dark:bg-zinc-800"
              role="switch"
              aria-checked={billingPeriod === "yearly"}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-emerald-500 shadow ring-0 transition duration-200 ease-in-out ${
                  billingPeriod === "yearly" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
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
          <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md ${plan.color.border} dark:bg-zinc-900`}
              >
                {/* Accent line at the top */}
                <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-2xl bg-gradient-to-r ${plan.color.bgGradient}`} />

                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-2xs font-extrabold text-white uppercase tracking-widest shadow-sm">
                    {t("pricing_recom")}
                  </span>
                )}

                <div className="flex-1 space-y-4 pt-2">
                  <h3 className={`text-xl font-bold ${plan.color.text}`}>{plan.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                  <div className="pt-4 flex items-baseline" dir="ltr">
                    <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{plan.price}</span>
                    <span className="ml-1 text-sm text-zinc-500 dark:text-zinc-400">/{plan.period}</span>
                  </div>

                  <ul className="pt-6 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center space-x-3 text-sm text-zinc-600 dark:text-zinc-300">
                        <svg className={`h-4 w-4 flex-shrink-0 ${plan.color.check}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <Link
                    href={plan.href}
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`block w-full rounded-xl py-3 text-center text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${plan.color.button}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
