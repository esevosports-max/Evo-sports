"use client"

import { useState } from "react"
import { useLanguage } from "@/components/LanguageProvider"

export interface ClubItem {
  id: string
  name: string
  logo: string | null
  creationDate: string
  address: string
  stadiumName: string
  playersCount: number
  staffCount: number
  teamsCount: number
  subscriptionPlan: string
  subscriptionStatus: string
  subscriptionExpires: string
  subscriptionPaid: boolean
}

interface ManagerClubsClientProps {
  initialClubs: ClubItem[]
  updateClubDetailsAction: (
    clubId: string,
    name: string,
    stadiumName: string,
    address: string,
    subscriptionPlan: string,
    subscriptionStatus: string,
    subscriptionExpires: string,
    subscriptionPaid: boolean
  ) => Promise<void>
  deleteClubAction: (clubId: string) => Promise<void>
}

const pageDict: Record<string, Record<string, string>> = {
  FR: {
    pageTitle: "Base des Clubs Affiliés",
    pageSubtitle: "Supervisez les abonnements, gérez le statut de paiement, et visualisez les effectifs de chaque club.",
    totalClubs: "Total Clubs",
    searchPlaceholder: "Rechercher par nom de club ou stade...",
    noClubFound: "Aucun club ne correspond à votre recherche.",
    thClub: "Club",
    thPlan: "Abonnement",
    thStatus: "Statut",
    thExpiry: "Temps Restant",
    thPayment: "Paiement",
    thTeams: "Équipes",
    thStaff: "Staff",
    thPlayers: "Effectifs",
    thActions: "Actions",
    registeredOn: "Inscrit le {date}",
    daysLeft: "{days} jours restant",
    expired: "Expiré",
    paid: "Payé ✅",
    unpaid: "Impayé ❌",
    btnManage: "✏️ Gérer",
    summaryTitle: "📊 Cumul et Totaux des Structures Affiliées (La Total)",
    sumClubs: "Clubs",
    sumTeams: "Équipes",
    sumStaff: "Membres Staff",
    sumPlayers: "Effectifs Joueurs",
    modalTitle: "Gérer le Club et l'Abonnement",
    labelName: "Nom de l'Association",
    labelStadium: "Infrastructure / Stade",
    labelAddress: "Adresse physique",
    labelPlan: "Formule d'Abonnement",
    labelStatus: "Statut de l'Abonnement",
    labelExpiry: "Date d'expiration",
    labelPayment: "Statut des paiements",
    btnCancel: "Annuler",
    btnSave: "Enregistrer",
    btnSaving: "Sauvegarde...",
    confirmDelete: "Êtes-vous absolument sûr de vouloir supprimer le club \"{name}\" ? Cette action est irréversible et supprimera tous les joueurs et staffs rattachés.",
    errUpdate: "Erreur lors de la mise à jour.",
    errDelete: "Erreur lors de la suppression.",
    statusActive: "Actif",
    statusPending: "En attente",
    statusExpired: "Expiré",
    paidOption: "Payé",
    unpaidOption: "Impayé"
  },
  EN: {
    pageTitle: "Affiliated Clubs Database",
    pageSubtitle: "Supervise subscriptions, manage payment status, and view the roster size of each club.",
    totalClubs: "Total Clubs",
    searchPlaceholder: "Search by club name or stadium...",
    noClubFound: "No club matches your search.",
    thClub: "Club",
    thPlan: "Subscription",
    thStatus: "Status",
    thExpiry: "Time Remaining",
    thPayment: "Payment",
    thTeams: "Teams",
    thStaff: "Staff",
    thPlayers: "Players",
    thActions: "Actions",
    registeredOn: "Registered on {date}",
    daysLeft: "{days} days left",
    expired: "Expired",
    paid: "Paid ✅",
    unpaid: "Unpaid ❌",
    btnManage: "✏️ Manage",
    summaryTitle: "📊 Cumulative Totals of Affiliated Clubs (The Lot)",
    sumClubs: "Clubs",
    sumTeams: "Teams",
    sumStaff: "Staff Members",
    sumPlayers: "Player Roster",
    modalTitle: "Manage Club & Subscription",
    labelName: "Association Name",
    labelStadium: "Infrastructure / Stadium",
    labelAddress: "Physical Address",
    labelPlan: "Subscription Plan",
    labelStatus: "Subscription Status",
    labelExpiry: "Expiry Date",
    labelPayment: "Payment Status",
    btnCancel: "Cancel",
    btnSave: "Save",
    btnSaving: "Saving...",
    confirmDelete: "Are you absolutely sure you want to delete the club \"{name}\"? This action is irreversible and will delete all associated players and staff.",
    errUpdate: "Error during update.",
    errDelete: "Error during deletion.",
    statusActive: "Active",
    statusPending: "Pending",
    statusExpired: "Expired",
    paidOption: "Paid",
    unpaidOption: "Unpaid"
  },
  AR: {
    pageTitle: "قاعدة بيانات الأندية المنتسبة",
    pageSubtitle: "الإشراف على الاشتراكات، وإدارة حالة الدفع، وعرض تعداد كل نادٍ.",
    totalClubs: "إجمالي الأندية",
    searchPlaceholder: "البحث باسم النادي أو الملعب...",
    noClubFound: "لم يتم العثور على أي نادٍ يطابق بحثك.",
    thClub: "النادي",
    thPlan: "الاشتراك",
    thStatus: "الحالة",
    thExpiry: "الوقت المتبقي",
    thPayment: "الدفع",
    thTeams: "الفرق",
    thStaff: "الطاقم",
    thPlayers: "اللاعبين",
    thActions: "إجراءات",
    registeredOn: "مسجل بتاريخ {date}",
    daysLeft: "متبقي {days} يوم",
    expired: "منتهي",
    paid: "مدفوع ✅",
    unpaid: "غير مدفوع ❌",
    btnManage: "✏️ إدارة",
    summaryTitle: "📊 إحصائيات وهياكل الأندية المنتسبة (المجموع العام)",
    sumClubs: "أندية",
    sumTeams: "فرق",
    sumStaff: "أعضاء الطاقم",
    sumPlayers: "قائمة اللاعبين",
    modalTitle: "إدارة النادي والاشتراك",
    labelName: "اسم الجمعية / النادي",
    labelStadium: "المنشأة / الملعب",
    labelAddress: "العنوان الفعلي",
    labelPlan: "صيغة الاشتراك",
    labelStatus: "حالة الاشتراك",
    labelExpiry: "تاريخ الانتهاء",
    labelPayment: "حالة الدفع",
    btnCancel: "إلغاء",
    btnSave: "حفظ",
    btnSaving: "جاري الحفظ...",
    confirmDelete: "هل أنت متأكد تمامًا من رغبتك في حذف نادي \"{name}\"؟ هذا الإجراء غير قابل للتراجع وسيتم حذف جميع اللاعبين وأعضاء الطاقم المرتبطين به.",
    errUpdate: "حدث خطأ أثناء التحديث.",
    errDelete: "حدث خطأ أثناء الحذف.",
    statusActive: "نشط",
    statusPending: "قيد الانتظار",
    statusExpired: "منتهي",
    paidOption: "مدفوع",
    unpaidOption: "غير مدفوع"
  }
}

