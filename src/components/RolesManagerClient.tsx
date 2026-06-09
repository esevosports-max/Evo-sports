"use client"

import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"

const ROLE_LABELS_DICT: Record<string, Record<string, string>> = {
  FR: {
    MANAGER_EVO_SPORTS: "Le Manager EVO Sports",
    PRESIDENT: "Le Président de club",
    DIRECTEUR_SPORTIF: "Le Directeur Sportif",
    SECRETAIRE_GENERAL: "Le Secrétaire Général",
    ENTRAINEUR_PRINCIPAL: "L'Entraîneur Principal",
    ENTRAINEUR_ADJOINT: "L'Entraîneur Adjoint",
    PREPARATEUR_PHYSIQUE: "Le Préparateur Physique",
    ENTRAINEUR_GARDIENS: "L'Entraîneur des Gardiens",
    MEDECIN: "Le Médecin du Club",
    JOUEUR: "Les Joueurs (Joueur)",
  },
  EN: {
    MANAGER_EVO_SPORTS: "EVO Sports Manager",
    PRESIDENT: "Club President",
    DIRECTEUR_SPORTIF: "Sports Director",
    SECRETAIRE_GENERAL: "General Secretary",
    ENTRAINEUR_PRINCIPAL: "Head Coach",
    ENTRAINEUR_ADJOINT: "Assistant Coach",
    PREPARATEUR_PHYSIQUE: "Physical Trainer",
    ENTRAINEUR_GARDIENS: "Goalkeeper Coach",
    MEDECIN: "Club Doctor",
    JOUEUR: "Players (Player)",
  },
  AR: {
    MANAGER_EVO_SPORTS: "مدير إيفو سبورتس",
    PRESIDENT: "رئيس النادي",
    DIRECTEUR_SPORTIF: "المدير الرياضي",
    SECRETAIRE_GENERAL: "الأمين العام",
    ENTRAINEUR_PRINCIPAL: "المدرب الرئيسي",
    ENTRAINEUR_ADJOINT: "المدرب المساعد",
    PREPARATEUR_PHYSIQUE: "المعد البدني",
    ENTRAINEUR_GARDIENS: "مدرب الحراس",
    MEDECIN: "طبيب النادي",
    JOUEUR: "اللاعبون (لاعب)",
  }
}

const pageDict = {
  FR: {
    unauthorizedTitle: "Accès Non Autorisé",
    unauthorizedDesc: "Seul le Manager EVO Sports est autorisé à gérer les habilitations, les rôles et la matrice des permissions d'accès globale.",
    toastTitle: "Habilitation Modifiée",
    toastSuccess: "Rôle de {name} changé en « {role} » avec succès !",
    toastError: "Erreur lors de la mise à jour du rôle.",
    toastPermissionGranted: "Permission « {action} » accordée pour {role} !",
    toastPermissionRevoked: "Permission « {action} » retirée pour {role} !",
    toastPermissionError: "Erreur lors de la modification de la permission.",
    title: "Habilitations & Rôles",
    subtitle: "Contrôlez les rôles des membres de votre club et ajustez finement la matrice de leurs permissions d'accès.",
    tabMembers: "Membres ({count})",
    tabMatrix: "Matrice des Droits",
    membersTitle: "Membres actifs inscrits dans l'association",
    membersTotal: "Total : {count} comptes",
    thMember: "Membre / Identité",
    thEmail: "Email",
    thRole: "Rôle Actuel",
    thAssign: "Assignation du Rôle",
    saving: "Sauvegarde... ⏳",
    matrixTitle: "Matrice de Droits - Rôles & Permissions",
    matrixSubtitle: "Cochez/décochez les permissions pour accorder ou révoquer en temps réel les droits d'accès de chaque rôle technique ou médical du club.",
    thPermission: "Permission / Action",
    noRole: "Aucun",
    defaultPermDesc: "Habilitation d'action"
  },
  EN: {
    unauthorizedTitle: "Access Denied",
    unauthorizedDesc: "Only the EVO Sports Manager is authorized to manage credentials, roles, and the global permissions matrix.",
    toastTitle: "Credentials Modified",
    toastSuccess: "Role of {name} changed to \"{role}\" successfully!",
    toastError: "Error updating the role.",
    toastPermissionGranted: "Permission \"{action}\" granted for {role}!",
    toastPermissionRevoked: "Permission \"{action}\" revoked for {role}!",
    toastPermissionError: "Error modifying permission.",
    title: "Credentials & Roles",
    subtitle: "Control your club members' roles and finely adjust their access permissions matrix.",
    tabMembers: "Members ({count})",
    tabMatrix: "Rights Matrix",
    membersTitle: "Active members registered in the association",
    membersTotal: "Total: {count} accounts",
    thMember: "Member / Identity",
    thEmail: "Email",
    thRole: "Current Role",
    thAssign: "Role Assignment",
    saving: "Saving... ⏳",
    matrixTitle: "Rights Matrix - Roles & Permissions",
    matrixSubtitle: "Check/uncheck permissions to grant or revoke access rights for each technical or medical role of the club in real-time.",
    thPermission: "Permission / Action",
    noRole: "None",
    defaultPermDesc: "Action permission"
  },
  AR: {
    unauthorizedTitle: "غير مصرح بالدخول",
    unauthorizedDesc: "يسمح فقط لمدير إيفو سبورتس بإدارة الصلاحيات والأدوار ومصفوفة الأذونات العامة.",
    toastTitle: "تعديل الصلاحية",
    toastSuccess: "تم تغيير دور {name} إلى « {role} » بنجاح!",
    toastError: "خطأ أثناء تحديث الدور.",
    toastPermissionGranted: "تم منح الإذن « {action} » لـ {role}!",
    toastPermissionRevoked: "تم سحب الإذن « {action} » من {role}!",
    toastPermissionError: "خطأ أثناء تعديل الإذن.",
    title: "الصلاحيات والأدوار",
    subtitle: "تحكم في أدوار أعضاء ناديك واضبط بدقة مصفوفة أذونات الدخول الخاصة بهم.",
    tabMembers: "الأعضاء ({count})",
    tabMatrix: "مصفوفة الحقوق",
    membersTitle: "الأعضاء النشطون المسجلون في الجمعية",
    membersTotal: "الإجمالي: {count} حسابات",
    thMember: "العضو / الهوية",
    thEmail: "البريد الإلكتروني",
    thRole: "الدور الحالي",
    thAssign: "تعيين الدور",
    saving: "جاري الحفظ... ⏳",
    matrixTitle: "مصفوفة الحقوق - الأدوار والأذونات",
    matrixSubtitle: "حدد/ألغِ تحديد الأذونات لمنح أو سحب حقوق الدخول لكل دور فني أو طبي في النادي في الوقت الفعلي.",
    thPermission: "الإذن / الإجراء",
    noRole: "لا يوجد",
    defaultPermDesc: "صلاحية الإجراء"
  }
}

