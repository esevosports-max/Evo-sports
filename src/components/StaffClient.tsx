"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/LanguageProvider"
import { createStaffMember, deleteStaffMember, updateStaffMember, toggleBlockStaffMember } from "@/app/dashboard/staff/actions"

const ROLE_LABELS_DICT: Record<string, Record<string, string>> = {
  FR: {
    PRESIDENT: "Président de Club",
    DIRECTEUR_SPORTIF: "Directeur Sportif",
    SECRETAIRE_GENERAL: "Secrétaire Général",
    ENTRAINEUR_PRINCIPAL: "Entraîneur Principal",
    ENTRAINEUR_ADJOINT: "Entraîneur Adjoint",
    PREPARATEUR_PHYSIQUE: "Préparateur Physique",
    ENTRAINEUR_GARDIENS: "Entraîneur des Gardiens",
    MEDECIN: "Médecin du Club",
    JOUEUR: "Joueur",
  },
  EN: {
    PRESIDENT: "Club President",
    DIRECTEUR_SPORTIF: "Sports Director",
    SECRETAIRE_GENERAL: "General Secretary",
    ENTRAINEUR_PRINCIPAL: "Head Coach",
    ENTRAINEUR_ADJOINT: "Assistant Coach",
    PREPARATEUR_PHYSIQUE: "Physical Trainer",
    ENTRAINEUR_GARDIENS: "Goalkeeper Coach",
    MEDECIN: "Club Doctor",
    JOUEUR: "Player",
  },
  AR: {
    PRESIDENT: "رئيس النادي",
    DIRECTEUR_SPORTIF: "المدير الرياضي",
    SECRETAIRE_GENERAL: "الأمين العام",
    ENTRAINEUR_PRINCIPAL: "المدرب الرئيسي",
    ENTRAINEUR_ADJOINT: "المدرب المساعد",
    PREPARATEUR_PHYSIQUE: "المعد البدني",
    ENTRAINEUR_GARDIENS: "مدرب الحراس",
    MEDECIN: "طبيب النادي",
    JOUEUR: "لاعب",
  }
}

