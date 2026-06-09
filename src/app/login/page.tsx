"use client"

import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useLanguage } from "@/components/LanguageProvider"

export default function Login() {
  const { t, language } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError(
          language === "FR"
            ? "Identifiants incorrects. Veuillez réessayer."
            : language === "EN"
            ? "Incorrect credentials. Please try again."
            : "بيانات الاعتماد غير صحيحة. يرجى المحاولة مرة أخرى."
        )
        setLoading(false)
        return
      }

      // Reset inactivity timestamp
      if (typeof window !== "undefined") {
        localStorage.setItem("evo_sports_last_activity", Date.now().toString())
      }

      // Successful login, redirect to dashboard
      window.location.href = "/dashboard"
    } catch {
      setError(
        language === "FR"
          ? "Une erreur est survenue lors de la connexion."
          : language === "EN"
          ? "An error occurred during login."
          : "حدث خطأ أثناء تسجيل الدخول."
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8">
        {/* Header/Logo */}
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 group mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="EVO SPORTS Logo" 
              className="h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105" 
            />
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white text-center">
            {t("login_title")}
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 text-center">
            {t("login_subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-100/20 dark:bg-emerald-950/10 p-8 shadow-xl backdrop-blur-md text-emerald-950 dark:text-emerald-50">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-emerald-900 dark:text-emerald-300">
                {t("login_email")}
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nom@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-emerald-800 dark:bg-white dark:text-zinc-900 dark:focus:border-emerald-400 dark:focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  {t("login_password")}
                </label>
                <div className="text-sm">
                  <a href="#" className="font-semibold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">
                    {language === "FR" ? "Mot de passe oublié ?" : language === "EN" ? "Forgot password?" : "هل نسيت كلمة المرور؟"}
                  </a>
                </div>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-emerald-800 dark:bg-white dark:text-zinc-900 dark:focus:border-emerald-400 dark:focus:bg-white"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-4 py-3 text-sm font-black uppercase tracking-wider shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  language === "FR" ? "Connexion..." : language === "EN" ? "Signing In..." : "جاري الدخول..."
                ) : (
                  t("login_btn")
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-emerald-450/20 dark:border-emerald-800/30" />
            <span className="absolute bg-[#def7ec] px-3 text-xs font-bold text-emerald-900/80 dark:bg-[#06241b] dark:text-emerald-300/80 rounded-full">
              {t("login_or")}
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => {
              import("next-auth/react").then((mod) => {
                mod.signIn("google", { callbackUrl: "/dashboard" })
              })
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-emerald-400/20 bg-white/70 hover:bg-white dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-950 dark:text-emerald-50 px-4 py-3 text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {language === "FR"
                ? "Se connecter avec Google"
                : language === "EN"
                ? "Sign in with Google"
                : "تسجيل الدخول بواسطة Google"}
            </span>
          </button>

          <div className="mt-6 text-center text-sm">
            <span className="text-emerald-850/80 dark:text-emerald-400/80">{t("login_no_account")} </span>
            <Link href="/register" className="font-bold text-emerald-700 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">
              {t("login_register")}
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors duration-200">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {language === "FR" ? "Retour à l'accueil" : language === "EN" ? "Back to Home" : "العودة للرئيسية"}
          </Link>
        </div>
      </div>
    </div>
  )
}
