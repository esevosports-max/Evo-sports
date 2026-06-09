"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/components/LanguageProvider"

interface SessionTimeoutListenerProps {
  isAuthenticated: boolean
}

// 30 minutes = 1800000 ms, warning at 28 minutes = 1680000 ms (120 seconds countdown)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000 
const WARNING_TIMEOUT = 28 * 60 * 1000    
const ACTIVITY_KEY = "evo_sports_last_activity"

export default function SessionTimeoutListener({ isAuthenticated }: SessionTimeoutListenerProps) {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(120)
  const { t } = useLanguage()

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false)
      return
    }

    // Reset activity timestamp to current time to avoid stale inactivity loops
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString())

    const handleLogout = async () => {
      try {
        await signOut({ callbackUrl: "/login?reason=inactivity" })
      } catch (error) {
        console.error("Failed to sign out due to inactivity:", error)
      }
    }

    const resetActivity = () => {
      localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
      setShowWarning(false)
    }

    // Check activity state every second
    const interval = setInterval(() => {
      const lastActivityStr = localStorage.getItem(ACTIVITY_KEY)
      if (!lastActivityStr) {
        localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
        return
      }

      const lastActivity = parseInt(lastActivityStr, 10)
      const elapsed = Date.now() - lastActivity

      if (elapsed >= INACTIVITY_TIMEOUT) {
        clearInterval(interval)
        handleLogout()
      } else if (elapsed >= WARNING_TIMEOUT) {
        setShowWarning(true)
        const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT - elapsed) / 1000))
        setCountdown(remaining)
      } else {
        setShowWarning(false)
      }
    }, 1000)

    // Listen to user activity events
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    
    // Throttle activity updates to once every 2 seconds to avoid excessive localStorage writes
    let lastWrite = 0
    const throttledReset = () => {
      const now = Date.now()
      if (now - lastWrite > 2000) {
        resetActivity()
        lastWrite = now
      }
    }

    events.forEach((event) => {
      window.addEventListener(event, throttledReset)
    })

    return () => {
      clearInterval(interval)
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset)
      })
    }
  }, [isAuthenticated])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0B1528]/95 border border-white/10 p-6 text-white shadow-2xl text-center space-y-6">
        {/* Clock/Warning Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase tracking-wider text-amber-400">
            {t("timeout_title")}
          </h3>
          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
            {t("timeout_desc").replace("{countdown}", countdown.toString())}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              localStorage.setItem(ACTIVITY_KEY, Date.now().toString())
              setShowWarning(false)
            }}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-white px-4 py-2.5 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
          >
            {t("timeout_stay")}
          </button>
          
          <button
            onClick={async () => {
              setShowWarning(false)
              try {
                await signOut({ callbackUrl: "/login" })
              } catch (e) {
                console.error(e)
              }
            }}
            className="w-full text-xs text-zinc-400 hover:text-white transition-all underline cursor-pointer py-2"
          >
            {t("timeout_logout")}
          </button>
        </div>
      </div>
    </div>
  )
}
