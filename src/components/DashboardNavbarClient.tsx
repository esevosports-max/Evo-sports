"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/LanguageProvider"
import { getNotificationsAction, markAsReadAction, markAllAsReadAction, deleteNotificationAction } from "@/app/dashboard/notifications/actions"

interface NavbarProps {
  user: {
    name: string
    email: string
    roleLabel: string
    roleGradient: string
    roleName: string
  }
  club: {
    name: string
    logo: string | null
    hasDashboard?: boolean
    hasPayment?: boolean
    hasPlanning?: boolean
    hasMessaging?: boolean
    hasPolls?: boolean
    hasStructure?: boolean
    hasStaff?: boolean
    hasPlayers?: boolean
    hasTactical?: boolean
    hasTrainings?: boolean
    hasMatches?: boolean
    hasInjuries?: boolean
    hasMedical?: boolean
    hasTests?: boolean
    hasWelfare?: boolean
    hasGPS?: boolean
    hasRbac?: boolean
    hasSupport?: boolean
  }
  isRestricted?: boolean
  signOutAction: () => Promise<void>
}

export default function DashboardNavbarClient({ user, club, isRestricted = false, signOutAction }: NavbarProps) {
  const pathname = usePathname()
  const { t, language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const [notifMenuOpen, setNotifMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = async () => {
    try {
      const res = await getNotificationsAction()
      if (res.success && res.notifications) {
        setNotifications(res.notifications)
        setUnreadCount(res.notifications.filter((n: any) => !n.read).length)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markAsReadAction(id)
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await markAllAsReadAction()
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await deleteNotificationAction(id)
      if (res.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setUnreadCount((prev) => {
          const wasUnread = notifications.find((n) => n.id === id && !n.read)
          return wasUnread ? Math.max(0, prev - 1) : prev
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 10000)
    return () => clearInterval(interval)
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
      setLangMenuOpen(false)
      setNotifMenuOpen(false)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  const isManager = user.roleName === "MANAGER_EVO_SPORTS"
  const isPlayer = user.roleName === "JOUEUR"

  // Roster of pages with their routes, labels, and roles allowed
  const menuItems = isManager
    ? [
        { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠", description: t("desc_dashboard") },
        { href: "/dashboard/planning", label: t("db_general_planning"), icon: "📅", description: t("desc_planning_gen") },
        { href: "/dashboard/manager/annonces", label: t("db_announcements"), icon: "📢", description: t("desc_announcements") },
        { href: "/dashboard/manager/forfaits", label: language === "EN" ? "Subscription Plans" : language === "AR" ? "إدارة الاشتراكات" : "Gestion des Forfaits", icon: "💎", description: language === "EN" ? "Configure platform plans, pricing and options" : language === "AR" ? "إعداد الباقات والأسعار والخيارات" : "Configurer les forfaits, prix et options" },
        { href: "/dashboard/roles", label: t("db_roles_permissions"), icon: "🔑", description: t("desc_roles") },
        { href: "/dashboard/manager/demandes", label: t("db_reg_requests"), icon: "📥", description: t("desc_requests") },
        { href: "/dashboard/manager/clubs", label: t("db_clubs_mgmt"), icon: "🛡️", description: t("desc_clubs") },
        { href: "/dashboard/manager/paiements", label: t("db_clubs_payments"), icon: "💳", description: t("desc_payments") },
        { href: "/dashboard/manager/comptes-supprimes", label: language === "EN" ? "Deleted Accounts" : language === "AR" ? "الحسابات المحذوفة" : "Comptes Supprimés", icon: "🗑️", description: language === "EN" ? "Restore or purge deleted user accounts" : language === "AR" ? "استعادة أو مسح حسابات المستخدمين محذوفة" : "Restaurer ou purger des comptes utilisateurs supprimés" },
      ]
    : isPlayer
    ? [
        { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠", description: t("desc_dashboard") },
        { href: "/dashboard/messagerie", label: t("feat_messaging_title"), icon: "💬", description: t("desc_messaging"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/sondage", label: t("feat_polls_title"), icon: "📊", description: t("desc_polls"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/planning", label: t("feat_planning_title"), icon: "📅", description: t("desc_planning_gen"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/quotidienne", label: t("feat_welfare_title"), icon: "📝", description: t("desc_welfare"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/test", label: t("feat_tests_title"), icon: "🧪", description: t("desc_tests"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/medical/dossier-medical", label: t("feat_medical_title"), icon: "📁", description: t("desc_medical"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/medical/blessures", label: t("feat_injuries_title"), icon: "🩹", description: t("desc_injuries"), requiredRoles: ["JOUEUR"] },
        { href: "/dashboard/effectifs", label: language === "FR" ? "Mes Stats" : language === "AR" ? "إحصائياتي" : "My Stats", icon: "⚽", description: "Visualiser mes statistiques et indices physiques", requiredRoles: ["JOUEUR"] },
      ]
    : [
        { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠", description: t("desc_dashboard") },
        { 
          href: "/dashboard/paiement", 
          label: t("db_subscription_payment"), 
          icon: "💳", 
          description: t("desc_subscription"),
          requiredRoles: ["PRESIDENT"]
        },
        { 
          href: "/dashboard/roles", 
          label: t("db_roles_permissions"), 
          icon: "🔑", 
          description: t("desc_roles"),
          requiredRoles: ["PRESIDENT"]
        },
        { href: "/dashboard/planning", label: t("feat_planning_title"), icon: "📅", description: t("desc_planning_gen") },
        { href: "/dashboard/messagerie", label: t("feat_messaging_title"), icon: "💬", description: t("desc_messaging") },
        { href: "/dashboard/sondage", label: t("feat_polls_title"), icon: "📊", description: t("desc_polls") },
        { href: "/dashboard/equipe", label: t("feat_structure_title"), icon: "🛡️", description: t("desc_structure") },
        { 
          href: "/dashboard/staff", 
          label: t("feat_staff_title"), 
          icon: "💼", 
          description: t("desc_staff"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "MANAGER_EVO_SPORTS"] 
        },
        { href: "/dashboard/effectifs", label: t("feat_players_title"), icon: "⚽", description: t("desc_players") },
        { 
          href: "/dashboard/composition", 
          label: t("feat_composition_title"), 
          icon: "📋", 
          description: t("desc_composition"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/entrainement", 
          label: t("feat_trainings_title"), 
          icon: "🏃‍♂️", 
          description: t("desc_trainings"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/match", 
          label: t("feat_matches_title"), 
          icon: "📅", 
          description: t("desc_matches"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/medical/blessures", 
          label: t("feat_injuries_title"), 
          icon: "🩹", 
          description: t("desc_injuries"),
          requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR"] 
        },
        { 
          href: "/dashboard/medical/dossier-medical", 
          label: t("feat_medical_title"), 
          icon: "📁", 
          description: t("desc_medical"),
          requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"] 
        },
        { 
          href: "/dashboard/test", 
          label: t("feat_tests_title"), 
          icon: "🧪", 
          description: t("desc_tests"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/gps", 
          label: t("feat_gps_title"), 
          icon: "🛰️", 
          description: t("feat_gps_desc"),
          requiredRoles: ["PRESIDENT", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/quotidienne", 
          label: t("feat_welfare_title"), 
          icon: "📝", 
          description: t("desc_welfare"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
        { 
          href: "/dashboard/presence", 
          label: language === "EN" ? "Attendance" : language === "AR" ? "الغياب والحضور" : "Présences", 
          icon: "📊", 
          description: language === "EN" ? "Track player attendance and absence rates" : language === "AR" ? "متابعة حضور وغياب اللاعبين" : "Suivre la présence des joueurs",
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "ENTRAINEUR_GARDIENS", "JOUEUR", "MEDECIN", "MANAGER_EVO_SPORTS"]
        },
      ]

  const isFeatureEnabled = (href: string) => {
    if (isManager || user.roleName === "PRESIDENT") return true

    if (href === "/dashboard") {
      return club.hasDashboard !== false
    }
    if (href === "/dashboard/paiement") {
      return club.hasPayment !== false
    }
    if (href === "/dashboard/planning") {
      return club.hasPlanning !== false
    }
    if (href === "/dashboard/messagerie") {
      return club.hasMessaging !== false
    }
    if (href === "/dashboard/sondage") {
      return club.hasPolls !== false
    }
    if (href === "/dashboard/equipe") {
      return club.hasStructure !== false
    }
    if (href === "/dashboard/staff") {
      return club.hasStaff !== false
    }
    if (href === "/dashboard/effectifs") {
      return club.hasPlayers !== false
    }
    if (href === "/dashboard/composition") {
      return club.hasTactical !== false
    }
    if (href === "/dashboard/entrainement") {
      return club.hasTrainings !== false
    }
    if (href === "/dashboard/match") {
      return club.hasMatches !== false
    }
    if (href === "/dashboard/medical/blessures") {
      return club.hasInjuries !== false
    }
    if (href === "/dashboard/medical/dossier-medical") {
      return club.hasMedical !== false
    }
    if (href === "/dashboard/test") {
      return club.hasTests !== false
    }
    if (href === "/dashboard/quotidienne") {
      return club.hasWelfare !== false
    }
    if (href === "/dashboard/gps") {
      return club.hasGPS === true
    }
    return true
  }

  const isRoleAuthorized = (allowed?: string[]) => {
    if (!allowed) return true
    return allowed.includes(user.roleName)
  }

  const allowedMenuItems = menuItems.filter(item => {
    if (!isRoleAuthorized(item.requiredRoles)) return false
    return isFeatureEnabled(item.href)
  })

  const visibleMenuItems = (isRestricted && user.roleName === "PRESIDENT")
    ? allowedMenuItems.filter(item => item.href === "/dashboard/paiement")
    : allowedMenuItems

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <div className={`
      z-50 transition-all duration-500 ease-out
      ${isScrolled 
        ? "fixed top-4 left-1/2 -translate-x-1/2 max-w-[360px] sm:max-w-[420px] w-[calc(100%-2rem)] rounded-full bg-[#0B1528]/85 border border-white/10 shadow-2xl backdrop-blur-lg px-4 py-2 scale-95" 
        : "w-full sticky top-0 bg-[#0B1528]/95 border-b border-white/10 shadow-lg px-4 sm:px-6 lg:px-8"
      }
    `}>
      <div className={isScrolled ? "" : "max-w-7xl mx-auto"}>
        <div className={`flex items-center justify-between ${isScrolled ? "h-10 sm:h-12" : "h-16 sm:h-20"}`}>
          
          {/* Left Side: Logo & Club Name / Dashboard Title */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="EVO SPORTS" 
              className={`object-contain transition-all duration-300 ${
                isScrolled ? "h-6 w-auto" : "h-10 sm:h-12 w-auto group-hover:scale-[1.03]"
              }`} 
            />
            {!isScrolled ? (
              <div className="min-w-0 border-l border-white/15 pl-2.5">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white truncate max-w-[150px] sm:max-w-xs">{club.name}</h2>
                <p className="text-[9px] text-emerald-400 font-extrabold tracking-widest uppercase">{t("db_space_internal")}</p>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 border-l border-white/15 pl-2.5">
                {t("nav_dashboard")}
              </span>
            )}
          </Link>

          {/* Right Side: User Name/Badge & Hamburger Menu Button */}
          <div className="flex items-center gap-3">
            
            {/* Desktop User quick status info - Hidden in Dynamic Island state */}
            {!isScrolled && (
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-black text-white">{user.name}</span>
                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider mt-0.5 bg-gradient-to-r text-white ${user.roleGradient}`}>
                  {user.roleLabel}
                </span>
              </div>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className={`
                  flex items-center transition-all text-white/90 cursor-pointer
                  ${isScrolled 
                    ? "justify-center p-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20" 
                    : "gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25 text-[11px] font-bold"
                  }
                `}
                aria-label="Language Selector"
              >
                <svg className="h-3.5 w-3.5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.905 0-5.64-.78-8.006-2.141m15.686 0A11.95 11.95 0 0012 13.5c-2.905 0-5.64-.78-8.006-2.141" />
                </svg>
                {!isScrolled && (
                  <>
                    <span>{language}</span>
                    <svg className={`h-3 w-3 transition-transform text-white/60 ${langMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </>
                )}
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#0B1528]/95 border border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-xl">
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

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifMenuOpen(!notifMenuOpen)
                  setLangMenuOpen(false)
                }}
                className={`
                  flex items-center justify-center transition-all text-white/90 cursor-pointer relative
                  ${isScrolled 
                    ? "p-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20" 
                    : "p-2.5 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-white/25"
                  }
                `}
                aria-label="Notifications"
              >
                <span>🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-[#0B1528] animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className={`fixed md:absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 md:top-auto md:mt-2 w-[calc(100vw-2rem)] md:w-80 max-w-[360px] md:max-w-none rounded-2xl bg-[#0B1528]/95 border border-white/10 shadow-2xl p-4 z-50 backdrop-blur-xl space-y-3 max-h-96 overflow-y-auto custom-scrollbar ${isScrolled ? 'top-[70px]' : 'top-[80px]'}`}>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                      Notifications ({unreadCount} non lues)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[9px] font-black text-emerald-400 hover:text-emerald-300 uppercase cursor-pointer"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-white/40 font-bold text-center py-6">
                        Aucune notification.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-2.5 rounded-xl border text-[11px] transition-all cursor-pointer text-left relative group ${
                            notif.read
                              ? "bg-white/[0.02] border-white/5 text-white/60"
                              : "bg-emerald-500/[0.05] border-emerald-500/20 text-white font-bold"
                          }`}
                        >
                          <div className="flex justify-between items-baseline gap-2 mb-0.5 pr-5">
                            <span className={notif.read ? "text-white/60" : "text-emerald-400"}>
                              {notif.title}
                            </span>
                            <span className="text-[8px] text-white/30 shrink-0 font-bold" suppressHydrationWarning>
                              {new Date(notif.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                            {notif.message}
                          </p>
                          <button
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="absolute top-2.5 right-2.5 text-white/40 hover:text-white/80 bg-white/5 hover:bg-white/10 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8px] font-black transition-all cursor-pointer"
                            title="Supprimer la notification"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/40 text-white transition-all cursor-pointer flex items-center justify-center shadow-sm
                ${isScrolled ? "p-1.5" : "p-2 sm:p-2.5"}
              `}
              aria-label="Toggle Menu"
            >
              <svg className={`transition-transform duration-300 ${isScrolled ? "h-4.5 w-4.5" : "h-5 w-5 sm:h-6 sm:w-6"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div 
        className={`
          absolute transition-all duration-300 ease-in-out z-40 overflow-y-auto
          ${isScrolled
            ? "top-full left-0 right-0 mt-2.5 rounded-3xl border border-white/10 shadow-2xl"
            : "top-full left-0 w-full border-b border-white/10 shadow-2xl"
          }
          ${isOpen 
            ? "max-h-[calc(100vh-6rem)] opacity-100 py-6 visible bg-[#0B1528]/95 backdrop-blur-xl" 
            : "max-h-0 opacity-0 invisible"
          }
        `}
      >
        <div className={`open-drawer-container px-4 ${isScrolled ? "" : "max-w-7xl mx-auto sm:px-6 lg:px-8"}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-3 pb-3 border-b border-white/5">
            {isManager 
              ? (language === "EN" ? "Evo Sports Site Navigation" : language === "AR" ? "تصفح موقع إيفو سبورتس" : "Navigation du site Evo sports")
              : t("db_nav_club")}
          </p>
          
          {/* Main Grid for Dropdown Menu Items */}
          <nav className={`
            grid gap-3 py-6 max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar
            ${isScrolled ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"}
          `}>
            {visibleMenuItems
              .filter((item) => isRoleAuthorized(item.requiredRoles))
              .map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group border
                      ${active 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md" 
                        : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5"
                      }
                    `}
                  >
                    <div className="flex items-center min-w-0">
                      <div className="min-w-0">
                        <p className={`text-[11px] font-black tracking-wide ${active ? "text-emerald-400" : "text-white/90 group-hover:text-white"}`}>
                          {item.label}
                        </p>
                        {!isScrolled && (
                          <p className="text-[9px] text-white/40 truncate font-semibold mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
          </nav>

          {/* Dropdown Footer: User Profile info (Mobile) & Sign Out */}
          <div className="mt-4 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            {/* User details on all viewports */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm uppercase tracking-wider bg-gradient-to-r text-white ${user.roleGradient}`}>
                {user.name.substring(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-white">{user.name}</p>
                <p className="text-[10px] text-white/50 truncate font-semibold mt-0.5">{user.email}</p>
                <span className={`inline-flex rounded-lg px-2 py-0.5 text-[8px] font-black uppercase tracking-wider mt-1 bg-gradient-to-r text-white ${user.roleGradient}`}>
                  {user.roleLabel}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <form action={signOutAction} className="shrink-0">
              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition-all border border-red-500/20 shadow-md cursor-pointer"
              >
                <span>🚪</span> {t("db_signout")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
