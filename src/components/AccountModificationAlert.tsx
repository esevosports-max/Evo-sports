"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/LanguageProvider"

interface AccountModificationAlertProps {
  logId: string
  operatorName: string
  date: string
  fields: string | null
}

export default function AccountModificationAlert({ logId, operatorName, date, fields }: AccountModificationAlertProps) {
  const { language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  const storageKey = `dismissed_mod_${logId}`

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(storageKey)
      if (!dismissed) {
        setIsVisible(true)
      }
    }
  }, [storageKey])

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true")
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  const formattedDate = new Date(date).toLocaleString(
    language === "FR" ? "fr-FR" : "en-US",
    { dateStyle: "short", timeStyle: "short" }
  )

  const isRtl = language === "AR"

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)] animate-fade-in flex items-center justify-between"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Glow effect */}
      <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-amber-500/5 blur-xl" />
      
      <div className="flex items-center gap-3 relative z-10">
        <span className="text-lg">⚙️</span>
        <div className="text-xs font-bold leading-relaxed">
          {language === "FR" ? (
            <span>
              Votre compte a été modifié par <strong className="text-amber-250 font-black">{operatorName}</strong> le {formattedDate}. {fields ? `[Changements: ${fields}]` : ""}
            </span>
          ) : language === "EN" ? (
            <span>
              Your account details were updated by <strong className="text-amber-250 font-black">{operatorName}</strong> on {formattedDate}. {fields ? `[Changes: ${fields}]` : ""}
            </span>
          ) : (
            <span>
              تم تعديل بيانات حسابك بواسطة <strong className="text-amber-250 font-black">{operatorName}</strong> بتاريخ {formattedDate}. {fields ? `[التغييرات: ${fields}]` : ""}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="text-xs font-black text-amber-450 hover:text-white transition-colors cursor-pointer relative z-10 px-2 py-1 rounded-lg hover:bg-amber-500/10"
        aria-label="Dismiss Alert"
      >
        ✕
      </button>
    </div>
  )
}
