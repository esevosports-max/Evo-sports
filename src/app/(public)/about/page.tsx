"use client"

import { useLanguage } from "@/components/LanguageProvider"

export default function About() {
  const { t } = useLanguage()

  const values = [
    {
      title: t("about_val_excellence"),
      description: t("about_val_excellence_desc"),
      icon: (
        <svg className="h-6 w-6 text-blue-650 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.468.83-.468.999 0l2.4 4.862 5.362.778c.516.075.722.706.347 1.07l-3.88 3.78.916 5.342c.088.517-.456.912-.916.669l-4.793-2.52-4.793 2.52c-.46.243-1.004-.152-.916-.669l.916-5.342-3.88-3.78c-.375-.364-.169-1.005.347-1.07l5.362-.778 2.4-4.862Z" />
        </svg>
      )
    },
    {
      title: t("about_val_innovation"),
      description: t("about_val_innovation_desc"),
      icon: (
        <svg className="h-6 w-6 text-indigo-650 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    },
    {
      title: t("about_val_cohesion"),
      description: t("about_val_cohesion_desc"),
      icon: (
        <svg className="h-6 w-6 text-purple-650 dark:text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      )
    }
  ]

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Header Block */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 [mask-image:radial-gradient(100%_100%_at_top,white,transparent)]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
            {t("about_title_1")}{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("about_title_2")}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {t("about_desc")}
          </p>
        </div>
      </section>

      {/* Our Mission Story */}
      <section className="py-16 bg-zinc-50/50 dark:bg-zinc-900/10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                {t("about_mission")}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
                {t("about_mission_p1")}
              </p>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
                {t("about_mission_p2")}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 aspect-[4/3] flex items-center justify-center">
              <div className="text-center space-y-4">
                <span className="text-6xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">100%</span>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{t("about_connected")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Block */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{t("about_values_title")}</h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm">{t("about_values_subtitle")}</p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val) => (
              <div key={val.title} className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900/50 hover:shadow-md transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-950 shadow-inner">
                  {val.icon}
                </div>
                <h3 className="mt-6 text-lg font-bold text-zinc-900 dark:text-white">{val.title}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
