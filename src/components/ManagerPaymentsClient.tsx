"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/components/LanguageProvider"

interface ClubItem {
  id: string
  name: string
  creationDate: string
  subscriptionPlan?: string | null
  subscriptionStatus?: string | null
  subscriptionExpires?: string | null
  subscriptionPaid?: boolean | null
  subscriptionMethod?: string | null
}

interface SubmissionItem {
  id: string
  clubId: string
  clubName: string
  plan: string
  duration: string
  amount: number
  method: string
  attachment: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
}

interface ManagerPaymentsProps {
  initialClubs: ClubItem[]
  initialSubmissions: SubmissionItem[]
  updateClubBillingAction: (
    clubId: string,
    data: {
      name: string
      subscriptionPlan: string
      subscriptionStatus: string
      subscriptionPaid: boolean
      subscriptionExpires: string | null
    }
  ) => Promise<void>
  blockClubAction: (clubId: string, block: boolean) => Promise<void>
  deleteClubAction: (clubId: string) => Promise<void>
  approvePaymentAction: (submissionId: string) => Promise<void>
  rejectPaymentAction: (submissionId: string, reason: string) => Promise<void>
}

const paymentsDict: Record<string, Record<string, string>> = {
  FR: {
    pageTitle: "Paiements & Abonnements des Clubs",
    pageSubtitle: "Interface d'administration exclusive pour contrôler le statut de facturation, les forfaits actifs et la validité temporelle des accès club.",
    kpiTotal: "Total Structures",
    kpiTotalSub: "Clubs enregistrés au total",
    kpiPaid: "Abonnements Payants",
    kpiPaidSub: "Clubs sous offre Standard, Premium ou Elite",
    kpiFree: "Formules Gratuites",
    kpiFreeSub: "Clubs sans frais de service actifs",
    kpiBlocked: "Structures Bloquées",
    kpiBlockedSub: "Accès désactivés pour non-paiement ou suspension",
    tabClubs: "Structures / Clubs",
    tabSubmissions: "Demandes de Paiement",
    searchClubsPlaceholder: "Rechercher un club...",
    filterStatus: "Statut:",
    filterPlan: "Formule:",
    filterPrice: "Prix:",
    filterCycle: "Périodicité:",
    filterMethod: "Mode de Paiement:",
    thClub: "Club",
    thType: "Type",
    thPlan: "Formule choisie",
    thPrice: "Prix",
    thMethod: "Mode de règlement",
    thStatus: "État administratif",
    thExpiry: "Temps restant / Expiration",
    thActions: "Actions",
    noClubFound: "Aucun club ne correspond aux critères de recherche.",
    noSubFound: "Aucune demande de paiement enregistrée.",
    daysRemaining: "{days} jours restants ({date})",
    dayRemaining: "{days} jour restant ({date})",
    expiresToday: "Expire aujourd'hui",
    expiredSince: "Expiré (depuis le {date})",
    unlimited: "Illimité",
    suspended: "Suspendu",
    undefined: "Non défini",
    paid: "Payé",
    free: "Gratuit",
    none: "Aucune",
    statusActive: "Actif",
    statusExpired: "Expiré",
    statusBlocked: "Bloqué",
    btnModify: "✏️ Modifier",
    btnBlock: "Bloquer",
    btnUnblock: "Débloquer",
    btnDelete: "🗑️ Supprimer",
    thSubPlan: "Formule demandée",
    thSubDate: "Date de soumission",
    btnVerifyRequest: "🔍 Vérifier la demande",
    btnAccept: "✓ Accepter",
    btnReject: "✕ Refuser",
    modalEditTitle: "Modifier le club : {name}",
    labelClubName: "Nom de la structure",
    labelOfferType: "Type d'offre",
    offerPaid: "Payante",
    offerFree: "Gratuite",
    labelPlanForm: "Formule d'Abonnement",
    labelBillingCycle: "Périodicité de facturation",
    cycleMonthly: "Mensuelle",
    cycleYearly: "Annuelle",
    labelAdminStatus: "Statut Administratif",
    labelExpiryDate: "Date d'expiration",
    btnCancel: "Annuler",
    btnApply: "Appliquer",
    btnSaving: "Sauvegarde...",
    modalAttachmentTitle: "Pièce Jointe de Règlement",
    modalVerifyTitle: "Vérification de la Demande de Paiement",
    labelAmount: "Montant",
    labelPaymentMethod: "Méthode de paiement",
    labelCurrentStatus: "Statut actuel",
    labelRejectionReason: "Motif de refus",
    labelAttachment: "Pièce jointe justificative",
    noAttachment: "Aucune pièce jointe justificative fournie.",
    btnClose: "Fermer",
    modalRejectTitle: "Refuser le paiement : {name}",
    labelRejectionReasonInput: "Motif du Refus",
    placeholderRejectionReason: "Veuillez spécifier la raison du refus (ex: Justificatif illisible, chèque sans provision...)",
    btnRejectProgress: "Refus en cours...",
    btnConfirmReject: "Confirmer le Refus",
    alertSelectReason: "Veuillez saisir un motif de refus.",
    validationPayment: "Validation de Paiement",
    confirmValidation: "Confirmer la validation du paiement de {amount} DA pour le club \"{name}\" ?",
    successValidate: "Paiement validé avec succès !",
    errorValidate: "Erreur de validation.",
    successReject: "Paiement refusé avec succès.",
    errorReject: "Erreur de traitement.",
    toggleBlockTitle: "Bloquer le club",
    toggleUnblockTitle: "Débloquer le club",
    confirmBlock: "Voulez-vous bloquer le club \"{name}\" ? Le président et son staff n'auront plus accès au portail.",
    confirmUnblock: "Voulez-vous débloquer le club \"{name}\" ?",
    errorStatusChange: "Erreur lors du changement de statut.",
    deleteTitle: "Suppression définitive",
    confirmDelete: "⚠️ DANGER: Êtes-vous sûr de vouloir supprimer définitivement le club \"{name}\" ? Cette action est irréversible et effacera toutes les données (joueurs, entraînements, calendriers, etc.).",
    errorDelete: "Erreur lors de la suppression.",
    errUpdate: "Erreur lors de la mise à jour.",
    statusApproved: "Validé",
    statusRejected: "Refusé",
    statusPending: "En attente",
    allStatus: "Tous les statuts",
    allPlans: "Toutes les formules",
    allPrices: "Tous les prix",
    allCycles: "Toutes les fréquences",
    allMethods: "Tous les modes",
    sumTitle: "Structures / Clubs",
    sumSubmissions: "Demandes de Paiement",
    onDevis: "Sur devis",
    createdOn: "Créé le {date}"
  },
  EN: {
    pageTitle: "Payments & Club Subscriptions",
    pageSubtitle: "Exclusive administration interface to monitor billing status, active plans, and temporal validity of club access.",
    kpiTotal: "Total Structures",
    kpiTotalSub: "Total registered clubs",
    kpiPaid: "Paid Subscriptions",
    kpiPaidSub: "Clubs under Standard, Premium or Elite offer",
    kpiFree: "Free Plans",
    kpiFreeSub: "Clubs with no active service fees",
    kpiBlocked: "Blocked Structures",
    kpiBlockedSub: "Access disabled due to non-payment or suspension",
    tabClubs: "Structures / Clubs",
    tabSubmissions: "Payment Requests",
    searchClubsPlaceholder: "Search club...",
    filterStatus: "Status:",
    filterPlan: "Plan:",
    filterPrice: "Price:",
    filterCycle: "Cycle:",
    filterMethod: "Payment Method:",
    thClub: "Club",
    thType: "Type",
    thPlan: "Selected Plan",
    thPrice: "Price",
    thMethod: "Payment Method",
    thStatus: "Admin State",
    thExpiry: "Time remaining / Expiry",
    thActions: "Actions",
    noClubFound: "No club matches search criteria.",
    noSubFound: "No payment request registered.",
    daysRemaining: "{days} days left ({date})",
    dayRemaining: "{days} day left ({date})",
    expiresToday: "Expires today",
    expiredSince: "Expired (since {date})",
    unlimited: "Unlimited",
    suspended: "Suspended",
    undefined: "Not defined",
    paid: "Paid",
    free: "Free",
    none: "None",
    statusActive: "Active",
    statusExpired: "Expired",
    statusBlocked: "Blocked",
    btnModify: "✏️ Edit",
    btnBlock: "Block",
    btnUnblock: "Unblock",
    btnDelete: "🗑️ Delete",
    thSubPlan: "Requested Plan",
    thSubDate: "Submission Date",
    btnVerifyRequest: "🔍 Verify request",
    btnAccept: "✓ Accept",
    btnReject: "✕ Reject",
    modalEditTitle: "Edit club: {name}",
    labelClubName: "Structure Name",
    labelOfferType: "Offer Type",
    offerPaid: "Paid",
    offerFree: "Free",
    labelPlanForm: "Subscription Plan",
    labelBillingCycle: "Billing Cycle",
    cycleMonthly: "Monthly",
    cycleYearly: "Yearly",
    labelAdminStatus: "Administrative Status",
    labelExpiryDate: "Expiry Date",
    btnCancel: "Cancel",
    btnApply: "Apply",
    btnSaving: "Saving...",
    modalAttachmentTitle: "Payment Attachment",
    modalVerifyTitle: "Payment Request Verification",
    labelAmount: "Amount",
    labelPaymentMethod: "Payment Method",
    labelCurrentStatus: "Current Status",
    labelRejectionReason: "Rejection Reason",
    labelAttachment: "Supporting attachment",
    noAttachment: "No supporting attachment provided.",
    btnClose: "Close",
    modalRejectTitle: "Reject payment: {name}",
    labelRejectionReasonInput: "Rejection Reason",
    placeholderRejectionReason: "Please specify the reason for rejection (e.g. Unreadable receipt, insufficient funds...)",
    btnRejectProgress: "Rejecting...",
    btnConfirmReject: "Confirm Rejection",
    alertSelectReason: "Please enter a rejection reason.",
    validationPayment: "Payment Verification",
    confirmValidation: "Confirm validation of payment of {amount} DA for club \"{name}\"?",
    successValidate: "Payment successfully validated!",
    errorValidate: "Validation error.",
    successReject: "Payment rejected successfully.",
    errorReject: "Processing error.",
    toggleBlockTitle: "Block Club",
    toggleUnblockTitle: "Unblock Club",
    confirmBlock: "Do you want to block the club \"{name}\"? The president and their staff will no longer have access to the portal.",
    confirmUnblock: "Do you want to unblock the club \"{name}\"?",
    errorStatusChange: "Error during status change.",
    deleteTitle: "Permanent Deletion",
    confirmDelete: "⚠️ DANGER: Are you sure you want to permanently delete the club \"{name}\"? This action is irreversible and will erase all data (players, training sessions, schedules, etc.).",
    errorDelete: "Error during deletion.",
    errUpdate: "Error during update.",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    statusPending: "Pending",
    allStatus: "All statuses",
    allPlans: "All plans",
    allPrices: "All prices",
    allCycles: "All cycles",
    allMethods: "All methods",
    sumTitle: "Structures / Clubs",
    sumSubmissions: "Payment Requests",
    onDevis: "On quote",
    createdOn: "Created on {date}"
  },
  AR: {
    pageTitle: "المدفوعات واشتراكات الأندية",
    pageSubtitle: "واجهة إدارية حصرية لمراقبة حالة الفواتير، الباقات النشطة، والصلاحية الزمنية للوصول إلى النادي.",
    kpiTotal: "إجمالي الهياكل",
    kpiTotalSub: "إجمالي الأندية المسجلة",
    kpiPaid: "الاشتراكات المدفوعة",
    kpiPaidSub: "الأندية المشتركة في العرض القياسي أو المميز أو النخبة",
    kpiFree: "الباقات المجانية",
    kpiFreeSub: "الأندية بدون رسوم خدمة نشطة",
    kpiBlocked: "الهياكل المحظورة",
    kpiBlockedSub: "تم إيقاف الوصول بسبب عدم الدفع أو التعليق",
    tabClubs: "الهياكل / الأندية",
    tabSubmissions: "طلبات الدفع",
    searchClubsPlaceholder: "البحث عن نادٍ...",
    filterStatus: "الحالة:",
    filterPlan: "الباقة:",
    filterPrice: "السعر:",
    filterCycle: "الدورية:",
    filterMethod: "طريقة الدفع:",
    thClub: "النادي",
    thType: "النوع",
    thPlan: "الباقة المختارة",
    thPrice: "السعر",
    thMethod: "طريقة السداد",
    thStatus: "الحالة الإدارية",
    thExpiry: "الوقت المتبقي / تاريخ الانتهاء",
    thActions: "إجراءات",
    noClubFound: "لا توجد أندية تطابق معايير البحث.",
    noSubFound: "لا توجد طلبات دفع مسجلة.",
    daysRemaining: "متبقي {days} يوم ({date})",
    dayRemaining: "متبقي {days} يوم ({date})",
    expiresToday: "تنتهي الصلاحية اليوم",
    expiredSince: "منتهي (منذ {date})",
    unlimited: "غير محدود",
    suspended: "معلق",
    undefined: "غير محدد",
    paid: "مدفوع",
    free: "مجاني",
    none: "لا يوجد",
    statusActive: "نشط",
    statusExpired: "منتهي",
    statusBlocked: "محظور",
    btnModify: "✏️ تعديل",
    btnBlock: "حظر",
    btnUnblock: "إلغاء الحظر",
    btnDelete: "🗑️ حذف",
    thSubPlan: "الباقة المطلوبة",
    thSubDate: "تاريخ التقديم",
    btnVerifyRequest: "🔍 التحقق من الطلب",
    btnAccept: "✓ قبول",
    btnReject: "✕ رفض",
    modalEditTitle: "تعديل النادي: {name}",
    labelClubName: "اسم الهيكل / النادي",
    labelOfferType: "نوع العرض",
    offerPaid: "مدفوع",
    offerFree: "مجاني",
    labelPlanForm: "باقة الاشتراك",
    labelBillingCycle: "دورية الفوترة",
    cycleMonthly: "شهري",
    cycleYearly: "سنوي",
    labelAdminStatus: "الحالة الإدارية",
    labelExpiryDate: "تاريخ الانتهاء",
    btnCancel: "إلغاء",
    btnApply: "تطبيق",
    btnSaving: "جاري الحفظ...",
    modalAttachmentTitle: "مرفق السداد",
    modalVerifyTitle: "التحقق من طلب الدفع",
    labelAmount: "المبلغ",
    labelPaymentMethod: "طريقة الدفع",
    labelCurrentStatus: "الحالة الحالية",
    labelRejectionReason: "سبب الرفض",
    labelAttachment: "المستند المرفق",
    noAttachment: "لم يتم توفير أي مستند مرفق.",
    btnClose: "إغلاق",
    modalRejectTitle: "رفض الدفع: {name}",
    labelRejectionReasonInput: "سبب الرفض",
    placeholderRejectionReason: "يرجى تحديد سبب الرفض (مثال: إيصال غير واضح، شيك بدون رصيد...)",
    btnRejectProgress: "جاري الرفض...",
    btnConfirmReject: "تأكيد الرفض",
    alertSelectReason: "يرجى إدخال سبب الرفض.",
    validationPayment: "التحقق من الدفع",
    confirmValidation: "تأكيد التحقق من دفع {amount} د.ج لنادي \"{name}\"؟",
    successValidate: "تم التحقق من الدفع بنجاح!",
    errorValidate: "حدث خطأ في التحقق.",
    successReject: "تم رفض الدفع بنجاح.",
    errorReject: "حدث خطأ في المعالجة.",
    toggleBlockTitle: "حظر النادي",
    toggleUnblockTitle: "إلغاء حظر النادي",
    confirmBlock: "هل تريد حظر نادي \"{name}\"؟ لن يتمكن الرئيس وطاقمه من الوصول إلى البوابة.",
    confirmUnblock: "هل تريد إلغاء حظر نادي \"{name}\"؟",
    errorStatusChange: "حدث خطأ أثناء تغيير الحالة.",
    deleteTitle: "حذف نهائي",
    confirmDelete: "⚠️ خطر: هل أنت متأكد من رغبتك في حذف نادي \"{name}\" نهائيًا؟ هذا الإجراء غير قابل للتراجع وسيؤدي إلى مسح جميع البيانات (اللاعبين، التدريبات، الجداول الزمنية، إلخ).",
    errorDelete: "حدث خطأ أثناء الحذف.",
    errUpdate: "حدث خطأ أثناء التحديث.",
    statusApproved: "مقبول",
    statusRejected: "مرفوض",
    statusPending: "قيد الانتظار",
    allStatus: "جميع الحالات",
    allPlans: "جميع الباقات",
    allPrices: "جميع الأسعار",
    allCycles: "جميع الترددات",
    allMethods: "جميع الطرق",
    sumTitle: "الهياكل / الأندية",
    sumSubmissions: "طلبات الدفع",
    onDevis: "حسب الطلب",
    createdOn: "أنشئ في {date}"
  }
}

