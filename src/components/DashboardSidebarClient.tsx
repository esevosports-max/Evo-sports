"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/LanguageProvider"

interface SidebarProps {
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
  }
  signOutAction: () => Promise<void>
}

export default function DashboardSidebarClient({ user, club, signOutAction }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  const isManager = user.roleName === "MANAGER_EVO_SPORTS"

  // Roster of pages with their routes, labels, and roles allowed
  const menuItems = isManager
    ? [
        { href: "/dashboard", label: t("nav_dashboard"), icon: "🏠", description: t("desc_dashboard") },
        { href: "/dashboard/planning", label: t("db_general_planning"), icon: "📅", description: t("desc_planning_gen") },
        { href: "/dashboard/roles", label: t("db_roles_permissions"), icon: "🔑", description: t("desc_roles") },
        { href: "/dashboard/manager/demandes", label: t("db_reg_requests"), icon: "📥", description: t("desc_requests") },
        { href: "/dashboard/manager/clubs", label: t("db_clubs_mgmt"), icon: "🛡️", description: t("desc_clubs") },
        { href: "/dashboard/manager/paiements", label: t("db_clubs_payments"), icon: "💳", description: t("desc_payments") },
        { href: "/dashboard/manager/annonces", label: t("db_announcements"), icon: "📢", description: t("desc_announcements") },
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
          requiredRoles: ["PRESIDENT", "MEDECIN", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE"] 
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
          href: "/dashboard/quotidienne", 
          label: t("feat_welfare_title"), 
          icon: "📝", 
          description: t("desc_welfare"),
          requiredRoles: ["PRESIDENT", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT", "PREPARATEUR_PHYSIQUE", "JOUEUR", "MANAGER_EVO_SPORTS"]
        },
      ]

  const isRoleAuthorized = (allowed?: string[]) => {
    if (!allowed) return true
    return allowed.includes(user.roleName)
  }

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden w-full bg-[#0B1528] text-white flex items-center justify-between p-4 sticky top-0 z-40 shadow-md">
        <Link href="/dashboard" className="flex items-center gap-2">
          {club.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club.logo} alt="Club Logo" className="h-8 w-8 object-cover rounded-lg border border-white/20" />
          ) : (
            <span className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
              {club.name.substring(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-xs font-black uppercase tracking-wider truncate max-w-[150px]">{club.name}</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
          aria-label="Toggle Menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Sidebar - Desktop Left Side Panel & Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1528] text-white flex flex-col justify-between border-r border-white/5
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen shrink-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Header - Club Info */}
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            {club.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={club.logo} alt="Club Logo" className="h-10 w-10 object-cover rounded-xl border border-white/10" />
            ) : (
              <span className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-500/20">
                {club.name.substring(0, 2).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider text-white truncate">{club.name}</h2>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">{t("db_space_internal")}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 px-3 pb-2">{t("db_menu_principal")}</p>
          {menuItems
            .filter((item) => isRoleAuthorized(item.requiredRoles))
            .map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group
                    ${active 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm" 
                      : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-base transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-xs font-black tracking-wide ${active ? "text-emerald-400" : "text-white/80 group-hover:text-white"}`}>
                        {item.label}
                      </p>
                      <p className="text-[9px] text-white/40 truncate font-medium">{item.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
        </nav>

        {/* Footer - User Profile Info & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#070E1A]/80 space-y-4">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white truncate">{user.name}</p>
              <p className="text-[9px] text-white/50 truncate font-semibold mb-1.5">{user.email}</p>
              <span className={`inline-flex rounded-lg bg-gradient-to-r px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${user.roleGradient}`}>
                {user.roleLabel}
              </span>
            </div>
          </div>

          <form action={signOutAction} className="w-full">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 transition-all border border-red-500/20 shadow-md cursor-pointer"
            >
              <span>🚪</span> {t("db_signout")}
            </button>
          </form>
        </div>
      </aside>

      {/* Backdrop overlay on mobile when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  )
}
