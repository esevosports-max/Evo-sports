"use client"

import { useLanguage } from "@/components/LanguageProvider"

export default function About() {
  const { t } = useLanguage()

  const values = [
    {
      title: t("about_val_excellence"),
      description: t("about_val_excellence_desc"),
      icon: (
        <svg className="h-6 w-6 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.172-.468.83-.468.999 0l2.4 4.862 5.362.778c.516.075.722.706.347 1.07l-3.88 3.78.916 5.342c.088.517-.456.912-.916.669l-4.793-2.52-4.793 2.52c-.46.243-1.004-.152-.916-.669l.916-5.342-3.88-3.78c-.375-.364-.169-1.005.347-1.07l5.362-.778 2.4-4.862Z" />
        </svg>
      )
    },
    {
      title: t("about_val_innovation"),
      description: t("about_val_innovation_desc"),
      icon: (
        <svg className="h-6 w-6 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    },
    {
      title: t("about_val_cohesion"),
      description: t("about_val_cohesion_desc"),
      icon: (
        <svg className="h-6 w-6 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      )
    }
  ]

  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Header Block */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 [mask-image:radial-gradient(100%_100%_at_top,white,transparent)]">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Title & Subtitle */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sport font-black italic uppercase tracking-wider bg-gradient-to-r from-zinc-950 via-zinc-800 to-emerald-600 dark:from-white dark:via-zinc-200 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(16,185,129,0.3)] filter">
                {t("about_title_1")}{t("about_title_2")}
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-zinc-650 dark:text-zinc-300 leading-relaxed font-medium">
                {t("about_desc")}
              </p>
            </div>

            {/* Right Column: Logo Image */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative group">
                {/* Glowing backdrop effect for the logo */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur-xl group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
                <img
                  src="/logo.png"
                  alt="Evo Sports Logo"
                  className="relative max-h-40 sm:max-h-48 object-contain drop-shadow-[0_4px_20px_rgba(16,185,129,0.15)] transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission Story */}
      <section className="py-16 bg-zinc-50/50 dark:bg-zinc-900/10 transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sport font-black italic uppercase tracking-wider bg-gradient-to-r from-zinc-950 via-zinc-800 to-emerald-600 dark:from-white dark:via-zinc-200 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(16,185,129,0.3)] filter">
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sport font-black italic uppercase tracking-wider bg-gradient-to-r from-zinc-950 via-zinc-800 to-emerald-600 dark:from-white dark:via-zinc-200 dark:to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(16,185,129,0.3)] filter text-center">
              {t("about_values_title")}
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-sm">{t("about_values_subtitle")}</p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((val) => (
              <div
                key={val.title}
                className="relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900/50 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 group"
              >
                {/* Green accent line at the top of each value card */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 shadow-inner group-hover:scale-110 transition-transform duration-300 green-glow-pulse">
                  {val.icon}
                </div>
                <h3 className="mt-6 text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                  {val.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes green-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(16, 185, 129, 0.3), 0 0 10px rgba(16, 185, 129, 0.1);
            opacity: 0.75;
          }
          50% {
            box-shadow: 0 0 18px rgba(16, 185, 129, 0.8), 0 0 28px rgba(16, 185, 129, 0.4);
            opacity: 1;
          }
        }
        .green-glow-pulse {
          animation: green-glow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  )
}
