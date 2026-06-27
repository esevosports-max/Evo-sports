"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/components/LanguageProvider"
import { restoreDeletedAccount, permanentlyDeleteAccount } from "@/app/dashboard/manager/comptes-supprimes/actions"

interface DeletedAccountItem {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  roleTag: string
  clubId: string
  clubName: string
  deletedBy: string
  deletedAt: string
}

interface ManagerDeletedAccountsProps {
  accounts: DeletedAccountItem[]
}

const translationsDict: Record<string, Record<string, string>> = {
  FR: {
    pageTitle: "Corbeille des Comptes Supprimés",
    pageSubtitle: "Restaurer temporairement les comptes supprimés (Joueurs et Staff) ou purger définitivement les données utilisateurs.",
    searchPlaceholder: "Rechercher par nom, email, rôle, club...",
    filterRole: "Filtrer par Rôle :",
    filterClub: "Filtrer par Club :",
    allRoles: "Tous les rôles",
    allClubs: "Tous les clubs",
    thName: "Utilisateur",
    thEmail: "Email / Tél",
    thRole: "Rôle original",
    thClub: "Club d'origine",
    thDeletedBy: "Supprimé par",
    thDeletedAt: "Date de suppression",
    thActions: "Actions administratives",
    btnRestore: "🔄 Restaurer",
    btnDeletePerm: "💀 Supprimer Définitivement",
    noRecord: "Aucun compte supprimé enregistré dans la corbeille.",
    successRestore: "Le compte a été restauré avec succès !",
    successDelete: "Le compte a été définitivement purgé de la base de données.",
    confirmRestore: "Voulez-vous restaurer le compte de {name} ? Ses accès d'origine seront immédiatement réactivés.",
    confirmDeletePerm: "Attention ! Cette action est irréversible et détruira toutes les données historiques associées. Supprimer définitivement {name} ?",
    rolePlayer: "Joueur",
    roleStaff: "Membre du Staff",
    processing: "Traitement en cours...",
  },
  EN: {
    pageTitle: "Deleted Accounts Trash Bin",
    pageSubtitle: "Temporarily restore deleted accounts (Players and Staff) or permanently purge user database records.",
    searchPlaceholder: "Search by name, email, role, club...",
    filterRole: "Filter by Role:",
    filterClub: "Filter by Club:",
    allRoles: "All roles",
    allClubs: "All clubs",
    thName: "User",
    thEmail: "Email / Phone",
    thRole: "Original Role",
    thClub: "Origin Club",
    thDeletedBy: "Deleted By",
    thDeletedAt: "Deletion Date",
    thActions: "Administrative Actions",
    btnRestore: "🔄 Restore",
    btnDeletePerm: "💀 Delete Permanently",
    noRecord: "No deleted accounts found in the trash bin.",
    successRestore: "Account has been successfully restored!",
    successDelete: "Account has been permanently deleted from the database.",
    confirmRestore: "Do you want to restore {name}'s account? Their original credentials will be reactivated.",
    confirmDeletePerm: "Warning! This action is irreversible. All historical telemetry will be purged. Delete {name} permanently?",
    rolePlayer: "Player",
    roleStaff: "Staff Member",
    processing: "Processing...",
  },
  AR: {
    pageTitle: "سلة مهملات الحسابات المحذوفة",
    pageSubtitle: "استعادة الحسابات المحذوفة مؤقتاً (اللاعبين والطاقم) أو مسح سجلات المستخدمين نهائياً من قاعدة البيانات.",
    searchPlaceholder: "البحث عن الاسم، البريد، الدور، النادي...",
    filterRole: "تصفية حسب الدور:",
    filterClub: "تصفية حسب النادي:",
    allRoles: "جميع الأدوار",
    allClubs: "جميع الأندية",
    thName: "المستخدم",
    thEmail: "البريد / الهاتف",
    thRole: "الدور الأصلي",
    thClub: "النادي الأصلي",
    thDeletedBy: "حُذف بواسطة",
    thDeletedAt: "تاريخ الحذف",
    thActions: "إجراءات إدارية",
    btnRestore: "🔄 استعادة",
    btnDeletePerm: "💀 حذف نهائي",
    noRecord: "لا توجد حسابات محذوفة في سلة المهملات.",
    successRestore: "تم استعادة الحساب بنجاح!",
    successDelete: "تم مسح الحساب نهائياً من قاعدة البيانات.",
    confirmRestore: "هل تريد استعادة حساب {name}؟ سيتم تفعيل صلاحياته فوراً.",
    confirmDeletePerm: "تحذير! هذا الإجراء لا يمكن التراجع عنه. هل تريد حذف حساب {name} نهائياً؟",
    rolePlayer: "لاعب",
    roleStaff: "عضو الطاقم",
    processing: "جاري المعالجة...",
  }
}

