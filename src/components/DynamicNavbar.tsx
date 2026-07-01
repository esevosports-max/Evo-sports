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
        <div className="mx-auto w-[calc(100%-2rem)] max-w-[380px] rounded-full bg-[#0B1528]/45 px-4 py-2 text-white shadow-xl backdrop-blur-lg border border-white/10 scale-95 transition-all duration-500 ease-out flex items-center justify-between">
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
              <div className="hidden md:flex items-center gap-2">
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
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
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
              </div>
            )}

            {/* Mobile Hamburger (visible on all mobile viewports) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 rounded-full text-white bg-emerald-500 hover:bg-emerald-400 hover:scale-105 transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-emerald-500/20"
                aria-label={t("nav_menu")}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* State A: Floating Rounded Midnight Blue Transparent Banner */
        <div className="mx-auto w-[calc(100%-2rem)] max-w-7xl rounded-2xl bg-[#0B1528]/45 border border-white/10 text-white backdrop-blur-lg px-8 py-3.5 transition-all duration-500 ease-out flex items-center justify-between shadow-2xl">
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
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
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
              <div className="hidden md:flex items-center gap-4">
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
              </div>
            ) : (
              <div className="hidden md:flex items-center">
                {/* Hamburger button (for authenticated users on desktop) */}
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all border border-white/15 cursor-pointer flex items-center justify-center animate-fade-in"
                  aria-label={t("nav_menu")}
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </button>
              </div>
            )}

            {/* Mobile Hamburger (visible only on mobile) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-xl text-white/90 hover:bg-white/10 hover:text-white transition-all border border-white/15 cursor-pointer flex items-center justify-center animate-fade-in"
                aria-label={t("nav_menu")}
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
           {/* Sidebar Hamburger Menu Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setDrawerOpen(false)} />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-xs h-full bg-[#0B1528]/95 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out border-l border-white/10 text-white">
            <div>
              {/* Header with close button */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center">
                  <img src="/logo.png" alt="EVO SPORTS" className="h-8 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
  
              {/* Navigation Links (top) */}
              <nav className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4 max-h-[calc(100vh-320px)] custom-scrollbar">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Navigation Publique</p>
                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                          isActive(link.href)
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                            : "text-white/70 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
 
                {isAuthenticated && (
                  <>
                    <hr className="border-white/10 my-4" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Espace Club Privé</p>
                      <div className="space-y-1">
                        {(() => {
                          const userRole = user?.role?.name || ""
                          const isManager = userRole === "MANAGER_EVO_SPORTS"
                          const linksToRender = isManager
                            ? [
                                { href: "/dashboard", label: t("nav_dashboard") },
                                { href: "/dashboard/planning", label: t("db_general_planning") },
                                { href: "/dashboard/roles", label: t("db_roles_permissions") },
                                { href: "/dashboard/manager/demandes", label: t("db_reg_requests") },
                                { href: "/dashboard/manager/clubs", label: t("db_clubs_mgmt") },
                                { href: "/dashboard/manager/paiements", label: t("db_clubs_payments") },
                                { href: "/dashboard/manager/forfaits", label: language === "EN" ? "Subscription Plans" : language === "AR" ? "إدارة الاشتراكات" : "Gestion des Forfaits" },
                                { href: "/dashboard/manager/comptes-supprimes", label: language === "EN" ? "Deleted Accounts" : language === "AR" ? "الحسابات المحذوفة" : "Comptes Supprimés" },
                              ]
                            : [
                                { href: "/dashboard", label: t("nav_dashboard") },
                                { href: "/dashboard/roles", label: t("db_roles_permissions"), requiredRoles: ["PRESIDENT"] },
                                { href: "/dashboard/planning", label: t("feat_planning_title") },
                                { href: "/dashboard/messagerie", label: t("feat_messaging_title") },
                                { href: "/dashboard/sondage", label: t("feat_polls_title") },
                                { href: "/dashboard/equipe", label: t("feat_structure_title") },
                                { href: "/dashboard/staff", label: t("feat_staff_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/effectifs", label: t("feat_players_title") },
                                { href: "/dashboard/composition", label: t("feat_composition_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/entrainement", label: t("feat_trainings_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/match", label: t("feat_matches_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/medical/blessures", label: t("feat_injuries_title"), requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR"] },
                                { href: "/dashboard/medical/dossier-medical", label: t("feat_medical_title"), requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"] },
                                { href: "/dashboard/test", label: t("feat_tests_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/gps", label: t("feat_gps_title"), requiredRoles: ["PRESIDENT", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "MANAGER_EVO_SPORTS"] },
                                { href: "/dashboard/quotidienne", label: t("feat_welfare_title"), requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR", "MANAGER_EVO_SPORTS"] },
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
                                  className={`flex items-center px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                    active
                                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
                                      : "text-white/70 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  {item.label}
                                </Link>
                              )
                            })
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </nav>
            </div>
 
            {/* Bottom Actions: Espace Système */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Espace Système</p>
              
              {isAuthenticated ? (
                <>
                  {/* User Profile Info */}
                  {user && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-left w-full">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm uppercase tracking-wider bg-white text-zinc-900 shrink-0">
                        {(user.name || "U").substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate">{user.name || "—"}</p>
                        <p className="text-[10px] text-white/60 truncate font-semibold mt-0.5">{user.email || "—"}</p>
                        {user.role?.name && (
                          <span className="inline-flex rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/10">
                            {user.role.name.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
 
                  {/* Logout Button (in red background, white text, no icons) */}
                  <button
                    onClick={async () => {
                      setDrawerOpen(false)
                      await signOut({ callbackUrl: "/login" })
                    }}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-655 hover:bg-red-500 text-white transition-all border border-red-550 cursor-pointer font-semibold"
                  >
                    {t("nav_logout_btn")}
                  </button>
                </>
              ) : (
                <>
                  {/* Connect buttons for unauthenticated visitors */}
                  <Link
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-450 text-white shadow-md shadow-emerald-500/25 transition-all border border-emerald-400/20 cursor-pointer font-semibold"
                  >
                    {t("nav_login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setDrawerOpen(false)}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white transition-all border border-white/10 cursor-pointer font-semibold"
                  >
                    {t("nav_join")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
