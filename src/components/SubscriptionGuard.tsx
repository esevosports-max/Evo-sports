"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { signOut } from "next-auth/react"

interface SubscriptionGuardProps {
  isRestricted: boolean
  roleName: string
  clubName: string
}

const blockDict = {
  FR: {
    title: "Accès Restreint",
    desc: "Le compte de votre club « {clubName} » est actuellement bloqué ou son abonnement a expiré. L'accès à l'application est suspendu.",
    contact: "Veuillez contacter le président de votre club ou l'administration d'EVO SPORTS pour régulariser la situation.",
    logout: "Se déconnecter"
  },
  EN: {
    title: "Access Restricted",
    desc: "Your club \"{clubName}\" is currently blocked or its subscription has expired. Access to the application is suspended.",
    contact: "Please contact your club president or the EVO SPORTS administrator to resolve this issue.",
    logout: "Sign Out"
  },
  AR: {
    title: "تم تقييد الدخول",
    desc: "حساب ناديك « {clubName} » محظور حالياً أو اشتراكه منتهي الصلاحية. تم تعليق صلاحية استخدام التطبيق.",
    contact: "يرجى الاتصال برئيس النادي أو بإدارة EVO SPORTS لتسوية الوضع.",
    logout: "تسجيل الخروج"
  }
}

export default function SubscriptionGuard({ isRestricted, roleName, clubName }: SubscriptionGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { language } = useLanguage()
  const tLoc = blockDict[language] || blockDict["FR"]

  const isPresident = roleName === "PRESIDENT"
  const isManager = roleName === "MANAGER_EVO_SPORTS"

  useEffect(() => {
    // Only redirect President to payment page
    if (isRestricted && isPresident && pathname !== "/dashboard/paiement") {
      router.replace("/dashboard/paiement")
    }
  }, [isRestricted, isPresident, pathname, router])

  // If restricted and NOT President/Manager, block screen with stunning overlay
  if (isRestricted && !isPresident && !isManager) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-red-500/20 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle light effect */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 animate-pulse">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-wider text-red-500">
              {tLoc.title}
            </h2>
            <p className="text-xs text-zinc-350 font-semibold leading-relaxed">
              {tLoc.desc.replace("{clubName}", clubName)}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
              {tLoc.contact}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-red-600/20 transition-all active:scale-95 cursor-pointer"
            >
              🚪 {tLoc.logout}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