export default function ManagerDeletedAccountsClient({ accounts: initialAccounts }: ManagerDeletedAccountsProps) {
  const { language } = useLanguage()
  const tLoc = translationsDict[language] || translationsDict.FR

  const [accounts, setAccounts] = useState<DeletedAccountItem[]>(initialAccounts)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [clubFilter, setClubFilter] = useState("ALL")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Extract unique clubs present in the deleted list
  const uniqueClubs = Array.from(new Set(accounts.map((a) => JSON.stringify({ id: a.clubId, name: a.clubName })))).map(
    (str) => JSON.parse(str) as { id: string; name: string }
  )

  // Handle Restore
  const handleRestore = (item: DeletedAccountItem) => {
    const confirmMsg = tLoc.confirmRestore.replace("{name}", item.name)
    if (!window.confirm(confirmMsg)) return

    setMessage(null)
    startTransition(async () => {
      const res = await restoreDeletedAccount(item.id)
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== item.id))
        setMessage({ type: "success", text: tLoc.successRestore })
      } else {
        setMessage({ type: "error", text: res.error || "Error restoring" })
      }
    })
  }

  // Handle Permanent Delete
  const handlePermanentDelete = (item: DeletedAccountItem) => {
    const confirmMsg = tLoc.confirmDeletePerm.replace("{name}", item.name)
    if (!window.confirm(confirmMsg)) return

    setMessage(null)
    startTransition(async () => {
      const res = await permanentlyDeleteAccount(item.id)
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== item.id))
        setMessage({ type: "success", text: tLoc.successDelete })
      } else {
        setMessage({ type: "error", text: res.error || "Error deleting" })
      }
    })
  }

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.roleTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.clubName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "JOUEUR" && acc.roleTag === "JOUEUR") ||
      (roleFilter === "STAFF" && acc.roleTag !== "JOUEUR")

    const matchesClub = clubFilter === "ALL" || acc.clubId === clubFilter

    return matchesSearch && matchesRole && matchesClub
  })

  const isRtl = language === "AR"

  return (
    <div className="min-h-screen bg-[#070E1A] text-white p-4 sm:p-6 lg:p-8 space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Title block */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] to-[#0D1E36] border border-white/5 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/40 text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
            <span className="bg-gradient-to-r from-red-400 via-white to-red-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]">
              Trash Recovery System
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {tLoc.pageTitle}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl font-medium leading-relaxed">
            {tLoc.pageSubtitle}
          </p>
        </div>
      </div>

      {/* Action / Message Banner */}
      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
              : "bg-red-500/10 border-red-500/25 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{message.type === "success" ? "✅" : "⚠️"}</span>
            <p className="text-xs font-black tracking-wide">{message.text}</p>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and search toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0B1528]/80 border border-white/5 rounded-2xl p-4 shadow-md backdrop-blur-md">
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={tLoc.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <span className={`absolute top-1/2 -translate-y-1/2 text-zinc-500 text-sm ${isRtl ? "left-3" : "left-3.5"}`}>
            🔍
          </span>
        </div>

        {/* Filter Role */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 shrink-0">
            {tLoc.filterRole}
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
          >
            <option value="ALL" className="bg-[#0B1528] text-white">{tLoc.allRoles}</option>
            <option value="JOUEUR" className="bg-[#0B1528] text-white">{tLoc.rolePlayer}</option>
            <option value="STAFF" className="bg-[#0B1528] text-white">{tLoc.roleStaff}</option>
          </select>
        </div>

        {/* Filter Club */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase font-black tracking-wider text-zinc-500 shrink-0">
            {tLoc.filterClub}
          </label>
          <select
            value={clubFilter}
            onChange={(e) => setClubFilter(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
          >
            <option value="ALL" className="bg-[#0B1528] text-white">{tLoc.allClubs}</option>
            {uniqueClubs.map((club) => (
              <option key={club.id} value={club.id} className="bg-[#0B1528] text-white">
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main accounts table/list */}
      <div className="bg-[#0B1528]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/5 bg-[#0B1528]/85">
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thName}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thEmail}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thRole}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thClub}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thDeletedBy}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thDeletedAt}
                </th>
                <th className={`p-4 text-[10px] font-black uppercase text-zinc-500 tracking-wider ${isRtl ? "text-right" : "text-left"}`}>
                  {tLoc.thActions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {tLoc.noRecord}
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((item) => {
                  const isPlayerRole = item.roleTag === "JOUEUR"

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-all group">
                      
                      {/* Name */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${
                            isPlayerRole 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {item.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                              {item.name}
                            </p>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase">
                              ID: {item.userId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-zinc-300">{item.email}</p>
                        <p className="text-[9px] font-bold text-zinc-500">{item.phone || "—"}</p>
                      </td>

                      {/* Original Role */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                          isPlayerRole
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        }`}>
                          {isPlayerRole ? tLoc.rolePlayer : item.roleTag.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Club name */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-300">{item.clubName}</span>
                        </div>
                      </td>

                      {/* Deleted by */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-zinc-300">{item.deletedBy}</p>
                      </td>

                      {/* Deleted At */}
                      <td className="p-4 whitespace-nowrap">
                        <p className="text-xs font-semibold text-zinc-300">
                          {new Date(item.deletedAt).toLocaleDateString(language === "FR" ? "fr-FR" : "en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                        <p className="text-[9px] font-bold text-zinc-500">
                          {new Date(item.deletedAt).toLocaleTimeString(language === "FR" ? "fr-FR" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          
                          {/* Restore */}
                          <button
                            disabled={isPending}
                            onClick={() => handleRestore(item)}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isPending ? tLoc.processing : tLoc.btnRestore}
                          </button>

                          {/* Delete Permanently */}
                          <button
                            disabled={isPending}
                            onClick={() => handlePermanentDelete(item)}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-red-500/10 hover:bg-red-650 hover:text-white text-red-400 border border-red-500/20 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isPending ? tLoc.processing : tLoc.btnDeletePerm}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
