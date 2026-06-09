"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/LanguageProvider"

interface RequestDetails {
  status: string
  clubName: string
  stadiumName: string
  address: string
  creationDate: string
  rejectionReason?: string
}

export default function WaitingValidation() {
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null)

  useEffect(() => {
    async function getRequest() {
      try {
        const res = await fetch("/api/club-request")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setRequestDetails(data)
            if (data.status === "APPROVED") {
              window.location.href = "/dashboard"
            }
          }
        }
      } catch (err) {
        console.error("Error fetching request details:", err)
      }
    }
    getRequest()
  }, [])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { signOut } = await import("next-auth/react")
      await signOut({ callbackUrl: "/login" })
    } catch (err) {
      console.error("Signout error:", err)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 transition-colors duration-300">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="w-full max-w-xl space-y-8 text-center">
        
        {/* Logo and SVG */}
        <div className="flex flex-col items-center space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="EVO SPORTS Logo" className="h-16 w-auto object-contain" />
          
          <div className="relative flex items-center justify-center">
            {/* Spinning pulse rings */}
            <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-amber-400/20 opacity-75" />
            <span className="absolute inline-flex h-32 w-32 animate-pulse rounded-full bg-emerald-400/5 opacity-40" />
            
            <div className="relative rounded-full bg-amber-500/10 dark:bg-amber-500/20 p-6 border border-amber-500/30">
              <svg className="h-12 w-12 text-amber-600 dark:text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Message Card */}
        {requestDetails?.status === "REJECTED" ? (
          <div className="rounded-2xl border border-red-200/50 bg-red-100/10 dark:border-red-800/40 dark:bg-red-950/5 p-8 shadow-xl backdrop-blur-md space-y-6 text-zinc-800 dark:text-zinc-100">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-red-650 dark:text-red-400">
                {t("wait_refused")}
              </h2>
              <p className="text-base font-bold text-zinc-500">
                {t("wait_refused_sub")}
              </p>
            </div>

            <div className="h-px bg-zinc-200/50 dark:bg-zinc-800/50 w-full" />

            <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/10 p-4 rounded-xl text-left space-y-1">
              <span className="font-black text-red-650 dark:text-red-400 uppercase text-[9px] tracking-wider block">
                {t("wait_refused_reason")}
              </span>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {requestDetails.rejectionReason || "Aucun motif spécifié."}
              </p>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {t("wait_refused_desc")}
            </p>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { window.location.href = "/complete-registration" }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white font-black uppercase text-xs tracking-wider shadow-md hover:from-emerald-400 hover:to-teal-500 transition-all active:scale-95 duration-150 cursor-pointer"
              >
                {t("wait_correct")}
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-xs tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 duration-150 cursor-pointer"
              >
                {loading ? (
                  language === "FR" ? "Déconnexion..." : language === "EN" ? "Signing Out..." : "جاري تسجيل الخروج..."
                ) : (
                  t("nav_logout_btn")
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200/50 bg-amber-100/10 dark:border-amber-800/40 dark:bg-amber-950/5 p-8 shadow-xl backdrop-blur-md space-y-6 text-zinc-800 dark:text-zinc-100">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
                {t("wait_submitted")}
              </h2>
              <p className="text-base font-bold text-amber-700 dark:text-amber-400">
                {t("wait_pending")}
              </p>
            </div>

            <div className="h-px bg-zinc-200/50 dark:bg-zinc-800/50 w-full" />

            {requestDetails && (
              <div className="text-left text-xs space-y-2 text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 rounded-xl">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "FR" ? "Club :" : language === "EN" ? "Club:" : "النادي:"}
                  </span>{" "}
                  {requestDetails.clubName}
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "FR" ? "Stade :" : language === "EN" ? "Stadium:" : "الملعب:"}
                  </span>{" "}
                  {requestDetails.stadiumName}
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "FR" ? "Adresse :" : language === "EN" ? "Address:" : "العنوان:"}
                  </span>{" "}
                  {requestDetails.address}
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "FR" ? "Date de création :" : language === "EN" ? "Creation date:" : "تاريخ التأسيس:"}
                  </span>{" "}
                  {new Date(requestDetails.creationDate).toLocaleDateString(
                    language === "FR" ? "fr-FR" : language === "EN" ? "en-US" : "ar-EG"
                  )}
                </div>
                <div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {language === "FR" ? "Statut :" : language === "EN" ? "Status:" : "الحالة:"}
                  </span>{" "}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-amber-500/10 text-amber-600 uppercase">
                    {requestDetails.status}
                  </span>
                </div>
              </div>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {t("wait_desc")}
            </p>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { window.location.href = "/" }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 font-black uppercase text-xs tracking-wider shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all active:scale-95 duration-150 cursor-pointer"
              >
                {t("wait_later")}
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black uppercase text-xs tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 duration-150 cursor-pointer"
              >
                {loading ? (
                  language === "FR" ? "Déconnexion..." : language === "EN" ? "Signing Out..." : "جاري تسجيل الخروج..."
                ) : (
                  t("nav_logout_btn")
                )}
              </button>
            </div>
          </div>
        )}

        {/* Support Link */}
        <p className="text-[11px] text-zinc-400">
          {t("wait_support")}{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer">
            support@evosports.com
          </span>
        </p>

      </div>
    </div>
  )
}