interface UserItem {
  id: string
  name: string | null
  email: string | null
  roleId: string | null
  role: {
    id: string
    name: string
  } | null
}

interface RoleItem {
  id: string
  name: string
  description: string | null
  permissions: {
    action: string
  }[]
}

interface PermissionItem {
  id: string
  action: string
  description: string | null
}

interface RolesManagerProps {
  isAuthorized: boolean
  initialUsers: UserItem[]
  initialRoles: RoleItem[]
  allPermissions: PermissionItem[]
  updateUserRoleAction: (userId: string, roleId: string) => Promise<void>
  toggleRolePermissionAction: (roleId: string, permissionAction: string, enable: boolean) => Promise<void>
}

export default function RolesManagerClient({
  isAuthorized,
  initialUsers,
  initialRoles,
  allPermissions,
  updateUserRoleAction,
  toggleRolePermissionAction,
}: RolesManagerProps) {
  const { language } = useLanguage()
  const tLoc = pageDict[language] || pageDict["FR"]
  const rolesLabelMap = ROLE_LABELS_DICT[language] || ROLE_LABELS_DICT["FR"]

  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles)
  
  const [activeTab, setActiveTab] = useState<"members" | "matrix">("members")
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "info">("success")

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToastType(type)
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }

  // Update user role action handler
  const handleRoleChange = async (userId: string, newRoleId: string) => {
    setLoadingUserId(userId)
    try {
      await updateUserRoleAction(userId, newRoleId)
      
      // Update local UI state
      const selectedRole = roles.find((r) => r.id === newRoleId)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                roleId: newRoleId,
                role: selectedRole ? { id: selectedRole.id, name: selectedRole.name } : null,
              }
            : u
        )
      )
      
      const userName = users.find((u) => u.id === userId)?.name || "Utilisateur"
      const roleLabel = selectedRole ? rolesLabelMap[selectedRole.name] || selectedRole.name : "Nouveau rôle"
      showToast(tLoc.toastSuccess.replace("{name}", userName).replace("{role}", roleLabel))
    } catch (error) {
      console.error(error)
      showToast(tLoc.toastError, "info")
    } finally {
      setLoadingUserId(null)
    }
  }

  // Toggle permission for a role handler
  const handleTogglePermission = async (roleId: string, permissionAction: string, currentlyEnabled: boolean) => {
    const shouldEnable = !currentlyEnabled
    try {
      await toggleRolePermissionAction(roleId, permissionAction, shouldEnable)

      // Update local roles state
      setRoles((prev) =>
        prev.map((role) => {
          if (role.id !== roleId) return role
          return {
            ...role,
            permissions: shouldEnable
              ? [...role.permissions, { action: permissionAction }]
              : role.permissions.filter((p) => p.action !== permissionAction),
          }
        })
      )

      const roleName = roles.find((r) => r.id === roleId)?.name || "Rôle"
      const roleLabel = rolesLabelMap[roleName] || roleName
      const msg = shouldEnable
        ? tLoc.toastPermissionGranted.replace("{action}", permissionAction).replace("{role}", roleLabel)
        : tLoc.toastPermissionRevoked.replace("{action}", permissionAction).replace("{role}", roleLabel)
      showToast(msg)
    } catch (error) {
      console.error(error)
      showToast(tLoc.toastPermissionError, "info")
    }
  }

  // Exclude administrative roles from display in matrix for cleaner layout
  const filteredRolesForMatrix = roles.filter(
    (r) => r.name !== "PRESIDENT" && r.name !== "MANAGER_EVO_SPORTS"
  )

  if (!isAuthorized) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-xl mx-auto space-y-4 my-12 animate-in fade-in duration-300">
        <span className="text-4xl">🔒</span>
        <h3 className="text-lg font-black text-red-600 uppercase tracking-wider">{tLoc.unauthorizedTitle}</h3>
        <p className="text-xs text-zinc-500 font-semibold leading-relaxed">
          {tLoc.unauthorizedDesc}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Toast alert banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-md rounded-2xl border border-emerald-500 bg-white dark:bg-zinc-900 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
              toastType === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
            }`}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">{tLoc.toastTitle}</h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-semibold">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {tLoc.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {tLoc.subtitle}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-zinc-100 p-1.5 rounded-xl dark:bg-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "members" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tLoc.tabMembers.replace("{count}", String(users.length))}
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "matrix" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tLoc.tabMatrix}
          </button>
        </div>
      </section>

      {/* Tab Contents: Members */}
      {activeTab === "members" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              {tLoc.membersTitle}
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {tLoc.membersTotal.replace("{count}", String(users.length))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150/80 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="pb-3 pr-4">{tLoc.thMember}</th>
                  <th className="pb-3 pr-4">{tLoc.thEmail}</th>
                  <th className="pb-3 pr-4">{tLoc.thRole}</th>
                  <th className="pb-3 text-right">{tLoc.thAssign}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/60 text-xs font-semibold">
                {users.map((u) => {
                  const roleLabel = u.role ? rolesLabelMap[u.role.name] || u.role.name : tLoc.noRole
                  const loading = loadingUserId === u.id

                  return (
                    <tr key={u.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs">
                            {u.name?.substring(0, 1).toUpperCase() || "U"}
                          </span>
                          <span className="font-bold text-zinc-850">{u.name || "Sans Nom"}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 font-mono text-[11px] text-zinc-500">{u.email}</td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex rounded-lg bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                          {roleLabel}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {loading ? (
                            <span className="text-[10px] text-zinc-400 font-bold uppercase animate-pulse">{tLoc.saving}</span>
                          ) : (
                            <select
                              value={u.roleId || ""}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 font-bold"
                            >
                              {roles
                                .filter((r) => r.name !== "MANAGER_EVO_SPORTS" && r.name !== "PRESIDENT")
                                .map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {rolesLabelMap[r.name] || r.name}
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Contents: Matrix */}
      {activeTab === "matrix" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-6">
          <div className="border-b pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              {tLoc.matrixTitle}
            </h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-semibold mt-1">
              {tLoc.matrixSubtitle}
            </p>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-150/80 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="pb-3 pr-4 w-[250px]">{tLoc.thPermission}</th>
                  {filteredRolesForMatrix.map((role) => (
                    <th key={role.id} className="pb-3 px-2 text-center text-[9px] font-black w-[110px]">
                      {rolesLabelMap[role.name] || role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/60 text-xs font-semibold">
                {allPermissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="space-y-0.5">
                        <p className="font-mono text-zinc-800 font-bold text-[11px]">{perm.action}</p>
                        <p className="text-[9px] text-zinc-450 font-semibold leading-snug">{perm.description || tLoc.defaultPermDesc}</p>
                      </div>
                    </td>
                    
                    {filteredRolesForMatrix.map((role) => {
                      const isEnabled = role.permissions.some((p) => p.action === perm.action)
                      
                      return (
                        <td key={role.id} className="py-4 px-2 text-center">
                          <input
                             type="checkbox"
                             checked={isEnabled}
                             onChange={() => handleTogglePermission(role.id, perm.action, isEnabled)}
                             className="h-4.5 w-4.5 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