const pageDict = {
  FR: {
    back: "← Retour",
    createTitle: "Créer un Compte Staff",
    createSubtitle: "Enregistrez un nouveau cadre sous l'autorité du Président",
    formTitle: "Fiche de Création du Staff",
    formSubtitle: "Remplissez les détails du compte de votre collaborateur",
    fieldRole: "1. Fonction / Rôle (Sous l'autorité du Président)",
    lastName: "Nom",
    firstName: "Prénom",
    birthDate: "Date de Naissance",
    birthPlace: "Lieu de Naissance",
    nationality: "Nationalité",
    phone: "Numéro de Téléphone",
    assignedTeams: "Équipe(s) sous son commandement (Choisir dans le club)",
    noTeamsAvailable: "Aucune équipe disponible. Veuillez créer une équipe d'abord.",
    credentialsSection: "Identifiants de connexion (Plateforme)",
    loginEmail: "Email de connexion",
    loginPassword: "Mot de passe de connexion",
    cancel: "Annuler",
    btnCreateSubmit: "Créer le Compte Staff 📧",
    btnCreating: "Création...",
    pageTitle: "Staff Technique & Organigramme",
    pageSubtitle: "Annuaire des encadrants sportifs, responsables administratifs et personnel médical du club",
    btnInvite: "Inviter un cadre ➕",
    restrictedAccess: "🔒 Accès Restreint",
    directoryTitle: "Annuaire du Staff",
    directoryCount: "{count} Cadres",
    thMember: "Membre",
    thRole: "Fonction / Rôle",
    thContact: "Contact",
    thJoined: "Arrivée",
    thStatus: "Statut",
    thActions: "Actions",
    statusBlocked: "Bloqué",
    statusGuest: "Invité",
    statusActive: "Actif",
    btnEdit: "Modifier",
    btnDelete: "Supprimer",
    noMembersFound: "Aucun membre trouvé pour ce rôle",
    editTitle: "Modifier le Collaborateur",
    editSubtitle: "Éditez les informations de {name}",
    btnSave: "Enregistrer",
    confirmDelete: "Voulez-vous vraiment supprimer {name} ?",
    msgCreated: "Membre du staff {name} créé avec succès !",
    msgDeleted: "Membre du staff {name} supprimé.",
    msgSaved: "Modifications enregistrées.",
    msgDeleteError: "Impossible de supprimer ce membre.",
    msgCreateError: "Une erreur est survenue."
  },
  EN: {
    back: "← Back",
    createTitle: "Create Staff Account",
    createSubtitle: "Register a new official under the President's authority",
    formTitle: "Staff Creation Form",
    formSubtitle: "Fill in the details of your collaborator's account",
    fieldRole: "1. Function / Role (Under the President's authority)",
    lastName: "Last Name",
    firstName: "First Name",
    birthDate: "Birth Date",
    birthPlace: "Birth Place",
    nationality: "Nationality",
    phone: "Phone Number",
    assignedTeams: "Team(s) under command (Choose in club)",
    noTeamsAvailable: "No teams available. Please create a team first.",
    credentialsSection: "Login Credentials (Platform)",
    loginEmail: "Login Email",
    loginPassword: "Login Password",
    cancel: "Cancel",
    btnCreateSubmit: "Create Staff Account 📧",
    btnCreating: "Creating...",
    pageTitle: "Technical Staff & Organigram",
    pageSubtitle: "Directory of sports coaches, administrative managers and club medical staff",
    btnInvite: "Invite Official ➕",
    restrictedAccess: "🔒 Restricted Access",
    directoryTitle: "Staff Directory",
    directoryCount: "{count} Officials",
    thMember: "Member",
    thRole: "Function / Role",
    thContact: "Contact",
    thJoined: "Joined",
    thStatus: "Status",
    thActions: "Actions",
    statusBlocked: "Blocked",
    statusGuest: "Guest",
    statusActive: "Active",
    btnEdit: "Edit",
    btnDelete: "Delete",
    noMembersFound: "No members found for this role",
    editTitle: "Edit Collaborator",
    editSubtitle: "Edit information of {name}",
    btnSave: "Save",
    confirmDelete: "Are you sure you want to delete {name}?",
    msgCreated: "Staff member {name} successfully created!",
    msgDeleted: "Staff member {name} deleted.",
    msgSaved: "Changes saved.",
    msgDeleteError: "Unable to delete this member.",
    msgCreateError: "An error occurred."
  },
  AR: {
    back: "← عودة",
    createTitle: "إنشاء حساب طاقم",
    createSubtitle: "تسجيل إطار جديد تحت سلطة الرئيس",
    formTitle: "بطاقة إنشاء عضو الطاقم",
    formSubtitle: "املأ تفاصيل حساب زميلك",
    fieldRole: "1. الوظيفة / الدور (تحت سلطة الرئيس)",
    lastName: "اللقب",
    firstName: "الاسم",
    birthDate: "تاريخ الميلاد",
    birthPlace: "مكان الميلاد",
    nationality: "الجنسية",
    phone: "رقم الهاتف",
    assignedTeams: "الفريق/الفرق الخاضعة لإشرافه (اختر من النادي)",
    noTeamsAvailable: "لا توجد فرق متاحة. يرجى إنشاء فريق أولاً.",
    credentialsSection: "بيانات اعتماد الدخول (المنصة)",
    loginEmail: "البريد الإلكتروني للدخول",
    loginPassword: "كلمة مرور الدخول",
    cancel: "إلغاء",
    btnCreateSubmit: "إنشاء حساب الطاقم 📧",
    btnCreating: "جاري الإنشاء...",
    pageTitle: "الطاقم الفني والهيكل التنظيمي",
    pageSubtitle: "دليل المدربين الرياضيين، المسؤولين الإداريين والطاقم الطبي للنادي",
    btnInvite: "دعوة إطار ➕",
    restrictedAccess: "🔒 دخول مقيد",
    directoryTitle: "دليل الطاقم",
    directoryCount: "{count} إطارات",
    thMember: "العضو",
    thRole: "الوظيفة / الدور",
    thContact: "الاتصال",
    thJoined: "تاريخ الانضمام",
    thStatus: "الحالة",
    thActions: "الإجراءات",
    statusBlocked: "محظور",
    statusGuest: "مدعو",
    statusActive: "نشط",
    btnEdit: "تعديل",
    btnDelete: "حذف",
    noMembersFound: "لم يتم العثور على أي عضو بهذا الدور",
    editTitle: "تعديل بيانات الزميل",
    editSubtitle: "تعديل معلومات {name}",
    btnSave: "حفظ",
    confirmDelete: "هل تريد حقًا حذف {name}؟",
    msgCreated: "تم إنشاء عضو الطاقم {name} بنجاح!",
    msgDeleted: "تم حذف عضو الطاقم {name}.",
    msgSaved: "تم حفظ التغييرات.",
    msgDeleteError: "تعذر حذف هذا العضو.",
    msgCreateError: "حدث خطأ ما."
  }
}