const PLAN_LABELS: Record<string, Record<string, string>> = {
  FR: {
    "1 Équipe": "1 Équipe",
    "Club": "Club",
    "Professionnel": "Professionnel",
    "Elite": "Elite",
    "Gratuit": "Gratuit"
  },
  EN: {
    "1 Équipe": "1 Team",
    "Club": "Club",
    "Professionnel": "Professional",
    "Elite": "Elite",
    "Gratuit": "Free"
  },
  AR: {
    "1 Équipe": "فريق واحد",
    "Club": "نادي",
    "Professionnel": "محترف",
    "Elite": "نخبة",
    "Gratuit": "مجاني"
  }
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  FR: {
    "Actif": "Actif",
    "Expiré": "Expiré",
    "Bloqué": "Bloqué"
  },
  EN: {
    "Actif": "Active",
    "Expiré": "Expired",
    "Bloqué": "Blocked"
  },
  AR: {
    "Actif": "نشط",
    "Expiré": "منتهي",
    "Bloqué": "محظور"
  }
}

const CYCLE_LABELS: Record<string, Record<string, string>> = {
  FR: {
    "Mensuel": "Mensuel",
    "Annuel": "Annuel"
  },
  EN: {
    "Mensuel": "Monthly",
    "Annuel": "Yearly"
  },
  AR: {
    "Mensuel": "شهري",
    "Annuel": "سنوي"
  }
}

