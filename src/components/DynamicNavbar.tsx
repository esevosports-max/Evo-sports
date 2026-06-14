"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/components/LanguageProvider"


export default function DynamicNavbar({ 
  isAuthenticated = false,
  user
}: { 
  isAuthenticated?: boolean
  user?: {
    name?: string | null
    email?: string | null
    role?: {
      name: string
      permissions: string[]
    }
  } | null
}) {
  const pathname = usePathname()
  const { language, setLanguage, t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
      setLangMenuOpen(false)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: t("nav_home"), href: "/" },
    { name: t("nav_about"), href: "/about" },
    { name: t("nav_pricing"), href: "/pricing" },
    ...(isAuthenticated ? [{ name: t("nav_dashboard"), href: "/dashboard" }] : []),
  ]

  const isActive = (path: string) => pathname === path

  return (
    <div className="sticky top-0 z-50 w-full transition-all duration-500 ease-out py-3">
      {isScrolled ? (
        /* State B: Dynamic Island capsule (midnight blue transparent, rounded) */
        <div className="mx-auto max-w-[380px] rounded-full bg-[#0B1528]/65 px-4 py-2 text-white shadow-xl backdrop-blur-lg border border-white/10 scale-95 transition-all duration-500 ease-out flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group py-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="EVO SPORTS" 
                className="h-6 w-auto object-contain" 
              />
            </Link>
          </div>
 
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center justify-center p-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition-all text-white/90 cursor-pointer"
                aria-label="Language Selector"
              >
                <svg className="h-3.5 w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.64-.78-8.006-2.141m15.686 0A11.95 11.95 0 0012 13.5c-2.905 0-5.64-.78-8.006-2.141" />
                </svg>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#0B1528]/85 border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-xl">
                  <button 
                    onClick={() => { setLanguage('FR'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === 'FR' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>Français</span>
                    <span>🇫🇷</span>
                  </button>
                  <button 
                    onClick={() => { setLanguage('EN'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === 'EN' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>English</span>
                    <span>🇬🇧</span>
                  </button>
                  <button 
                    onClick={() => { setLanguage('AR'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${language === 'AR' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>العربية</span>
                    <span>🇸🇦</span>
                  </button>
                </div>
              )}
            </div>

            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95"
                >
                  {t("nav_login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1.5 text-[10px] font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                >
                  {t("nav_join")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95"
                >
                  {t("nav_dashboard")}
                </Link>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-1.5 rounded-full text-white bg-emerald-500 hover:bg-emerald-400 hover:scale-105 transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  aria-label={t("nav_menu")}
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* State A: Floating Rounded Midnight Blue Transparent Banner */
        <div className="mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-2xl bg-[#0B1528]/65 border border-white/10 text-white backdrop-blur-lg px-8 py-3.5 transition-all duration-500 ease-out flex items-center justify-between shadow-2xl">
          {/* Logo & Language Selector */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="EVO SPORTS" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" 
              />
            </Link>
 
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all text-[11px] font-bold text-white/90"
              >
                <svg className="h-3.5 w-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.64-.78-8.006-2.141m15.686 0A11.95 11.95 0 0012 13.5c-2.905 0-5.64-.78-8.006-2.141" />
                </svg>
                 <span>{language}</span>
                <svg className={`h-3 w-3 transition-transform text-white/60 ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {langMenuOpen && (
                <div className="absolute left-0 mt-2 w-32 rounded-xl bg-[#0B1528]/85 border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-xl">
                  <button 
                    onClick={() => { setLanguage('FR'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'FR' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>Français</span>
                    <span>🇫🇷</span>
                  </button>
                  <button 
                    onClick={() => { setLanguage('EN'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'EN' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>English</span>
                    <span>🇬🇧</span>
                  </button>
                  <button 
                    onClick={() => { setLanguage('AR'); setLangMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === 'AR' ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span>العربية</span>
                    <span>🇸🇦</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-bold transition-all duration-200 hover:text-emerald-400 relative py-1 ${
                  isActive(link.href)
                    ? "text-emerald-400 font-extrabold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions + Hamburger */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white px-4 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95"
                >
                  {t("nav_login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white border border-emerald-400/20 px-4 py-2 text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/25 transition-all active:scale-95"
                >
                  {t("nav_join")}
                </Link>
              </>
            ) : (
              /* Hamburger button */
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all border border-white/15 cursor-pointer flex items-center justify-center animate-fade-in"
                aria-label={t("nav_menu")}
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Hamburger Menu Drawer */}
      {drawerOpen && isAuthenticated && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setDrawerOpen(false)} />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-xs h-full bg-white shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out border-l border-zinc-200/80">
            <div>
              {/* Header with close button */}
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <span className="bg-gradient-to-r from-zinc-900 to-zinc-650 bg-clip-text text-xs font-black uppercase tracking-widest text-transparent">
                  EVO SPORTS
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links (top) */}
              <nav className="mt-6 flex-1 overflow-y-auto pr-1 space-y-4 max-h-[calc(100vh-190px)] custom-scrollbar">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t("nav_public")}</p>
                  <div className="space-y-1.5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                          isActive(link.href)
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        }`}
                      >
                        <span>🧭</span> {link.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{t("nav_private")}</p>
                  <div className="space-y-1">
                    {(() => {
                      const userRole = user?.role?.name || ""
                      const isManager = userRole === "MANAGER_EVO_SPORTS"
                      const linksToRender = isManager
                        ? [
                            { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠" },
                            { href: "/dashboard/planning", label: t("db_general_planning"), icon: "📅" },
                            { href: "/dashboard/roles", label: t("db_roles_permissions"), icon: "🔑" },
                            { href: "/dashboard/manager/demandes", label: t("db_reg_requests"), icon: "📥" },
                            { href: "/dashboard/manager/clubs", label: t("db_clubs_mgmt"), icon: "🛡️" },
                            { href: "/dashboard/manager/paiements", label: t("db_clubs_payments"), icon: "💳" },
                          ]
                        : [
                            { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠" },
                            { href: "/dashboard/planning", label: t("feat_planning_title"), icon: "📅" },
                            { href: "/dashboard/messagerie", label: t("feat_messaging_title"), icon: "💬" },
                            { href: "/dashboard/sondage", label: t("feat_polls_title"), icon: "📊" },
                            { href: "/dashboard/equipe", label: t("feat_structure_title"), icon: "🛡️" },
                            { href: "/dashboard/staff", label: t("feat_staff_title"), icon: "💼", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MANAGER_EVO_SPORTS"] },
                            { href: "/dashboard/effectifs", label: t("feat_players_title"), icon: "⚽" },
                            { href: "/dashboard/composition", label: t("feat_composition_title"), icon: "📋", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                            { href: "/dashboard/entrainement", label: t("feat_trainings_title"), icon: "🏃‍♂️", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                            { href: "/dashboard/match", label: t("feat_matches_title"), icon: "📅", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                            { href: "/dashboard/medical/blessures", label: t("feat_injuries_title"), icon: "🩹", requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE"] },
                            { href: "/dashboard/medical/dossier-medical", label: t("feat_medical_title"), icon: "📁", requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"] },
                            { href: "/dashboard/test", label: t("feat_tests_title"), icon: "🧪", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                            { href: "/dashboard/quotidienne", label: t("feat_welfare_title"), icon: "📝", requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                          ]

                      return linksToRender
                        .filter((item) => !item.requiredRoles || item.requiredRoles.includes(userRole))
                        .map((item) => {
                          const active = pathname === item.href

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setDrawerOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                                active
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/10"
                                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{item.icon}</span> {item.label}
                              </span>
                            </Link>
                          )
                        })
                    })()}
                  </div>
                </div>
              </nav>
            </div>

            {/* Bottom Actions (Account Settings & Logout in Red) */}
            <div className="space-y-3 pt-6 border-t border-zinc-150/80">
              {/* Account Settings */}
              <Link
                href="/dashboard"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-all font-semibold"
              >
                <span>⚙️</span> {t("nav_settings")}
              </Link>

              {/* Logout Button (in beautiful crimson red) */}
              <button
                onClick={async () => {
                  setDrawerOpen(false)
                  await signOut({ callbackUrl: "/login" })
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 transition-all border border-red-100 cursor-pointer font-semibold"
              >
                <span>🚪</span> {t("nav_logout_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