export interface StaffMember {
  id: string
  name: string
  role: string
  roleTag: string
  email: string
  phone: string
  joined: string
  avatarColor: string
  isBlocked?: boolean
  birthDate?: string
  birthPlace?: string
  nationality?: string
  assignedTeams: string[]
  assignedTeamIds: string[]
  loginEmail?: string
}

interface Category {
  id: string
  name: string
}

interface StaffClientProps {
  initialStaff: StaffMember[]
  categories: Category[]
  currentUserRole?: string
  noClub?: boolean
  subscriptionPlan?: string
  initialLogs?: any[]
}

export default function StaffClient({
  initialStaff,
  categories,
  currentUserRole,
  noClub,
  subscriptionPlan = "Club",
  initialLogs = []
}: StaffClientProps) {
  const { language } = useLanguage()
  const tLoc = pageDict[language] || pageDict["FR"]
  const rolesLabelMap = ROLE_LABELS_DICT[language] || ROLE_LABELS_DICT["FR"]

  const isOneTeamPlan = subscriptionPlan === "1 Équipe" || subscriptionPlan === "1 equipe" || subscriptionPlan === "Standard"

  const restrictedRoles = [
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "ENTRAINEUR_GARDIENS",
    "PREPARATEUR_PHYSIQUE",
    "MEDECIN"
  ]
  const canManage = !currentUserRole || !restrictedRoles.includes(currentUserRole)

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeView, setActiveView] = useState<"list" | "create">("list")
  const [selectedFilter, setSelectedFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "BLOCKED">("ALL")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Create Staff fields
  const [createRole, setCreateRole] = useState(isOneTeamPlan ? "ENTRAINEUR_PRINCIPAL" : "ENTRAINEUR_ADJOINT")
  const [createLastName, setCreateLastName] = useState("")
  const [createFirstName, setCreateFirstName] = useState("")
  const [createBirthDate, setCreateBirthDate] = useState("")
  const [createBirthPlace, setCreateBirthPlace] = useState("")
  const [createNationality, setCreateNationality] = useState("")
  const [createPhone, setCreatePhone] = useState("")
  const [createAssignedTeams, setCreateAssignedTeams] = useState<string[]>([]) // holds Category IDs!
  const [createLoginEmail, setCreateLoginEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")

  // Editing states (Modal)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editRole, setEditRole] = useState(isOneTeamPlan ? "ENTRAINEUR_PRINCIPAL" : "ENTRAINEUR_ADJOINT")
  const [editAssignedTeams, setEditAssignedTeams] = useState<string[]>([]) // Category IDs!

  const handleCreateRoleChange = (role: string) => {
    setCreateRole(role)
    if (role === "ENTRAINEUR_PRINCIPAL" || role === "ENTRAINEUR_ADJOINT") {
      setCreateAssignedTeams((prev) => prev.slice(0, 1))
    }
  }

  const handleEditRoleChange = (role: string) => {
    setEditRole(role)
    if (role === "ENTRAINEUR_PRINCIPAL" || role === "ENTRAINEUR_ADJOINT") {
      setEditAssignedTeams((prev) => prev.slice(0, 1))
    }
  }

  const filteredStaff = initialStaff.filter((m) => {
    if (selectedFilter !== "ALL" && m.roleTag !== selectedFilter) return false
    if (statusFilter === "ACTIVE" && m.isBlocked) return false
    if (statusFilter === "BLOCKED" && !m.isBlocked) return false
    return true
  })

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg("")

    if (!createLastName || !createFirstName || !createLoginEmail) return

    startTransition(async () => {
      const res = await createStaffMember({
        firstName: createFirstName,
        lastName: createLastName,
        roleTag: createRole,
        email: createLoginEmail,
        phone: createPhone || "+33 6 -- -- -- --",
        birthDate: createBirthDate,
        birthPlace: createBirthPlace,
        nationality: createNationality,
        categoryIds: createAssignedTeams
      })

      if (res.success) {
        // Reset forms
        setCreateLastName("")
        setCreateFirstName("")
        setCreateBirthDate("")
        setCreateBirthPlace("")
        setCreateNationality("")
        setCreatePhone("")
        setCreateAssignedTeams([])
        setCreateLoginEmail("")
        setCreatePassword("")
        setCreateRole("ENTRAINEUR_ADJOINT")

        setActiveView("list")
        setSuccessMsg(tLoc.msgCreated.replace("{name}", `${createLastName.toUpperCase()} ${createFirstName}`))
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || tLoc.msgCreateError)
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(tLoc.confirmDelete.replace("{name}", name))) {
      return
    }

    startTransition(async () => {
      const res = await deleteStaffMember(id)
      if (res.success) {
        setSuccessMsg(tLoc.msgDeleted.replace("{name}", name))
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || tLoc.msgDeleteError)
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleToggleBlock = (id: string, name: string, isBlocked: boolean) => {
    const actionLabel = isBlocked 
      ? (language === "EN" ? "unblock" : language === "AR" ? "إلغاء حظر" : "débloquer") 
      : (language === "EN" ? "block" : language === "AR" ? "حظر" : "bloquer")

    const confirmMsg = language === "EN" 
      ? `Are you sure you want to ${actionLabel} ${name}?` 
      : language === "AR" 
      ? `هل أنت متأكد أنك تريد ${actionLabel} ${name}؟` 
      : `Voulez-vous vraiment ${actionLabel} ${name} ?`

    if (!confirm(confirmMsg)) {
      return
    }

    startTransition(async () => {
      const res = await toggleBlockStaffMember(id)
      if (res.success) {
        const successLabel = isBlocked
          ? (language === "EN" ? `Staff member ${name} unblocked.` : language === "AR" ? `تم إلغاء حظر ${name}.` : `Membre du staff ${name} débloqué.`)
          : (language === "EN" ? `Staff member ${name} blocked.` : language === "AR" ? `تم حظر ${name}.` : `Membre du staff ${name} bloqué.`)
        
        setSuccessMsg(successLabel)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || tLoc.msgCreateError)
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleOpenEdit = (member: StaffMember) => {
    setEditingMember(member)
    setEditName(member.name)
    setEditEmail(member.email)
    setEditPhone(member.phone || "")
    setEditPassword("")
    setEditRole(member.roleTag)
    setEditAssignedTeams(member.assignedTeamIds || [])
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember || !editName || !editEmail) return

    startTransition(async () => {
      const res = await updateStaffMember(editingMember.id, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        password: editPassword || undefined,
        roleTag: editRole,
        categoryIds: editAssignedTeams
      })

      if (res.success) {
        setSuccessMsg(tLoc.msgSaved)
        setEditingMember(null)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || tLoc.msgCreateError)
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  // VIEW: CREATE STAFF PAGE
  if (activeView === "create") {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
        {/* Header Back Title Block */}
        <div className="flex items-center gap-4 border-b border-zinc-150/70 dark:border-zinc-800 pb-4">
          <button
            onClick={() => setActiveView("list")}
            className="rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 transition-all active:scale-95 cursor-pointer dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-sm border border-zinc-950 dark:border-white"
          >
            {tLoc.back}
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-950 dark:text-white">
              {tLoc.createTitle}
            </h2>
            <p className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">
              {tLoc.createSubtitle}
            </p>
          </div>
        </div>

        {/* Spacious Creation Form Page */}
        <div className="max-w-2xl mx-auto rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 shadow-md dark:border-emerald-500/10 dark:bg-emerald-950/10 backdrop-blur-md space-y-6">
          <div className="border-b border-zinc-150/60 dark:border-zinc-800 pb-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              {tLoc.formTitle}
            </h3>
            <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">{tLoc.formSubtitle}</p>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-6">
            {/* 1. ROLE */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2">{tLoc.fieldRole}</label>
              <select
                required
                value={createRole}
                onChange={(e) => handleCreateRoleChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                {isOneTeamPlan ? (
                  <>
                    {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && <option value="DIRECTEUR_SPORTIF">{rolesLabelMap["DIRECTEUR_SPORTIF"]}</option>}
                    <option value="ENTRAINEUR_PRINCIPAL">{rolesLabelMap["ENTRAINEUR_PRINCIPAL"]}</option>
                    <option value="MEDECIN">{rolesLabelMap["MEDECIN"]}</option>
                  </>
                ) : (
                  <>
                    {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && <option value="DIRECTEUR_SPORTIF">{rolesLabelMap["DIRECTEUR_SPORTIF"]}</option>}
                    {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && <option value="SECRETAIRE_GENERAL">{rolesLabelMap["SECRETAIRE_GENERAL"]}</option>}
                    <option value="ENTRAINEUR_PRINCIPAL">{rolesLabelMap["ENTRAINEUR_PRINCIPAL"]}</option>
                    <option value="ENTRAINEUR_ADJOINT">{rolesLabelMap["ENTRAINEUR_ADJOINT"]}</option>
                    <option value="PREPARATEUR_PHYSIQUE">{rolesLabelMap["PREPARATEUR_PHYSIQUE"]}</option>
                    <option value="ENTRAINEUR_GARDIENS">{rolesLabelMap["ENTRAINEUR_GARDIENS"]}</option>
                    <option value="MEDECIN">{rolesLabelMap["MEDECIN"]}</option>
                  </>
                )}
              </select>
            </div>

            {/* 2. Nom et Prénom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.lastName}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MARTIN"
                  value={createLastName}
                  onChange={(e) => setCreateLastName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.firstName}</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Antoine"
                  value={createFirstName}
                  onChange={(e) => setCreateFirstName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>
            </div>

            {/* 3. Date/Lieu de naissance & Nationalité */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.birthDate}</label>
                <input
                  type="date"
                  value={createBirthDate}
                  onChange={(e) => setCreateBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.birthPlace}</label>
                <input
                  type="text"
                  placeholder="Ex: Paris"
                  value={createBirthPlace}
                  onChange={(e) => setCreateBirthPlace(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.nationality}</label>
                <input
                  type="text"
                  placeholder="Ex: Française"
                  value={createNationality}
                  onChange={(e) => setCreateNationality(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>
            </div>

            {/* 4. Téléphone & Équipes Affectées */}
            <div className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1.5">{tLoc.phone}</label>
                <input
                  type="text"
                  placeholder="Ex: +33 6 12 34 56 78"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2">{tLoc.assignedTeams}</label>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((cat) => {
                    const isChecked = createAssignedTeams.includes(cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-bold cursor-pointer select-none transition-all duration-150 ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 dark:border-emerald-400"
                            : "border-zinc-200 hover:bg-zinc-50 text-zinc-650 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:text-zinc-350"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (createRole === "ENTRAINEUR_PRINCIPAL" || createRole === "ENTRAINEUR_ADJOINT") {
                                setCreateAssignedTeams([cat.id])
                              } else {
                                setCreateAssignedTeams((prev) => [...prev, cat.id])
                              }
                            } else {
                              setCreateAssignedTeams((prev) => prev.filter((t) => t !== cat.id))
                            }
                          }}
                          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span>⚽ {cat.name}</span>
                      </label>
                    )
                  })}
                  {categories.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-zinc-400 font-bold py-4">
                      {tLoc.noTeamsAvailable}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Identification */}
            <div className="space-y-4 border-t border-zinc-150/65 dark:border-zinc-800 pt-4">
              <label className="block text-[9px] font-black text-zinc-500 uppercase">{tLoc.credentialsSection}</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1.5">{tLoc.loginEmail}</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: login@club.com"
                    value={createLoginEmail}
                    onChange={(e) => setCreateLoginEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
                
                <div>
                  <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1.5">{tLoc.loginPassword}</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-4 pt-4 border-t border-zinc-150/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="flex-1 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-650 font-black uppercase text-xs tracking-wider py-3 transition-all cursor-pointer dark:border-zinc-800 dark:hover:bg-zinc-850 dark:text-zinc-350"
              >
                {tLoc.cancel}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-105 to-zinc-300 hover:from-zinc-300 hover:via-zinc-200 hover:to-zinc-400 text-emerald-800 font-black uppercase text-xs tracking-wider py-3 shadow-md border border-zinc-300/80 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isPending ? tLoc.btnCreating : tLoc.btnCreateSubmit}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // VIEW: LIST STAFF PAGE
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Row for Title & Header & Invite Silver Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150/70 dark:border-zinc-800 pb-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black uppercase tracking-wider text-zinc-950 dark:text-white">
            {tLoc.pageTitle}
          </h2>
          <p className="text-[9px] font-black uppercase text-zinc-450 tracking-wider">
            {tLoc.pageSubtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-center">
          {canManage && (
            <button
              onClick={() => setActiveView("create")}
              className="rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 hover:from-zinc-300 hover:via-zinc-200 hover:to-zinc-400 text-emerald-800 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md border border-zinc-300/80 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {tLoc.btnInvite}
            </button>
          )}
          <span className="text-[9px] font-black bg-blue-500/10 text-blue-600 px-2.5 py-2.5 rounded-full uppercase tracking-wider">
            {tLoc.restrictedAccess}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 text-center animate-bounce">
          {successMsg}
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Role/Function Filter Select */}
        <div className="flex items-center gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="rounded-2xl border border-zinc-250 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-700 shadow-inner outline-none transition-all focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-350 cursor-pointer"
          >
            {[
              { key: "ALL", label: language === "EN" ? "All Roles" : language === "AR" ? "كل الأدوار" : "Toutes les fonctions" },
              { key: "DIRECTEUR_SPORTIF", label: rolesLabelMap["DIRECTEUR_SPORTIF"] },
              { key: "SECRETAIRE_GENERAL", label: rolesLabelMap["SECRETAIRE_GENERAL"] },
              { key: "ENTRAINEUR_PRINCIPAL", label: rolesLabelMap["ENTRAINEUR_PRINCIPAL"] },
              { key: "ENTRAINEUR_ADJOINT", label: rolesLabelMap["ENTRAINEUR_ADJOINT"] },
              { key: "PREPARATEUR_PHYSIQUE", label: rolesLabelMap["PREPARATEUR_PHYSIQUE"] },
              { key: "ENTRAINEUR_GARDIENS", label: rolesLabelMap["ENTRAINEUR_GARDIENS"] },
              { key: "MEDECIN", label: rolesLabelMap["MEDECIN"] },
            ].map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Dropdown Choice */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "BLOCKED")}
            className="rounded-2xl border border-zinc-250 bg-white px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-700 shadow-inner outline-none transition-all focus:border-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-350 cursor-pointer"
          >
            <option value="ALL">
              {language === "EN" ? "All Statuses" : language === "AR" ? "كل الحالات" : "Tous les statuts"}
            </option>
            <option value="ACTIVE">
              {language === "EN" ? "Active Only" : language === "AR" ? "النشطون فقط" : "Actifs uniquement"}
            </option>
            <option value="BLOCKED">
              {language === "EN" ? "Blocked Only" : language === "AR" ? "المحظورون فقط" : "Bloqués uniquement"}
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 overflow-hidden">
        <div className="p-4 border-b border-zinc-150/60 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-white">{tLoc.directoryTitle}</span>
          <span className="text-[10px] font-black bg-emerald-550/10 text-emerald-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {tLoc.directoryCount.replace("{count}", String(filteredStaff.length))}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-150/65 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider bg-zinc-50/20 dark:bg-zinc-950/10 select-none">
                <th className="py-3.5 px-4">{tLoc.thMember}</th>
                <th className="py-3.5 px-4">{tLoc.thRole}</th>
                <th className="py-3.5 px-4">{tLoc.thContact}</th>
                <th className="py-3.5 px-4">{tLoc.thJoined}</th>
                <th className="py-3.5 px-4">{tLoc.thStatus}</th>
                {canManage && <th className="py-3.5 px-4 text-center">{tLoc.thActions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs">
              {filteredStaff.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/10 transition-colors duration-150">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm ${member.avatarColor}`}>
                      {member.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 dark:text-white uppercase tracking-wide">{member.name}</p>
                      <p className="text-[9px] text-zinc-450 font-medium">ID: #{member.id}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 space-y-1">
                    <span className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${
                      member.roleTag === "PRESIDENT" ? "bg-red-500/10 text-red-655 dark:text-red-400" :
                      member.roleTag === "DIRECTEUR_SPORTIF" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      member.roleTag === "SECRETAIRE_GENERAL" ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" :
                      member.roleTag === "ENTRAINEUR_PRINCIPAL" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      member.roleTag === "ENTRAINEUR_ADJOINT" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" :
                      member.roleTag === "PREPARATEUR_PHYSIQUE" ? "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400" :
                      member.roleTag === "ENTRAINEUR_GARDIENS" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                      member.roleTag === "MEDECIN" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                      "bg-zinc-100 text-zinc-655 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}>
                      {rolesLabelMap[member.roleTag] || member.role}
                    </span>

                    {/* Assigned Teams */}
                    {member.assignedTeams && member.assignedTeams.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.assignedTeams.map((teamName) => (
                          <span key={teamName} className="inline-flex items-center text-[8px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/50">
                            ⚽ {teamName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 space-y-0.5">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-350">{member.email}</p>
                    <p className="text-[9px] text-zinc-450 font-bold">{member.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 font-semibold">
                    {member.joined.toLowerCase().includes("attente") || member.joined.toLowerCase().includes("pending")
                      ? tLoc.statusGuest
                      : member.joined}
                  </td>
                  <td className="py-3.5 px-4">
                    {member.isBlocked ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-605">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        {tLoc.statusBlocked}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        member.joined.toLowerCase().includes("attente") || member.joined.toLowerCase().includes("pending")
                          ? "bg-yellow-500/10 text-yellow-600 animate-pulse"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        <span className={`h-1 w-1 rounded-full ${
                          member.joined.toLowerCase().includes("attente") || member.joined.toLowerCase().includes("pending") ? "bg-yellow-550" : "bg-emerald-550"
                        }`} />
                        {member.joined.toLowerCase().includes("attente") || member.joined.toLowerCase().includes("pending") ? tLoc.statusGuest : tLoc.statusActive}
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {!((currentUserRole === "SECRETAIRE_GENERAL" || currentUserRole === "ENTRAINEUR_PRINCIPAL" || currentUserRole === "ENTRAINEUR_ADJOINT") && ["PRESIDENT", "SECRETAIRE_GENERAL", "DIRECTEUR_SPORTIF"].includes(member.roleTag)) && (
                          <>
                            <button 
                              onClick={() => handleOpenEdit(member)}
                              className="px-2.5 py-1 rounded-lg border border-blue-500 hover:bg-blue-500/10 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-black uppercase text-[9px] tracking-wide transition-all duration-155 active:scale-95 cursor-pointer"
                            >
                              {tLoc.btnEdit}
                            </button>
                            <button 
                              onClick={() => handleToggleBlock(member.id, member.name, !!member.isBlocked)}
                              className={`px-2.5 py-1 rounded-lg border font-black uppercase text-[9px] tracking-wide transition-all duration-155 active:scale-95 cursor-pointer ${
                                member.isBlocked
                                  ? "border-emerald-500 hover:bg-emerald-500/10 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                                  : "border-amber-500 hover:bg-amber-500/10 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                              }`}
                            >
                              {member.isBlocked
                                ? (language === "EN" ? "Unblock" : language === "AR" ? "إلغاء الحظر" : "Débloquer")
                                : (language === "EN" ? "Block" : language === "AR" ? "حظر" : "Bloquer")
                              }
                            </button>
                            <button 
                              onClick={() => handleDelete(member.id, member.name)}
                              className="px-2.5 py-1 rounded-lg border border-red-500 hover:bg-red-500/10 text-red-655 dark:border-red-400 dark:text-red-400 font-black uppercase text-[9px] tracking-wide transition-all duration-155 active:scale-95 cursor-pointer"
                            >
                              {tLoc.btnDelete}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-8 text-center text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                    {tLoc.noMembersFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {initialLogs && initialLogs.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-850 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-1.5">
                🛡️ {language === "EN" ? "Security & Account Logs" : language === "AR" ? "سجل الحسابات والأمان" : "Journal de Sécurité & Actions sur les Comptes"}
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                {language === "EN" ? "Audit trail of all create, block, delete, and modify actions on club accounts." : language === "AR" ? "سجل تدقيق لجميع عمليات الإنشاء والحظر والحذف والتعديل على حسابات النادي." : "Historique de toutes les actions de création, blocage, suppression et modification des comptes du club."}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-zinc-150/65 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="py-2 px-3">{language === "EN" ? "Date & Time" : language === "AR" ? "التاريخ والوقت" : "Date & Heure"}</th>
                  <th className="py-2 px-3">{language === "EN" ? "Action" : language === "AR" ? "الإجراء" : "Action"}</th>
                  <th className="py-2 px-3">{language === "EN" ? "Target Account" : language === "AR" ? "الحساب المستهدف" : "Compte Ciblé"}</th>
                  <th className="py-2 px-3">{language === "EN" ? "Performed By" : language === "AR" ? "بواسطة" : "Exécuté Par"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {initialLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleDateString(language === "EN" ? "en-US" : "fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                  })
                  
                  let actionBadge = ""
                  let actionText = ""
                  
                  if (log.actionType === "CREATE") {
                    actionBadge = "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    actionText = language === "EN" ? "Created" : language === "AR" ? "تم الإنشاء" : "Créé"
                  } else if (log.actionType === "BLOCK") {
                    actionBadge = "bg-red-500/10 text-red-600 border border-red-500/20"
                    actionText = language === "EN" ? "Blocked" : language === "AR" ? "تم الحظر" : "Bloqué"
                  } else if (log.actionType === "UNBLOCK") {
                    actionBadge = "bg-teal-500/10 text-teal-600 border border-teal-500/20"
                    actionText = language === "EN" ? "Unblocked" : language === "AR" ? "إلغاء الحظر" : "Débloqué"
                  } else if (log.actionType === "DELETE") {
                    actionBadge = "bg-zinc-500/10 text-zinc-650 border border-zinc-500/20 dark:text-zinc-400"
                    actionText = language === "EN" ? "Deleted" : language === "AR" ? "تم الحذف" : "Supprimé"
                  } else if (log.actionType === "MODIFY") {
                    actionBadge = "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                    actionText = language === "EN" ? "Modified" : language === "AR" ? "تم التعديل" : "Modifié"
                  }

                  return (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/5 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-zinc-450">{dateStr}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${actionBadge}`}>
                          {actionText}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-black text-zinc-900 dark:text-white uppercase">{log.targetName}</span>{" "}
                        <span className="text-[9px] text-zinc-450 font-bold uppercase">({rolesLabelMap[log.targetRole] || log.targetRole})</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{log.operatorName}</span>{" "}
                        <span className="text-[9px] text-zinc-450 font-bold uppercase">({rolesLabelMap[log.operatorRole] || log.operatorRole})</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-150">
            <div className="pb-3 border-b border-zinc-150/60 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-850 dark:text-white">
                  {tLoc.editTitle}
                </h3>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">{tLoc.editSubtitle.replace("{name}", editingMember.name)}</p>
              </div>
              <button 
                onClick={() => setEditingMember(null)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">{tLoc.lastName} & {tLoc.firstName}</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">{tLoc.loginEmail}</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">{tLoc.phone}</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                  {tLoc.loginPassword}
                  <span className="text-[8px] font-medium text-zinc-400 lowercase italic">
                    {language === "EN" ? " (leave empty to keep unchanged)" : language === "AR" ? " (اتركه فارغاً لعدم التغيير)" : " (laisser vide pour ne pas modifier)"}
                  </span>
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">{tLoc.thRole}</label>
                <select
                  value={editRole}
                  onChange={(e) => handleEditRoleChange(e.target.value)}
                  disabled={editingMember?.roleTag === "PRESIDENT"}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {editingMember?.roleTag === "PRESIDENT" && <option value="PRESIDENT">{rolesLabelMap["PRESIDENT"]}</option>}
                  {isOneTeamPlan ? (
                    <>
                      {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && editingMember?.roleTag !== "PRESIDENT" && <option value="DIRECTEUR_SPORTIF">{rolesLabelMap["DIRECTEUR_SPORTIF"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="ENTRAINEUR_PRINCIPAL">{rolesLabelMap["ENTRAINEUR_PRINCIPAL"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="MEDECIN">{rolesLabelMap["MEDECIN"]}</option>}
                    </>
                  ) : (
                    <>
                      {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && editingMember?.roleTag !== "PRESIDENT" && <option value="DIRECTEUR_SPORTIF">{rolesLabelMap["DIRECTEUR_SPORTIF"]}</option>}
                      {!["SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"].includes(currentUserRole || "") && editingMember?.roleTag !== "PRESIDENT" && <option value="SECRETAIRE_GENERAL">{rolesLabelMap["SECRETAIRE_GENERAL"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="ENTRAINEUR_PRINCIPAL">{rolesLabelMap["ENTRAINEUR_PRINCIPAL"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="ENTRAINEUR_ADJOINT">{rolesLabelMap["ENTRAINEUR_ADJOINT"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="PREPARATEUR_PHYSIQUE">{rolesLabelMap["PREPARATEUR_PHYSIQUE"]}</option>}
                      {editingMember?.roleTag !== "PRESIDENT" && <option value="ENTRAINEUR_GARDIENS">{rolesLabelMap["ENTRAINEUR_GARDIENS"]}</option>}
                      {editingMember?.roleTag !== "MEDECIN" && <option value="MEDECIN">{rolesLabelMap["MEDECIN"]}</option>}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-500 uppercase mb-2">{tLoc.assignedTeams}</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isChecked = editAssignedTeams.includes(cat.id)
                    return (
                      <label
                        key={cat.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[11px] font-bold cursor-pointer select-none transition-all duration-150 ${
                          isChecked
                            ? "border-blue-500 bg-blue-500/5 text-blue-800 dark:text-blue-400 dark:border-blue-400"
                            : "border-zinc-200 hover:bg-zinc-50 text-zinc-650 dark:border-zinc-800 dark:hover:bg-zinc-850 dark:text-zinc-350"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (editRole === "ENTRAINEUR_PRINCIPAL" || editRole === "ENTRAINEUR_ADJOINT") {
                                setEditAssignedTeams([cat.id])
                              } else {
                                setEditAssignedTeams((prev) => [...prev, cat.id])
                              }
                            } else {
                              setEditAssignedTeams((prev) => prev.filter((t) => t !== cat.id))
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{cat.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-650 font-black uppercase text-[10px] tracking-wider py-3 transition-all cursor-pointer dark:border-zinc-800 dark:hover:bg-zinc-850"
                >
                  {tLoc.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 hover:from-zinc-300 hover:via-zinc-200 hover:to-zinc-400 text-emerald-800 font-black uppercase text-[10px] tracking-wider py-3 shadow-md border border-zinc-300/80 transition-all active:scale-95 cursor-pointer"
                >
                  {tLoc.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