export default function ManagerPaymentsClient({
  initialClubs,
  initialSubmissions,
  updateClubBillingAction,
  blockClubAction,
  deleteClubAction,
  approvePaymentAction,
  rejectPaymentAction,
}: ManagerPaymentsProps) {
  const { language } = useLanguage()
  const tLoc = paymentsDict[language] || paymentsDict["FR"]
  const plansMap = PLAN_LABELS[language] || PLAN_LABELS["FR"]
  const statusMap = STATUS_LABELS[language] || STATUS_LABELS["FR"]
  const cycleMap = CYCLE_LABELS[language] || CYCLE_LABELS["FR"]

  const [clubs, setClubs] = useState<ClubItem[]>(initialClubs)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions)
  const [isPending, startTransition] = useTransition()

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    isDanger?: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    title: "",
    message: "",
    isDanger: false,
    onConfirm: () => {}
  })
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<"CLUBS" | "SUBMISSIONS">("CLUBS")
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null)

  // Verification & Rejection States
  const [verifyingSub, setVerifyingSub] = useState<SubmissionItem | null>(null)
  const [rejectingSub, setRejectingSub] = useState<SubmissionItem | null>(null)
  const [rejectionReasonInput, setRejectionReasonInput] = useState("")

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "FREE" | "BLOCKED" | "EXPIRED">("ALL")
  const [typeFilter, setTypeFilter] = useState<"ALL" | "1 Équipe" | "Club" | "Professionnel" | "Elite" | "Gratuit">("ALL")
  const [priceFilter, setPriceFilter] = useState<"ALL" | "0" | "10000" | "15000" | "20000" | "25000" | "100000" | "144000" | "192000" | "240000">("ALL")
  const [cycleFilter, setCycleFilter] = useState<"ALL" | "MONTHLY" | "YEARLY">("ALL")
  const [methodFilter, setMethodFilter] = useState<"ALL" | "BARIDIMOB" | "SERIAL" | "CHEQUE" | "GRATUIT" | "EN_ATTENTE">("ALL")

  // Modal Editing State
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editIsPaid, setEditIsPaid] = useState(true)
  const [editPlan, setEditPlan] = useState("1 Équipe")
  const [editCycle, setEditCycle] = useState<"Mensuel" | "Annuel">("Mensuel")
  const [editStatus, setEditStatus] = useState("Actif")
  const [editExpiry, setEditExpiry] = useState("")

  // Calculate remaining days helper
  const getRemainingTimeDetails = (expiresStr: string | null, isPaid: boolean, status: string | null) => {
    if (status === "Bloqué") {
      return { text: tLoc.suspended, colorClass: "text-zinc-550 bg-zinc-100 dark:bg-zinc-800/80" }
    }
    if (!isPaid) {
      return { text: tLoc.unlimited, colorClass: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20" }
    }
    if (!expiresStr) {
      return { text: tLoc.undefined, colorClass: "text-zinc-400 bg-zinc-50" }
    }

    const expiry = new Date(expiresStr)
    const today = new Date()
    expiry.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formattedDate = expiry.toLocaleDateString(language === "AR" ? "ar-EG" : language === "EN" ? "en-US" : "fr-FR", { day: "numeric", month: "short", year: "numeric" })

    if (diffDays < 0) {
      return { 
        text: tLoc.expiredSince.replace("{date}", formattedDate), 
        colorClass: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/20" 
      }
    } else if (diffDays === 0) {
      return { 
        text: tLoc.expiresToday, 
        colorClass: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 font-bold" 
      }
    } else {
      const template = diffDays > 1 ? tLoc.daysRemaining : tLoc.dayRemaining
      return { 
        text: template.replace("{days}", String(diffDays)).replace("{date}", formattedDate), 
        colorClass: "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20" 
      }
    }
  }

  const getPlanPrice = (plan: string | null | undefined, isPaid: boolean | null | undefined) => {
    if (!isPaid) return "0 DA"
    const name = plan || "1 Équipe"
    const isAnnuel = name.includes("Annuel")
    const p = name.replace(" (Annuel)", "").toLowerCase().trim()
    
    if (p === "1 équipe" || p === "1 equipe" || p === "standard") {
      return isAnnuel 
        ? (language === "AR" ? "100 000 د.ج / سنة" : language === "EN" ? "100,000 DA / year" : "100 000 DA / an")
        : (language === "AR" ? "10 000 د.ج / شهر" : language === "EN" ? "10,000 DA / month" : "10 000 DA / mois")
    }
    if (p === "club" || p === "pro") {
      return isAnnuel 
        ? (language === "AR" ? "144 000 د.ج / سنة" : language === "EN" ? "144,000 DA / year" : "144 000 DA / an")
        : (language === "AR" ? "15 000 د.ج / شهر" : language === "EN" ? "15,000 DA / month" : "15 000 DA / mois")
    }
    if (p === "professionnel" || p === "premium") {
      return isAnnuel 
        ? (language === "AR" ? "192 000 د.ج / سنة" : language === "EN" ? "192,000 DA / year" : "192 000 DA / an")
        : (language === "AR" ? "20 000 د.ج / شهر" : language === "EN" ? "20,000 DA / month" : "20 000 DA / mois")
    }
    if (p === "elite") {
      return isAnnuel 
        ? (language === "AR" ? "240 000 د.ج / سنة" : language === "EN" ? "240,000 DA / year" : "240 000 DA / an")
        : (language === "AR" ? "25 000 د.ج / شهر" : language === "EN" ? "25,000 DA / month" : "25 000 DA / mois")
    }
    return tLoc.onDevis
  }

  // Handle Action: Open edit modal
  const handleOpenEdit = (club: ClubItem) => {
    setEditingClub(club)
    setEditName(club.name)
    setEditIsPaid(club.subscriptionPaid ?? true)
    
    let planName = club.subscriptionPlan ?? "1 Équipe"
    const isAnnuel = planName.includes("Annuel")
    planName = planName.replace(" (Annuel)", "").trim()

    // normalize legacy values
    if (planName === "Standard" || planName === "1 equipe") {
      planName = "1 Équipe"
    } else if (planName === "Pro") {
      planName = "Club"
    } else if (planName === "Premium") {
      planName = "Professionnel"
    }

    if (isAnnuel) {
      setEditCycle("Annuel")
      setEditPlan(planName)
    } else {
      setEditCycle("Mensuel")
      setEditPlan(planName)
    }

    setEditStatus(club.subscriptionStatus ?? "Actif")
    if (club.subscriptionExpires) {
      // Format to YYYY-MM-DD for input type="date"
      const date = new Date(club.subscriptionExpires)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      setEditExpiry(`${yyyy}-${mm}-${dd}`)
    } else {
      setEditExpiry("")
    }
  }

  // Handle Action: Save edited club
  const handleSaveEdit = async () => {
    if (!editingClub) return
    
    const finalPlan = editIsPaid 
      ? (editCycle === "Annuel" ? `${editPlan} (Annuel)` : editPlan) 
      : "Gratuit"
    const finalPaid = editIsPaid
    
    // Automatically set expiration if none provided for active paid subscriptions
    let finalExpiry = editExpiry ? new Date(editExpiry).toISOString() : null
    if (finalPaid && !finalExpiry) {
      const defaultExp = new Date()
      if (editCycle === "Annuel") {
        defaultExp.setDate(defaultExp.getDate() + 365)
      } else {
        defaultExp.setDate(defaultExp.getDate() + 30)
      }
      finalExpiry = defaultExp.toISOString()
    }

    startTransition(async () => {
      try {
        await updateClubBillingAction(editingClub.id, {
          name: editName,
          subscriptionPlan: finalPlan,
          subscriptionStatus: editStatus,
          subscriptionPaid: finalPaid,
          subscriptionExpires: finalExpiry,
        })
        
        // Update local state
        setClubs((prev) =>
          prev.map((c) =>
            c.id === editingClub.id
              ? {
                  ...c,
                  name: editName,
                  subscriptionPlan: finalPlan,
                  subscriptionStatus: editStatus,
                  subscriptionPaid: finalPaid,
                  subscriptionExpires: finalExpiry,
                }
              : c
          )
        )
        setEditingClub(null)
      } catch (err) {
        console.error(err)
        alert(tLoc.errUpdate)
      }
    })
  }

  const handleApproveSubmission = (sub: SubmissionItem) => {
    setConfirmModal({
      isOpen: true,
      title: tLoc.validationPayment,
      message: tLoc.confirmValidation.replace("{amount}", sub.amount.toLocaleString()).replace("{name}", sub.clubName),
      isDanger: false,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await approvePaymentAction(sub.id)
            setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "APPROVED" } : s))
            alert(tLoc.successValidate)
            window.location.reload()
          } catch (err) {
            console.error(err)
            alert(tLoc.errorValidate)
          }
        })
      }
    })
  }

  const handleRejectSubmission = async (sub: SubmissionItem, reason: string) => {
    startTransition(async () => {
      try {
        await rejectPaymentAction(sub.id, reason)
        setSubmissions(prev => prev.map(s => s.id === sub.id ? { ...s, status: "REJECTED", rejectionReason: reason } : s))
        alert(tLoc.successReject)
        window.location.reload()
      } catch (err) {
        console.error(err)
        alert(tLoc.errorReject)
      }
    })
  }

  // Handle Action: Toggle block status
  const handleToggleBlock = (club: ClubItem) => {
    const isCurrentlyBlocked = club.subscriptionStatus === "Bloqué"
    const confirmMessage = isCurrentlyBlocked 
      ? tLoc.confirmUnblock.replace("{name}", club.name)
      : tLoc.confirmBlock.replace("{name}", club.name)
      
    setConfirmModal({
      isOpen: true,
      title: isCurrentlyBlocked ? tLoc.toggleUnblockTitle : tLoc.toggleBlockTitle,
      message: confirmMessage,
      isDanger: !isCurrentlyBlocked,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await blockClubAction(club.id, !isCurrentlyBlocked)
            
            // Update local state
            setClubs((prev) =>
              prev.map((c) =>
                c.id === club.id
                  ? {
                      ...c,
                      subscriptionStatus: isCurrentlyBlocked ? "Actif" : "Bloqué",
                    }
                  : c
              )
            )
          } catch (err) {
            console.error(err)
            alert(tLoc.errorStatusChange)
          }
        })
      }
    })
  }

  // Handle Action: Delete club
  const handleConfirmDelete = (club: ClubItem) => {
    setConfirmModal({
      isOpen: true,
      title: tLoc.deleteTitle,
      message: tLoc.confirmDelete.replace("{name}", club.name),
      isDanger: true,
      onConfirm: () => {
        startTransition(async () => {
          try {
            await deleteClubAction(club.id)
            
            // Update local state
            setClubs((prev) => prev.filter((c) => c.id !== club.id))
          } catch (err) {
            console.error(err)
            alert(tLoc.errorDelete)
          }
        })
      }
    })
  }

  // Filters calculation
  const filteredClubs = clubs.filter((club) => {
    // Search filter
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    let matchesStatus = true
    if (statusFilter === "PAID") {
      matchesStatus = !!club.subscriptionPaid && club.subscriptionStatus !== "Bloqué"
    } else if (statusFilter === "FREE") {
      matchesStatus = !club.subscriptionPaid && club.subscriptionStatus !== "Bloqué"
    } else if (statusFilter === "BLOCKED") {
      matchesStatus = club.subscriptionStatus === "Bloqué"
    } else if (statusFilter === "EXPIRED") {
      // expired status or negative remaining days
      const isExpired = club.subscriptionStatus === "Expiré" || 
        (!!club.subscriptionPaid && club.subscriptionExpires && new Date(club.subscriptionExpires).getTime() < Date.now())
      matchesStatus = !!isExpired && club.subscriptionStatus !== "Bloqué"
    }

    // Type filter
    let matchesType = true
    if (typeFilter !== "ALL") {
      if (typeFilter === "Gratuit") {
        matchesType = !club.subscriptionPaid
      } else {
        const p = (club.subscriptionPlan || "1 Équipe").replace(" (Annuel)", "").toLowerCase().trim()
        const target = typeFilter.toLowerCase().trim()
        
        if (target === "1 équipe") {
          matchesType = club.subscriptionPaid === true && (p === "1 équipe" || p === "1 equipe" || p === "standard")
        } else if (target === "club") {
          matchesType = club.subscriptionPaid === true && (p === "club" || p === "pro")
        } else if (target === "professionnel") {
          matchesType = club.subscriptionPaid === true && (p === "professionnel" || p === "premium")
        } else if (target === "elite") {
          matchesType = club.subscriptionPaid === true && p === "elite"
        }
      }
    }

    // Price filter
    let matchesPrice = true
    if (priceFilter !== "ALL") {
      const priceVal = getPlanPrice(club.subscriptionPlan, club.subscriptionPaid)
      if (priceFilter === "0") {
        matchesPrice = priceVal.includes("0 DA")
      } else if (priceFilter === "10000") {
        matchesPrice = priceVal.includes("10 000 DA") && !priceVal.includes("/ an")
      } else if (priceFilter === "15000") {
        matchesPrice = priceVal.includes("15 000 DA")
      } else if (priceFilter === "20000") {
        matchesPrice = priceVal.includes("20 000 DA")
      } else if (priceFilter === "25000") {
        matchesPrice = priceVal.includes("25 000 DA")
      } else if (priceFilter === "100000") {
        matchesPrice = priceVal.includes("100 000 DA")
      } else if (priceFilter === "144000") {
        matchesPrice = priceVal.includes("144 000 DA")
      } else if (priceFilter === "192000") {
        matchesPrice = priceVal.includes("192 000 DA")
      } else if (priceFilter === "240000") {
        matchesPrice = priceVal.includes("240 000 DA")
      }
    }

    // Cycle filter
    let matchesCycle = true
    if (cycleFilter !== "ALL") {
      const isAnnuel = club.subscriptionPlan?.includes("Annuel")
      if (cycleFilter === "YEARLY") {
        matchesCycle = !!isAnnuel && !!club.subscriptionPaid
      } else if (cycleFilter === "MONTHLY") {
        matchesCycle = !isAnnuel && !!club.subscriptionPaid
      }
    }

    // Method filter
    let matchesMethod = true
    if (methodFilter !== "ALL") {
      if (methodFilter === "BARIDIMOB") {
        matchesMethod = club.subscriptionMethod === "BARIDIMOB"
      } else if (methodFilter === "SERIAL") {
        matchesMethod = club.subscriptionMethod === "SERIAL"
      } else if (methodFilter === "CHEQUE") {
        matchesMethod = club.subscriptionMethod === "CHEQUE"
      } else if (methodFilter === "GRATUIT") {
        matchesMethod = !club.subscriptionPaid || club.subscriptionMethod === "Gratuit"
      } else if (methodFilter === "EN_ATTENTE") {
        matchesMethod = club.subscriptionMethod === "EN_ATTENTE"
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesPrice && matchesCycle && matchesMethod
  })

  // Calculations for KPIs
  const totalClubs = clubs.length
  const paidClubs = clubs.filter(c => c.subscriptionPaid && c.subscriptionStatus !== "Bloqué").length
  const freeClubs = clubs.filter(c => !c.subscriptionPaid && c.subscriptionStatus !== "Bloqué").length
  const blockedClubs = clubs.filter(c => c.subscriptionStatus === "Bloqué").length

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {tLoc.pageTitle}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {tLoc.pageSubtitle}
          </p>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">{tLoc.kpiTotal}</span>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight pt-2">{totalClubs}</p>
          <p className="text-[10px] text-zinc-400 font-bold pt-1">{tLoc.kpiTotalSub}</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm dark:bg-zinc-900/50">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">{tLoc.kpiPaid}</span>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight pt-2">{paidClubs}</p>
          <p className="text-[10px] text-zinc-400 font-bold pt-1">{tLoc.kpiPaidSub}</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-sm dark:bg-zinc-900/50">
          <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">{tLoc.kpiFree}</span>
          <p className="text-3xl font-black text-blue-700 dark:text-blue-400 tracking-tight pt-2">{freeClubs}</p>
          <p className="text-[10px] text-zinc-400 font-bold pt-1">{tLoc.kpiFreeSub}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-sm dark:bg-zinc-900/50">
          <span className="text-[10px] font-black uppercase text-red-655 tracking-wider">{tLoc.kpiBlocked}</span>
          <p className="text-3xl font-black text-red-700 dark:text-red-400 tracking-tight pt-2">{blockedClubs}</p>
          <p className="text-[10px] text-zinc-400 font-bold pt-1">{tLoc.kpiBlockedSub}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-4">
        <button
          onClick={() => setActiveTab("CLUBS")}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
            activeTab === "CLUBS"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-605"
          }`}
        >
          {tLoc.tabClubs}
        </button>
        <button
          onClick={() => setActiveTab("SUBMISSIONS")}
          className={`pb-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "SUBMISSIONS"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:text-zinc-655"
          }`}
        >
          {tLoc.tabSubmissions}
          {submissions.filter(s => s.status === "PENDING").length > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[9px] font-black animate-pulse">
              {submissions.filter(s => s.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "CLUBS" ? (
        /* Filter and Search Bar */
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Search bar */}
          <div className="relative w-full lg:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={tLoc.searchClubsPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
            />
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-450 uppercase whitespace-nowrap">{tLoc.filterStatus}</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <option value="ALL">{tLoc.allStatus}</option>
                <option value="PAID">{tLoc.paid}</option>
                <option value="FREE">{tLoc.free}</option>
                <option value="BLOCKED">{tLoc.statusBlocked}</option>
                <option value="EXPIRED">{tLoc.statusExpired}</option>
              </select>
            </div>

            {/* Type/Plan Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-450 uppercase whitespace-nowrap">{tLoc.filterPlan}</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <option value="ALL">{tLoc.allPlans}</option>
                <option value="1 Équipe">{plansMap["1 Équipe"] || "1 Équipe"}</option>
                <option value="Club">{plansMap["Club"] || "Club"}</option>
                <option value="Professionnel">{plansMap["Professionnel"] || "Professionnel"}</option>
                <option value="Elite">{plansMap["Elite"] || "Elite"}</option>
                <option value="Gratuit">{tLoc.free}</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-450 uppercase whitespace-nowrap">{tLoc.filterPrice}</span>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <option value="ALL">{tLoc.allPrices}</option>
                <option value="0">{language === "AR" ? "0 د.ج (مجاني)" : language === "EN" ? "0 DA (Free)" : "0 DA (Gratuit)"}</option>
                <option value="10000">{language === "AR" ? "10 000 د.ج / شهر" : language === "EN" ? "10,000 DA / month" : "10 000 DA / mois"}</option>
                <option value="15000">{language === "AR" ? "15 000 د.ج / شهر" : language === "EN" ? "15,000 DA / month" : "15 000 DA / mois"}</option>
                <option value="20000">{language === "AR" ? "20 000 د.ج / شهر" : language === "EN" ? "20,000 DA / month" : "20 000 DA / mois"}</option>
                <option value="25000">{language === "AR" ? "25 000 د.ج / شهر" : language === "EN" ? "25,000 DA / month" : "25 000 DA / mois"}</option>
                <option value="100000">{language === "AR" ? "100 000 د.ج / سنة" : language === "EN" ? "100,000 DA / year" : "100 000 DA / an"}</option>
                <option value="144000">{language === "AR" ? "144 000 د.ج / سنة" : language === "EN" ? "144,000 DA / year" : "144 000 DA / an"}</option>
                <option value="192000">{language === "AR" ? "192 000 د.ج / سنة" : language === "EN" ? "192,000 DA / year" : "192 000 DA / an"}</option>
                <option value="240000">{language === "AR" ? "240 000 د.ج / سنة" : language === "EN" ? "240,000 DA / year" : "240 000 DA / an"}</option>
              </select>
            </div>

            {/* Cycle Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-450 uppercase whitespace-nowrap">{tLoc.filterCycle}</span>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <option value="ALL">{tLoc.allCycles}</option>
                <option value="MONTHLY">{language === "AR" ? "شهرية" : language === "EN" ? "Monthly" : "Mensuelle"}</option>
                <option value="YEARLY">{language === "AR" ? "سنوية" : language === "EN" ? "Yearly" : "Annuelle"}</option>
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-450 uppercase whitespace-nowrap">{tLoc.filterMethod}</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-emerald-500 dark:bg-zinc-950 dark:border-zinc-800"
              >
                <option value="ALL">{tLoc.allMethods}</option>
                <option value="BARIDIMOB">BaridiMob</option>
                <option value="SERIAL">{language === "AR" ? "رمز تسلسلي" : language === "EN" ? "Serial Code" : "Code Série"}</option>
                <option value="CHEQUE">{language === "AR" ? "صك" : language === "EN" ? "Cheque" : "Chèque"}</option>
                <option value="GRATUIT">{language === "AR" ? "تجريبي / مجاني" : language === "EN" ? "Trial / Free" : "Essai / Gratuit"}</option>
                <option value="EN_ATTENTE">{tLoc.statusPending}</option>
              </select>
            </div>
          </div>

        </div>

        {/* Clubs List Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-150/80 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                <th className="pb-3 pr-4">{tLoc.thClub}</th>
                <th className="pb-3 pr-4">{tLoc.thType}</th>
                <th className="pb-3 pr-4">{tLoc.thPlan}</th>
                <th className="pb-3 pr-4">{tLoc.thPrice}</th>
                <th className="pb-3 pr-4">{tLoc.thMethod}</th>
                <th className="pb-3 pr-4">{tLoc.thStatus}</th>
                <th className="pb-3 pr-4">{tLoc.thExpiry}</th>
                <th className="pb-3 text-right">{tLoc.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/60 text-xs font-semibold">
              {filteredClubs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 font-medium">
                    {tLoc.noClubFound}
                  </td>
                </tr>
              ) : (
                filteredClubs.map((club) => {
                  const remTime = getRemainingTimeDetails(
                    club.subscriptionExpires ?? null,
                    club.subscriptionPaid ?? true,
                    club.subscriptionStatus ?? null
                  )
                  const isBlocked = club.subscriptionStatus === "Bloqué"
                  
                  return (
                     <tr key={club.id} className="group hover:bg-zinc-50/50 transition-colors">
                      {/* Name */}
                      <td className="py-4 pr-4">
                        <div className="font-bold text-zinc-900 dark:text-white">{club.name}</div>
                        <div className="text-[10px] text-zinc-400 font-bold">
                          {tLoc.createdOn.replace("{date}", new Date(club.creationDate).toLocaleDateString(language === "AR" ? "ar-EG" : language === "EN" ? "en-US" : "fr-FR"))}
                        </div>
                      </td>

                      {/* Type: Payé / Gratuit */}
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          club.subscriptionPaid 
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/5 dark:text-emerald-400" 
                            : "bg-zinc-550/10 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {club.subscriptionPaid ? tLoc.paid : tLoc.free}
                        </span>
                      </td>

                      {/* Chosen Plan */}
                      <td className="py-4 pr-4">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {club.subscriptionPaid ? (() => {
                            const name = club.subscriptionPlan || "1 Équipe"
                            const isAnnuel = name.includes("Annuel")
                            let normalized = name.replace(" (Annuel)", "").trim()
                            if (normalized === "Standard" || normalized === "1 equipe") normalized = "1 Équipe"
                            else if (normalized === "Pro") normalized = "Club"
                            else if (normalized === "Premium") normalized = "Professionnel"
                            return isAnnuel 
                              ? `${plansMap[normalized] || normalized} (${language === "AR" ? "سنوي" : language === "EN" ? "Yearly" : "Annuel"})` 
                              : plansMap[normalized] || normalized
                          })() : tLoc.none}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 pr-4">
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {getPlanPrice(club.subscriptionPlan, club.subscriptionPaid)}
                        </span>
                      </td>

                      {/* Mode de règlement */}
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          club.subscriptionMethod === "BARIDIMOB"
                            ? "bg-blue-100 text-blue-805 dark:bg-blue-950/50 dark:text-blue-400"
                            : club.subscriptionMethod === "SERIAL"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400"
                            : club.subscriptionMethod === "CHEQUE"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400"
                        }`}>
                          {club.subscriptionMethod === "BARIDIMOB" ? "BaridiMob" :
                           club.subscriptionMethod === "SERIAL" ? (language === "AR" ? "رمز تسلسلي" : language === "EN" ? "Serial Code" : "Code Série") :
                           club.subscriptionMethod === "CHEQUE" ? (language === "AR" ? "صك" : language === "EN" ? "Cheque" : "Chèque") :
                           (language === "AR" ? "مجاني" : language === "EN" ? "Free" : "Gratuit")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isBlocked 
                            ? "bg-red-950 text-red-300 border border-red-900" 
                            : club.subscriptionStatus === "Expiré" 
                            ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {isBlocked ? tLoc.statusBlocked : statusMap[club.subscriptionStatus ?? "Actif"] || club.subscriptionStatus}
                        </span>
                      </td>

                      {/* Time Remaining */}
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold ${remTime.colorClass}`}>
                          {remTime.text}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          {/* Modifier */}
                          <button
                            onClick={() => handleOpenEdit(club)}
                            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
                          >
                            {tLoc.btnModify}
                          </button>

                          {/* Bloquer / Débloquer */}
                          <button
                            onClick={() => handleToggleBlock(club)}
                            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer ${
                              isBlocked 
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/15" 
                                : "bg-red-500/10 text-red-600 hover:bg-red-500/15"
                            }`}
                          >
                            🔒 {isBlocked ? tLoc.btnUnblock : tLoc.btnBlock}
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => handleConfirmDelete(club)}
                            className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                          >
                            {tLoc.btnDelete}
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
      ) : (
        /* Submissions view */
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150/80 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="pb-3 pr-4">{tLoc.thClub}</th>
                  <th className="pb-3 pr-4">{tLoc.thSubPlan}</th>
                  <th className="pb-3 pr-4">{tLoc.thMethod}</th>
                  <th className="pb-3 pr-4">{tLoc.labelAmount}</th>
                  <th className="pb-3 pr-4">{tLoc.thSubDate}</th>
                  <th className="pb-3 pr-4">{tLoc.thStatus}</th>
                  <th className="pb-3 text-right">{tLoc.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100/60 text-xs font-semibold">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-400 font-medium">
                      {tLoc.noSubFound}
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 pr-4">
                        <p className="font-bold text-zinc-900 dark:text-white uppercase">{sub.clubName}</p>
                        <p className="text-[9px] text-zinc-400 font-medium">ID Club: {sub.clubId}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="inline-flex rounded bg-zinc-100 dark:bg-zinc-850 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-350">
                          {plansMap[sub.plan] || sub.plan} ({sub.duration === "YEARLY" ? (language === "AR" ? "سنوي" : language === "EN" ? "Yearly" : "Annuel") : (language === "AR" ? "شهري" : language === "EN" ? "Monthly" : "Mensuel")})
                        </span>
                      </td>
                      <td className="py-4 pr-4 font-mono font-bold uppercase text-zinc-750 dark:text-zinc-300">
                        {sub.method}
                      </td>
                      <td className="py-4 pr-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {sub.amount.toLocaleString()} DA
                      </td>
                      <td className="py-4 pr-4 text-zinc-500">
                        {new Date(sub.createdAt).toLocaleDateString(language === "AR" ? "ar-EG" : language === "EN" ? "en-US" : "fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          sub.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : sub.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse"
                        }`}>
                          {sub.status === "APPROVED" ? tLoc.approved : sub.status === "REJECTED" ? tLoc.rejected : tLoc.statusPending}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setVerifyingSub(sub)}
                            className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-350 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer"
                          >
                            🔍 {tLoc.btnVerifySub}
                          </button>
                          
                          {sub.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApproveSubmission(sub)}
                                className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                              >
                                ✓ {tLoc.btnAccept}
                              </button>
                              <button
                                onClick={() => setRejectingSub(sub)}
                                className="rounded-lg bg-red-650 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
                              >
                                ✕ {tLoc.btnReject}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Editing Modal */}
      {editingClub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b dark:border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-855 dark:text-white">
                {tLoc.editClubTitle.replace("{name}", editingClub.name)}
              </h3>
              <button 
                onClick={() => setEditingClub(null)} 
                className="text-zinc-400 hover:text-zinc-655 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelClubName}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Offer Type: Paid / Free */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelOfferType}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700 dark:text-zinc-350">
                    <input
                      type="radio"
                      checked={editIsPaid === true}
                      onChange={() => setEditIsPaid(true)}
                      className="accent-emerald-600"
                    />
                    {tLoc.paid}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700 dark:text-zinc-350">
                    <input
                      type="radio"
                      checked={editIsPaid === false}
                      onChange={() => setEditIsPaid(false)}
                      className="accent-emerald-600"
                    />
                    {tLoc.free}
                  </label>
                </div>
              </div>

              {/* If Paid, select Formula/Plan */}
              {editIsPaid && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelPlan}</label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                    >
                      <option value="1 Équipe">{plansMap["1 Équipe"] || "1 Équipe"}</option>
                      <option value="Club">{plansMap["Club"] || "Club"}</option>
                      <option value="Professionnel">{plansMap["Professionnel"] || "Professionnel"}</option>
                      <option value="Elite">{plansMap["Elite"] || "Elite"}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelCycle}</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700 dark:text-zinc-350">
                        <input
                          type="radio"
                          name="editCycle"
                          checked={editCycle === "Mensuel"}
                          onChange={() => setEditCycle("Mensuel")}
                          className="accent-emerald-600"
                        />
                        {language === "AR" ? "شهرية" : language === "EN" ? "Monthly" : "Mensuelle"}
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-700 dark:text-zinc-350">
                        <input
                          type="radio"
                          name="editCycle"
                          checked={editCycle === "Annuel"}
                          onChange={() => setEditCycle("Annuel")}
                          className="accent-emerald-600"
                        />
                        {language === "AR" ? "سنوية" : language === "EN" ? "Yearly" : "Annuelle"}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Administrative Status */}
              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelStatus}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                >
                  <option value="Actif">{statusMap["Actif"] || "Actif"}</option>
                  <option value="Expiré">{statusMap["Expiré"] || "Expiré"}</option>
                  <option value="Bloqué">{statusMap["Bloqué"] || "Bloqué"}</option>
                </select>
              </div>

              {/* If Paid, select Expiry Date */}
              {editIsPaid && (
                <div className="space-y-1.5">
                  <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelExpiryDate}</label>
                  <input
                    type="date"
                    value={editExpiry}
                    onChange={(e) => setEditExpiry(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:text-zinc-300"
              >
                {tLoc.btnCancel}
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? tLoc.saving : tLoc.btnApply}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Viewing Attachment Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setViewingAttachment(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 text-lg cursor-pointer"
            >
              ✕
            </button>
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white border-b pb-3 mb-4">
              {tLoc.titleAttachment}
            </h3>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4">
              {viewingAttachment.startsWith("data:application/pdf") ? (
                <iframe src={viewingAttachment} className="w-full h-[60vh] rounded-lg border-0" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={viewingAttachment} alt={tLoc.titleAttachment} className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyingSub && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="border-b dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-855 dark:text-white">
                {tLoc.titleVerifySub}
              </h3>
              <button 
                onClick={() => setVerifyingSub(null)} 
                className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto space-y-6 text-xs font-semibold pr-2">
              {/* Club Info & Request Info */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.thClub}</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{verifyingSub.clubName}</p>
                  <p className="text-[10px] text-zinc-400">ID Club: {verifyingSub.clubId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.thSubPlan}</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{plansMap[verifyingSub.plan] || verifyingSub.plan}</p>
                  <p className="text-[10px] text-zinc-400">{verifyingSub.duration === "YEARLY" ? (language === "AR" ? "دفع سنوي" : language === "EN" ? "Annual Payment" : "Paiement Annuel") : (language === "AR" ? "دفع شهري" : language === "EN" ? "Monthly Payment" : "Paiement Mensuel")}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.labelAmount}</span>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{verifyingSub.amount.toLocaleString()} {language === "AR" ? "د.ج" : "DA"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.thMethod}</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase">{verifyingSub.method}</p>
                </div>
              </div>

              {/* Status information */}
              <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.labelCurrentStatus}</span>
                  <div className="pt-1">
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      verifyingSub.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : verifyingSub.status === "REJECTED"
                        ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 animate-pulse"
                    }`}>
                      {verifyingSub.status === "APPROVED" ? tLoc.approved : verifyingSub.status === "REJECTED" ? tLoc.rejected : tLoc.statusPending}
                    </span>
                  </div>
                </div>
                {verifyingSub.rejectionReason && (
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-red-500 uppercase">{tLoc.labelRejectReason}</span>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{verifyingSub.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Attachment preview */}
              {verifyingSub.attachment ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{tLoc.labelAttachmentFile}</span>
                  <div className="border dark:border-zinc-800 rounded-xl p-2 bg-zinc-50 dark:bg-zinc-950 flex justify-center">
                    {verifyingSub.attachment.startsWith("data:application/pdf") ? (
                      <iframe src={verifyingSub.attachment} className="w-full h-[35vh] rounded-lg border-0" />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={verifyingSub.attachment} alt={tLoc.titleAttachment} className="max-w-full max-h-[35vh] object-contain rounded-lg shadow-sm" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-zinc-400 font-medium text-xs">
                  {tLoc.noAttachment}
                </div>
              )}
            </div>

            {/* Actions Footer inside modal if Pending */}
            <div className="border-t dark:border-zinc-800 pt-4 mt-4 flex justify-between gap-3 shrink-0">
              <button
                onClick={() => setVerifyingSub(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:text-zinc-300"
              >
                {tLoc.btnClose}
              </button>
              
              {verifyingSub.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleApproveSubmission(verifyingSub);
                      setVerifyingSub(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer hover:bg-emerald-700"
                  >
                    ✓ {tLoc.btnAccept}
                  </button>
                  <button
                    onClick={() => {
                      setRejectingSub(verifyingSub);
                      setVerifyingSub(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-650 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer hover:bg-red-750"
                  >
                    ✕ {tLoc.btnReject}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingSub && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="border-b dark:border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-red-600 dark:text-red-400">
                {tLoc.rejectSubTitle.replace("{name}", rejectingSub.clubName)}
              </h3>
              <button 
                onClick={() => { setRejectingSub(null); setRejectionReasonInput(""); }} 
                className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-zinc-550 font-bold uppercase text-[9px] dark:text-zinc-400">{tLoc.labelRejectReason}</label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder={tLoc.placeholderRejectReason}
                  className="w-full h-28 rounded-xl border border-zinc-200 bg-white p-3 text-xs outline-none focus:border-red-500 font-medium dark:border-zinc-800 dark:bg-zinc-950 dark:text-white resize-none"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRejectingSub(null); setRejectionReasonInput(""); }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer dark:border-zinc-800 dark:text-zinc-300"
                >
                  {tLoc.btnCancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectionReasonInput.trim()) {
                      alert(tLoc.errSpecifyReason);
                      return;
                    }
                    handleRejectSubmission(rejectingSub, rejectionReasonInput);
                    setRejectingSub(null);
                    setRejectionReasonInput("");
                  }}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? tLoc.rejecting : tLoc.btnConfirmReject}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative space-y-5">
            {/* Close button X */}
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 text-sm cursor-pointer"
            >
              ✕
            </button>

            {/* Header / Title */}
            <div className="space-y-2 pr-6">
              <h4 className={`text-sm font-black uppercase tracking-wider ${confirmModal.isDanger ? 'text-red-655 dark:text-red-400' : 'text-zinc-800 dark:text-white'}`}>
                {confirmModal.title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                {confirmModal.message}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer dark:border-zinc-850 dark:text-zinc-305 dark:hover:bg-zinc-800"
              >
                {tLoc.btnCancel}
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm()
                  setConfirmModal(prev => ({ ...prev, isOpen: false }))
                }}
                className={`flex-1 py-2.5 rounded-xl text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer ${
                  confirmModal.isDanger 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-650/20' 
                    : 'bg-gradient-to-b from-emerald-500 to-teal-600 shadow-emerald-500/20'
                }`}
              >
                {tLoc.btnConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
