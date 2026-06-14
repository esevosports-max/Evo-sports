"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

interface FeatureItem {
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
}

interface Category {
  id: string
  label: string
  features: FeatureItem[]
}

export default function Home() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("club")

  const categories: Category[] = [
    {
      id: "club",
      label: t("tab_club"),
      features: [
        {
          title: t("feat_dashboard_title"),
          subtitle: t("feat_dashboard_sub"),
          description: t("feat_dashboard_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          )
        },
        {
          title: t("feat_planning_title"),
          subtitle: t("feat_planning_sub"),
          description: t("feat_planning_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008Y15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm11.25-4.5h.008v.008H18.75V12.75Zm0 2.25h.008v.008H18.75V15Zm0 2.25h.008v.008H18.75v-.008Zm-2.25-4.5h.008v.008H16.5V12.75Zm0 2.25h.008v.008H16.5V15Zm0 2.25h.008v.008H16.5v-.008Zm-2.25-4.5h.008v.008H14.25V12.75Zm0 2.25h.008v.008H14.25V15Zm0 2.25h.008v.008H14.25v-.008Z" />
            </svg>
          )
        },
        {
          title: t("feat_structure_title"),
          subtitle: t("feat_structure_sub"),
          description: t("feat_structure_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18v3H3V3Z" />
            </svg>
          )
        }
      ]
    },
    {
      id: "comm",
      label: t("tab_comm"),
      features: [
        {
          title: t("feat_messaging_title"),
          subtitle: t("feat_messaging_sub"),
          description: t("feat_messaging_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h9m-6.75 2.25H9.75L3 21V5.25a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 5.25v11.25a2.25 2.25 0 0 1-2.25 2.25h-9Z" />
            </svg>
          )
        },
        {
          title: t("feat_polls_title"),
          subtitle: t("feat_polls_sub"),
          description: t("feat_polls_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )
        }
      ]
    },
    {
      id: "sport",
      label: t("tab_sport"),
      features: [
        {
          title: t("feat_staff_title"),
          subtitle: t("feat_staff_sub"),
          description: t("feat_staff_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
            </svg>
          )
        },
        {
          title: t("feat_players_title"),
          subtitle: t("feat_players_sub"),
          description: t("feat_players_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          )
        },
        {
          title: t("feat_composition_title"),
          subtitle: t("feat_composition_sub"),
          description: t("feat_composition_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
            </svg>
          )
        },
        {
          title: t("feat_trainings_title"),
          subtitle: t("feat_trainings_sub"),
          description: t("feat_trainings_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 0 0-7.5-7.5H4.5m0-3h.75A10.5 10.5 0 0 1 15.75 18.75v.75m-11.25-15h.75A13.5 13.5 0 0 1 18.75 18v.75m-15-15h.75" />
            </svg>
          )
        },
        {
          title: t("feat_matches_title"),
          subtitle: t("feat_matches_sub"),
          description: t("feat_matches_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3-3V9m-12 9.75a3 3 0 0 1-3-3V9m15 0a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3M16.5 6V3.75h-9V6" />
            </svg>
          )
        }
      ]
    },
    {
      id: "health",
      label: t("tab_health"),
      features: [
        {
          title: t("feat_injuries_title"),
          subtitle: t("feat_injuries_sub"),
          description: t("feat_injuries_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )
        },
        {
          title: t("feat_medical_title"),
          subtitle: t("feat_medical_sub"),
          description: t("feat_medical_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.481A3.75 3.75 0 0 1 7.5 12.75v-1.5m3.75 4.5A3.75 3.75 0 0 0 15 12.75v-1.5M7.5 11.25V9.75a3.75 3.75 0 0 1 7.5 0v1.5" />
            </svg>
          )
        },
        {
          title: t("feat_tests_title"),
          subtitle: t("feat_tests_sub"),
          description: t("feat_tests_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 1 3 2.48Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
            </svg>
          )
        },
        {
          title: t("feat_welfare_title"),
          subtitle: t("feat_welfare_sub"),
          description: t("feat_welfare_desc"),
          icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-3a2.25 2.25 0 0 0-2.25 2.25v15a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-15a2.25 2.25 0 0 0-2.25-2.25h-3m-3 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.481A3.75 3.75 0 0 1 7.5 12.75v-1.5m3.75 4.5A3.75 3.75 0 0 0 15 12.75v-1.5M7.5 11.25V9.75a3.75 3.75 0 0 1 7.5 0v1.5" />
            </svg>
          )
        }
      ]
    }
  ]

  const activeCategory = categories.find((c) => c.id === activeTab) || categories[0]

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">

        <h1 className="mx-auto max-w-4xl text-4xl font-sport font-black italic uppercase tracking-wide text-black sm:text-6xl dark:text-white">
          {t("hero_title_1")} <span className="text-emerald-500 normal-case animate-glow-emerald inline-block cursor-default">{t("hero_title_2")}</span>{" "}
          <span className="text-zinc-400 normal-case animate-glow-zinc inline-block cursor-default">{t("hero_title_3")}</span>
          <span className="block mt-2">
            {t("hero_title_4")}
          </span>
        </h1>

        {/* Blinking Sport Subtitle */}
        <div className="mt-4 text-xs sm:text-sm font-bold tracking-widest text-emerald-500 uppercase animate-glow">
          {t("hero_subtitle")}
        </div>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {t("hero_desc")}
        </p>



        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-6 py-3.5 text-sm font-black uppercase tracking-wider shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            {t("hero_cta_trial")}
          </Link>
          <Link
            href="/about"
            className="rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-6 py-3.5 text-sm font-black uppercase tracking-wider shadow-sm hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            {t("hero_cta_more")}
          </Link>
        </div>

        {/* Dashboard Mockup Showcase */}
        <div className="mt-16 mx-auto max-w-5xl space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {t("hero_discover")} <span className="text-emerald-500 lowercase">{t("hero_title_2")}</span> <span className="text-zinc-400 lowercase">{t("hero_title_3")}</span>
            </h3>
            <p className="mx-auto max-w-2xl text-sm text-zinc-500 dark:text-zinc-400 font-semibold">
              {t("hero_discover_desc")}
            </p>
          </div>

          <div className="relative rounded-2xl border border-zinc-200/50 bg-white/30 p-2 shadow-2xl backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/30 overflow-hidden group">
            <div className="rounded-xl border border-zinc-200/50 overflow-hidden dark:border-zinc-800/50 bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/offers-banner.png" 
                alt="Découvrez nos offres - EVO SPORTS Banner" 
                className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.01]" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tabs Features Grid */}
      <div className="py-16 sm:py-24 bg-zinc-50/50 dark:bg-zinc-900/20 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-xs font-semibold tracking-wider text-emerald-500 uppercase">
              {t("tab_moteur")}
            </h2>
            <p className="mt-2 text-3xl font-sport font-black italic uppercase tracking-wide text-zinc-900 sm:text-4xl dark:text-white">
              {t("tab_concu")}
            </p>
          </div>

          {/* Tabs Selector Navigation */}
          <div className="mt-12 flex justify-center">
            <div className="flex flex-wrap items-center justify-center p-1.5 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/60 backdrop-blur-sm border border-zinc-300/30 gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center justify-center rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === cat.id
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Category Features Display */}
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {activeCategory.features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group relative rounded-2xl border border-zinc-200/50 bg-white p-6 hover:border-zinc-300/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-900"
                >
                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10">
                    {feature.icon}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-4">
                    <span className="text-[10px] font-black uppercase text-emerald-500 dark:text-emerald-450 tracking-wider">
                      {feature.subtitle}
                    </span>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white mt-0.5">
                      {feature.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Download App Section */}
          <div className="mt-24 border-t border-zinc-200/50 dark:border-zinc-800/50 pt-16">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-sport font-black italic uppercase tracking-wide text-zinc-900 sm:text-4xl dark:text-white">
                {t("download_title")}
              </h2>
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-semibold">
                {t("download_subtitle")}
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-4xl grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Web App Link */}
              <Link
                href="/login"
                className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200/50 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300 group-hover:bg-emerald-500/10">
                  <svg className="h-8 w-8 text-black dark:text-white transition-colors duration-300 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  {t("download_web")}
                </h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {t("download_web_desc")}
                </p>
                <span className="mt-4 text-[10px] font-black uppercase text-emerald-500 tracking-widest group-hover:underline">
                  {t("download_web_btn")}
                </span>
              </Link>

              {/* Android App Link */}
              <Link
                href="#"
                className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200/50 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300 group-hover:bg-emerald-500/10">
                  <svg className="h-8 w-8 text-black dark:text-white fill-current transition-colors duration-300 group-hover:text-emerald-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-9.2 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-9.67-4.19l1.62-2.8a.493.493 0 0 0-.18-.67c-.24-.14-.54-.06-.68.17l-1.65 2.85A10.875 10.875 0 0 0 12 8.5c-1.63 0-3.15.36-4.51.99L5.84 6.66a.498.498 0 0 0-.68-.17.493.493 0 0 0-.18.67l1.62 2.8C3.51 11.24 1.44 14.39 1 18h22c-.44-3.61-2.51-6.76-5.63-8.19z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  {t("download_android")}
                </h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {t("download_android_desc")}
                </p>
                <span className="mt-4 text-[10px] font-black uppercase text-emerald-500 tracking-widest group-hover:underline">
                  {t("download_android_btn")}
                </span>
              </Link>

              {/* iOS App Link */}
              <Link
                href="#"
                className="group flex flex-col items-center justify-center rounded-2xl border border-zinc-200/50 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-900/50"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 transition-colors duration-300 group-hover:bg-emerald-500/10">
                  <svg className="h-8 w-8 text-black dark:text-white fill-current transition-colors duration-300 group-hover:text-emerald-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.06 1.005 1.45 2.19 3.078 3.766 3.02 1.524-.06 2.098-.98 3.937-.98 1.829 0 2.365.98 3.96.948 1.622-.027 2.65-1.477 3.64-2.924 1.143-1.674 1.614-3.291 1.637-3.376-.037-.01-3.149-1.207-3.182-4.795-.027-3.003 2.457-4.444 2.57-4.516-1.41-2.061-3.585-2.29-4.343-2.338-2.02-.162-3.418 1.026-4.138 1.026zm2.522-4.57c.85-.99 1.428-2.326 1.272-3.66-1.15.047-2.543.766-3.367 1.722-.716.822-1.341 2.184-1.168 3.498 1.28.1 2.607-.63 3.263-1.56z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  {t("download_ios")}
                </h3>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {t("download_ios_desc")}
                </p>
                <span className="mt-4 text-[10px] font-black uppercase text-emerald-500 tracking-widest group-hover:underline">
                  {t("download_ios_btn")}
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