const PLAN_LABELS: Record<string, Record<string, string>> = {
  FR: {
    "1 Équipe": "1 Équipe",
    "Club": "Club",
    "Professionnel": "Professionnel",
    "Elite": "Elite"
  },
  EN: {
    "1 Équipe": "1 Team",
    "Club": "Club",
    "Professionnel": "Professional",
    "Elite": "Elite"
  },
  AR: {
    "1 Équipe": "فريق واحد",
    "Club": "نادي",
    "Professionnel": "محترف",
    "Elite": "نخبة"
  }
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
  FR: {
    "Actif": "Actif",
    "En attente": "En attente",
    "Expiré": "Expiré"
  },
  EN: {
    "Actif": "Active",
    "En attente": "Pending",
    "Expiré": "Expired"
  },
  AR: {
    "Actif": "نشط",
    "En attente": "قيد الانتظار",
    "Expiré": "منتهي"
  }
}

export default function ManagerClubsClient({
  initialClubs,
  updateClubDetailsAction,
  deleteClubAction,
}: ManagerClubsClientProps) {
  const { language } = useLanguage()
  const tLoc = pageDict[language] || pageDict["FR"]
  const plansMap = PLAN_LABELS[language] || PLAN_LABELS["FR"]
  const statusMap = STATUS_LABELS[language] || STATUS_LABELS["FR"]

  const [clubs, setClubs] = useState<ClubItem[]>(initialClubs)
  const [search, setSearch] = useState("")
  const [editingClub, setEditingClub] = useState<ClubItem | null>(null)

  // Edit fields
  const [editName, setEditName] = useState("")
  const [editStadium, setEditStadium] = useState("")
  const [editAddress, setEditAddress] = useState("")
  const [editPlan, setEditPlan] = useState("1 Équipe")
  const [editStatus, setEditStatus] = useState("Actif")
  const [editExpires, setEditExpires] = useState("")
  const [editPaid, setEditPaid] = useState(true)
  const [loading, setLoading] = useState(false)

  // Filtered clubs
  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.stadiumName.toLowerCase().includes(search.toLowerCase())
  )

  // Calculations for Totals (La Total)
  const totalClubs = filteredClubs.length
  const totalTeams = filteredClubs.reduce((sum, c) => sum + c.teamsCount, 0)
  const totalStaff = filteredClubs.reduce((sum, c) => sum + c.staffCount, 0)
  const totalPlayers = filteredClubs.reduce((sum, c) => sum + c.playersCount, 0)

  const handleStartEdit = (club: ClubItem) => {
    setEditingClub(club)
    setEditName(club.name)
    setEditStadium(club.stadiumName)
    setEditAddress(club.address)
    
    let planName = club.subscriptionPlan || "1 Équipe"
    if (planName === "Standard" || planName === "1 equipe") planName = "1 Équipe"
    else if (planName === "Pro") planName = "Club"
    else if (planName === "Premium") planName = "Professionnel"
    setEditPlan(planName)
    
    setEditStatus(club.subscriptionStatus)
    setEditExpires(club.subscriptionExpires.substring(0, 10)) // Format to YYYY-MM-DD for input
    setEditPaid(club.subscriptionPaid)
  }

  const handleSaveEdit = async () => {
    if (!editingClub) return
    setLoading(true)
    try {
      await updateClubDetailsAction(
        editingClub.id,
        editName,
        editStadium,
        editAddress,
        editPlan,
        editStatus,
        new Date(editExpires).toISOString(),
        editPaid
      )
      setClubs((prev) =>
        prev.map((c) =>
          c.id === editingClub.id
            ? {
                ...c,
                name: editName,
                stadiumName: editStadium,
                address: editAddress,
                subscriptionPlan: editPlan,
                subscriptionStatus: editStatus,
                subscriptionExpires: new Date(editExpires).toISOString(),
                subscriptionPaid: editPaid,
              }
            : c
        )
      )
      setEditingClub(null)
    } catch (err) {
      console.error(err)
      alert(tLoc.errUpdate)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    const confirmDelete = confirm(
      tLoc.confirmDelete.replace("{name}", clubName)
    )
    if (!confirmDelete) return

    try {
      await deleteClubAction(clubId)
      setClubs((prev) => prev.filter((c) => c.id !== clubId))
    } catch (err) {
      console.error(err)
      alert(tLoc.errDelete)
    }
  }

  // Helper to calculate remaining days
  const getRemainingDays = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {tLoc.pageTitle}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            {tLoc.pageSubtitle}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {tLoc.totalClubs}
          </span>
          <span className="inline-flex rounded-xl bg-emerald-500/10 text-emerald-600 px-3 py-1.5 text-xs font-black uppercase shadow-sm">
            {clubs.length}
          </span>
        </div>
      </section>

      {/* Control bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={tLoc.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
          />
          <span className="absolute right-3.5 top-3 text-zinc-400 text-xs">🔍</span>
        </div>
      </div>

      {/* Clubs Table List */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-xs font-bold text-zinc-400">{tLoc.noClubFound}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-150/80 bg-zinc-50/50 dark:bg-zinc-900/80 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  <th className="p-4">{tLoc.thClub}</th>
                  <th className="p-4">{tLoc.thPlan}</th>
                  <th className="p-4">{tLoc.thStatus}</th>
                  <th className="p-4">{tLoc.thExpiry}</th>
                  <th className="p-4">{tLoc.thPayment}</th>
                  <th className="p-4 text-center">{tLoc.thTeams}</th>
                  <th className="p-4 text-center">{tLoc.thStaff}</th>
                  <th className="p-4 text-center">{tLoc.thPlayers}</th>
                  <th className="p-4 text-right">{tLoc.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs font-semibold">
                {filteredClubs.map((club) => {
                  const remainingDays = getRemainingDays(club.subscriptionExpires)
                  return (
                    <tr key={club.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {club.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={club.logo}
                              alt="Logo"
                              className="h-9 w-9 object-contain rounded-lg border border-zinc-200 bg-zinc-50 p-0.5"
                            />
                          ) : (
                            <span className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-[10px] border border-emerald-500/10">
                              {club.name.substring(0, 2).toUpperCase()}
                            </span>
                          )}
                          <div>
                            <div className="font-black text-zinc-900 dark:text-white uppercase tracking-wide">
                              {club.name}
                            </div>
                            <div className="text-[9px] text-zinc-400 font-bold">
                              {tLoc.registeredOn.replace("{date}", new Date(club.creationDate).toLocaleDateString(language === "AR" ? "ar-EG" : language === "EN" ? "en-US" : "fr-FR"))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                          {(() => {
                            let normalized = club.subscriptionPlan || "1 Équipe"
                            if (normalized === "Standard" || normalized === "1 equipe") normalized = "1 Équipe"
                            else if (normalized === "Pro") normalized = "Club"
                            else if (normalized === "Premium") normalized = "Professionnel"
                            return plansMap[normalized] || normalized
                          })()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            club.subscriptionStatus === "Actif"
                              ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                          }`}
                        >
                          {statusMap[club.subscriptionStatus] || club.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {remainingDays > 0 ? (
                          <span className={`font-bold ${remainingDays <= 7 ? "text-amber-500" : "text-zinc-600 dark:text-zinc-400"}`}>
                            {tLoc.daysLeft.replace("{days}", String(remainingDays))}
                          </span>
                        ) : (
                          <span className="text-red-500 font-black uppercase text-[10px]">{tLoc.expired}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            club.subscriptionPaid
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-red-500/10 text-red-650"
                          }`}
                        >
                          {club.subscriptionPaid ? tLoc.paid : tLoc.unpaid}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {club.teamsCount}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {club.staffCount}
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {club.playersCount}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(club)}
                            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-black uppercase text-[9px] tracking-wider active:scale-95 transition-all cursor-pointer"
                          >
                            {tLoc.btnManage}
                          </button>
                          <button
                            onClick={() => handleDeleteClub(club.id, club.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 font-black uppercase text-[9px] tracking-wider active:scale-95 transition-all cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary Footer (La Total) */}
          <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-150/80 dark:border-zinc-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
              {tLoc.summaryTitle}
            </span>
            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-center shadow-sm">
                <p className="text-[9px] text-zinc-450 uppercase font-black">{tLoc.sumClubs}</p>
                <p className="text-zinc-855 dark:text-zinc-200 font-black mt-0.5">{totalClubs}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-center shadow-sm">
                <p className="text-[9px] text-zinc-455 uppercase font-black">{tLoc.sumTeams}</p>
                <p className="text-zinc-855 dark:text-zinc-200 font-black mt-0.5">{totalTeams}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-center shadow-sm">
                <p className="text-[9px] text-zinc-455 uppercase font-black">{tLoc.sumStaff}</p>
                <p className="text-zinc-855 dark:text-zinc-200 font-black mt-0.5">{totalStaff}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 px-3.5 py-2 rounded-xl text-center shadow-sm">
                <p className="text-[9px] text-zinc-455 uppercase font-black">{tLoc.sumPlayers}</p>
                <p className="text-zinc-855 dark:text-zinc-200 font-black mt-0.5">{totalPlayers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details & Subscription Modal */}
      {editingClub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="border-b pb-3 flex justify-between items-center dark:border-zinc-800">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white">
                {tLoc.modalTitle}
              </h3>
              <button
                onClick={() => setEditingClub(null)}
                className="text-zinc-450 hover:text-zinc-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelName}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelStadium}</label>
                <input
                  type="text"
                  value={editStadium}
                  onChange={(e) => setEditStadium(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelAddress}</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelPlan}</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-855 dark:text-white"
                >
                  <option value="1 Équipe">{plansMap["1 Équipe"] || "1 Équipe"}</option>
                  <option value="Club">{plansMap["Club"] || "Club"}</option>
                  <option value="Professionnel">{plansMap["Professionnel"] || "Professionnel"}</option>
                  <option value="Elite">{plansMap["Elite"] || "Elite"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelStatus}</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-855 dark:text-white"
                >
                  <option value="Actif">{statusMap["Actif"] || "Actif"}</option>
                  <option value="En attente">{statusMap["En attente"] || "En attente"}</option>
                  <option value="Expiré">{statusMap["Expiré"] || "Expiré"}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelExpiry}</label>
                <input
                  type="date"
                  value={editExpires}
                  onChange={(e) => setEditExpires(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-500 font-bold uppercase text-[9px]">{tLoc.labelPayment}</label>
                <select
                  value={editPaid ? "true" : "false"}
                  onChange={(e) => setEditPaid(e.target.value === "true")}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs outline-none focus:border-emerald-500 font-bold text-zinc-855 dark:text-white"
                >
                  <option value="true">{tLoc.paidOption}</option>
                  <option value="false">{tLoc.unpaidOption}</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex gap-3">
              <button
                onClick={() => setEditingClub(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-zinc-750 font-black uppercase text-[10px] tracking-wider active:scale-95 transition-all cursor-pointer"
              >
                {tLoc.btnCancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-650 text-white font-black uppercase text-[10px] tracking-wider shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? tLoc.btnSaving : tLoc.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
