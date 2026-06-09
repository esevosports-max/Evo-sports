"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Language, translations } from "@/lib/translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("FR")
  const [mounted, setMounted] = useState(false)

  // Load language from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang") as Language
      if (stored && (stored === "FR" || stored === "EN" || stored === "AR")) {
        setLanguageState(stored)
        // Update document attributes
        document.documentElement.dir = stored === "AR" ? "rtl" : "ltr"
        document.documentElement.lang = stored.toLowerCase()
      }
      setMounted(true)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", lang)
      document.documentElement.dir = lang === "AR" ? "rtl" : "ltr"
      document.documentElement.lang = lang.toLowerCase()
    }
  }

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["FR"]?.[key] || key
  }

  // Prevent flash or hydration mismatch by providing FR as default but dynamically updating on mount
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
