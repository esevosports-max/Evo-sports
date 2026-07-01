"use client"

import { useState, useTransition } from "react"
import { savePlanAction, deletePlanAction } from "@/app/dashboard/manager/forfaits/actions"

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  type: string // "GRATUIT" | "PAYANT"
  durationYears: number
  durationMonths: number
  durationDays: number
  durationHours: number
  durationMinutes: number
  durationSeconds: number
  billingPeriodType: string // "BOTH" | "MONTHLY" | "ANNUAL"
  priceMonthly: number
  priceYearly: number
  paymentMethods: string
  maxTeams: number
  staffLimits: Record<string, number> | null
  hasDashboard: boolean
  hasPayment: boolean
  hasPlanning: boolean
  hasMessaging: boolean
  hasPolls: boolean
  hasStructure: boolean
  hasStaff: boolean
  hasPlayers: boolean
  hasTactical: boolean
  hasTrainings: boolean
  hasMatches: boolean
  hasInjuries: boolean
  hasMedical: boolean
  hasTests: boolean
  hasWelfare: boolean
  hasGPS: boolean
  hasRbac: boolean
  hasSupport: boolean
  featuresList: string[] | null
  popular: boolean
  colorTheme: string
  createdAt: string
  updatedAt: string
}

interface ManagerForfaitsClientProps {
  initialPlans: SubscriptionPlan[]
}

const COLOR_THEMES = [
  { label: "Ciel (Sky)", value: "sky" },
  { label: "Indigo", value: "indigo" },
  { label: "Émeraude (Emerald)", value: "emerald" },
  { label: "Ambre (Amber)", value: "amber" },
  { label: "Rose", value: "rose" },
  { label: "Violet", value: "purple" },
]

const STAFF_ROLES = [
  { tag: "ENTRAINEUR_PRINCIPAL", label: "Entraîneur Principal" },
  { tag: "ENTRAINEUR_ADJOINT", label: "Entraîneur Adjoint" },
  { tag: "PREPARATEUR_PHYSIQUE", label: "Préparateur Physique" },
  { tag: "ENTRAINEUR_GARDIENS", label: "Entraîneur Gardiens" },
  { tag: "MEDECIN", label: "Médecin du Club" },
  { tag: "DIRECTEUR_SPORTIF", label: "Directeur Sportif" },
  { tag: "SECRETAIRE_GENERAL", label: "Secrétaire Général" },
]

export default function ManagerForfaitsClient({ initialPlans }: ManagerForfaitsClientProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("PAYANT") // "GRATUIT" | "PAYANT"
  
  // Free duration
  const [durationYears, setDurationYears] = useState(0)
  const [durationMonths, setDurationMonths] = useState(0)
  const [durationDays, setDurationDays] = useState(0)
  const [durationHours, setDurationHours] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(0)

  // Paid billing
  const [billingPeriodType, setBillingPeriodType] = useState("BOTH") // "BOTH", "MONTHLY", "ANNUAL"
  const [priceMonthly, setPriceMonthly] = useState(0)
  const [priceYearly, setPriceYearly] = useState(0)
  const [paymentMethods, setPaymentMethods] = useState("CCP, BaridiMob, Virement")
  const [maxTeams, setMaxTeams] = useState(-1) // -1 = Unlimited

  // Staff limits
  const [staffLimits, setStaffLimits] = useState<Record<string, number>>({
    ENTRAINEUR_PRINCIPAL: -1,
    ENTRAINEUR_ADJOINT: -1,
    PREPARATEUR_PHYSIQUE: -1,
    ENTRAINEUR_GARDIENS: -1,
    MEDECIN: -1,
    DIRECTEUR_SPORTIF: -1,
    SECRETAIRE_GENERAL: -1,
  })

  // Booleans options
  const [hasDashboard, setHasDashboard] = useState(true)
  const [hasPayment, setHasPayment] = useState(true)
  const [hasPlanning, setHasPlanning] = useState(true)
  const [hasMessaging, setHasMessaging] = useState(true)
  const [hasPolls, setHasPolls] = useState(true)
  const [hasStructure, setHasStructure] = useState(true)
  const [hasStaff, setHasStaff] = useState(true)
  const [hasPlayers, setHasPlayers] = useState(true)
  const [hasTactical, setHasTactical] = useState(true)
  const [hasTrainings, setHasTrainings] = useState(true)
  const [hasMatches, setHasMatches] = useState(true)
  const [hasInjuries, setHasInjuries] = useState(true)
  const [hasMedical, setHasMedical] = useState(true)
  const [hasTests, setHasTests] = useState(true)
  const [hasWelfare, setHasWelfare] = useState(true)
  const [hasGPS, setHasGPS] = useState(false)
  const [hasRbac, setHasRbac] = useState(true)
  const [hasSupport, setHasSupport] = useState(true)

  // Custom features
  const [featuresList, setFeaturesList] = useState<string[]>([])
  const [newFeatureText, setNewFeatureText] = useState("")

  // Styles
  const [popular, setPopular] = useState(false)
  const [colorTheme, setColorTheme] = useState("sky")

  const [formError, setFormError] = useState("")

  const openCreateForm = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setType("PAYANT")
    setDurationYears(0)
    setDurationMonths(0)
    setDurationDays(0)
    setDurationHours(0)
    setDurationMinutes(0)
    setDurationSeconds(0)
    setBillingPeriodType("BOTH")
    setPriceMonthly(0)
    setPriceYearly(0)
    setPaymentMethods("CCP, BaridiMob, Virement")
    setMaxTeams(-1)
    setStaffLimits({
      ENTRAINEUR_PRINCIPAL: -1,
      ENTRAINEUR_ADJOINT: -1,
      PREPARATEUR_PHYSIQUE: -1,
      ENTRAINEUR_GARDIENS: -1,
      MEDECIN: -1,
      DIRECTEUR_SPORTIF: -1,
      SECRETAIRE_GENERAL: -1,
    })
    setHasDashboard(true)
    setHasPayment(true)
    setHasPlanning(true)
    setHasMessaging(true)
    setHasPolls(true)
    setHasStructure(true)
    setHasStaff(true)
    setHasPlayers(true)
    setHasTactical(true)
    setHasTrainings(true)
    setHasMatches(true)
    setHasInjuries(true)
    setHasMedical(true)
    setHasTests(true)
    setHasWelfare(true)
    setHasGPS(false)
    setHasRbac(true)
    setHasSupport(true)
    setFeaturesList([])
    setNewFeatureText("")
    setPopular(false)
    setColorTheme("sky")
    setFormError("")
    setIsFormOpen(true)
  }

  const openEditForm = (plan: SubscriptionPlan) => {
    setEditingId(plan.id)
    setName(plan.name)
    setDescription(plan.description || "")
    setType(plan.type)
    setDurationYears(plan.durationYears)
    setDurationMonths(plan.durationMonths)
    setDurationDays(plan.durationDays)
    setDurationHours(plan.durationHours)
    setDurationMinutes(plan.durationMinutes)
    setDurationSeconds(plan.durationSeconds)
    setBillingPeriodType(plan.billingPeriodType)
    setPriceMonthly(plan.priceMonthly)
    setPriceYearly(plan.priceYearly)
    setPaymentMethods(plan.paymentMethods)
    setMaxTeams(plan.maxTeams)
    
    // Merge standard roles with whatever was stored
    const limits = {
      ENTRAINEUR_PRINCIPAL: -1,
      ENTRAINEUR_ADJOINT: -1,
      PREPARATEUR_PHYSIQUE: -1,
      ENTRAINEUR_GARDIENS: -1,
      MEDECIN: -1,
      DIRECTEUR_SPORTIF: -1,
      SECRETAIRE_GENERAL: -1,
      ...(plan.staffLimits || {})
    } as Record<string, number>
    setStaffLimits(limits)

    setHasDashboard(plan.hasDashboard ?? true)
    setHasPayment(plan.hasPayment ?? true)
    setHasPlanning(plan.hasPlanning ?? true)
    setHasMessaging(plan.hasMessaging ?? true)
    setHasPolls(plan.hasPolls ?? true)
    setHasStructure(plan.hasStructure ?? true)
    setHasStaff(plan.hasStaff ?? true)
    setHasPlayers(plan.hasPlayers ?? true)
    setHasTactical(plan.hasTactical ?? true)
    setHasTrainings(plan.hasTrainings ?? true)
    setHasMatches(plan.hasMatches ?? true)
    setHasInjuries(plan.hasInjuries ?? true)
    setHasMedical(plan.hasMedical ?? true)
    setHasTests(plan.hasTests ?? true)
    setHasWelfare(plan.hasWelfare ?? true)
    setHasGPS(plan.hasGPS ?? false)
    setHasRbac(plan.hasRbac ?? true)
    setHasSupport(plan.hasSupport ?? true)
    setFeaturesList(plan.featuresList || [])
    setNewFeatureText("")
    setPopular(plan.popular)
    setColorTheme(plan.colorTheme)
    setFormError("")
    setIsFormOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setFormError("Le nom du forfait est requis.")
      return
    }

    startTransition(async () => {
      const res = await savePlanAction({
        id: editingId || undefined,
        name,
        description,
        type,
        durationYears,
        durationMonths,
        durationDays,
        durationHours,
        durationMinutes,
        durationSeconds,
        billingPeriodType,
        priceMonthly,
        priceYearly,
        paymentMethods,
        maxTeams,
        staffLimits,
        hasDashboard,
        hasPayment,
        hasPlanning,
        hasMessaging,
        hasPolls,
        hasStructure,
        hasStaff,
        hasPlayers,
        hasTactical,
        hasTrainings,
        hasMatches,
        hasInjuries,
        hasMedical,
        hasTests,
        hasWelfare,
        hasGPS,
        hasRbac,
        hasSupport,
        featuresList,
        popular,
        colorTheme,
      })

      if (res.success) {
        setIsFormOpen(false)
        // Refresh plans list
        const updated = await fetch("/api/public/plans").then((r) => r.json())
        if (updated.success) {
          setPlans(updated.data)
        } else {
          window.location.reload()
        }
      } else {
        setFormError(res.error || "Une erreur est survenue")
      }
    })
  }

  const handleDelete = (id: string, planName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le forfait "${planName}" ?`)) return

    startTransition(async () => {
      const res = await deletePlanAction(id)
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== id))
      } else {
        alert("Erreur de suppression: " + res.error)
      }
    })
  }

  const handleStaffLimitChange = (role: string, value: string) => {
    const num = value === "" ? -1 : parseInt(value)
    setStaffLimits((prev) => ({
      ...prev,
      [role]: isNaN(num) ? -1 : num,
    }))
  }

  const addFeature = () => {
    if (!newFeatureText.trim()) return
    setFeaturesList((prev) => [...prev, newFeatureText.trim()])
    setNewFeatureText("")
  }

  const removeFeature = (index: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-8 text-zinc-800 dark:text-zinc-100 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
            <span>💎</span> Gestionnaire des Forfaits & Abonnements
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Modifiez et créez les forfaits qui s'affichent publiquement sur la page de tarification et configurez leurs fonctionnalités.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[11px] px-5 py-3 shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer self-start md:self-auto"
        >
          ➕ Créer un Forfait
        </button>
      </div>

      {/* Form / Modal container */}
      {isFormOpen && (
        <div className="rounded-2xl border border-emerald-500/20 bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6 shadow-xl animate-slide-up-fade">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="font-black uppercase tracking-wider text-sm text-emerald-500">
              {editingId ? "✏️ Modifier le forfait" : "✨ Nouveau Forfait"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-black text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
            >
              Fermer ✕
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Fields */}
              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  Nom du Forfait *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Club, Professionnel..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  Type de Forfait
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-bold"
                >
                  <option value="GRATUIT">🆓 Gratuit (Trial / Offre Limitée)</option>
                  <option value="PAYANT">💳 Payant (Abonnement récurrent)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  Thème Couleur
                </label>
                <select
                  value={colorTheme}
                  onChange={(e) => setColorTheme(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                >
                  {COLOR_THEMES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-3 space-y-1">
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                  Description du Forfait
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: La formule complète pour les clubs de football avec télémétrie GPS intégrée..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* CONDITIONAL SECTIONS FOR FREE VS PAID */}
            {type === "GRATUIT" ? (
              <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                  ⏳ Durée de l'offre gratuite (Abonnement gratuit temporaire / d'essai)
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Spécifiez après combien de temps cet abonnement expire pour les clubs inscrits.
                </p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Années</label>
                    <input
                      type="number"
                      value={durationYears}
                      onChange={(e) => setDurationYears(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Mois</label>
                    <input
                      type="number"
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Jours</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Heures</label>
                    <input
                      type="number"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Minutes</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-zinc-500">Secondes</label>
                    <input
                      type="number"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                  💰 Prix & Périodicité (Forfaits Payants)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Option de Facturation
                    </label>
                    <select
                      value={billingPeriodType}
                      onChange={(e) => setBillingPeriodType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    >
                      <option value="BOTH">Mensuel & Annuel (Choix regroupé)</option>
                      <option value="MONTHLY">Mensuel uniquement</option>
                      <option value="ANNUAL">Annuel uniquement</option>
                    </select>
                  </div>

                  {(billingPeriodType === "BOTH" || billingPeriodType === "MONTHLY") && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Prix Mensuel (DZD) *
                      </label>
                      <input
                        type="number"
                        value={priceMonthly}
                        onChange={(e) => setPriceMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  )}

                  {(billingPeriodType === "BOTH" || billingPeriodType === "ANNUAL") && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Prix Annuel (DZD) *
                      </label>
                      <input
                        type="number"
                        value={priceYearly}
                        onChange={(e) => setPriceYearly(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Méthodes de Paiement (Séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    value={paymentMethods}
                    onChange={(e) => setPaymentMethods(e.target.value)}
                    placeholder="Ex: CCP, BaridiMob, Virement"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* LIMITS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Teams category limit */}
              <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                  🛡️ Limite d'Équipes / Catégories
                </h4>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-zinc-550 dark:text-zinc-400">
                    Nombre maximum d'équipes (ex: U15, U17) qu'un club peut créer.
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={maxTeams}
                      onChange={(e) => setMaxTeams(parseInt(e.target.value) ?? -1)}
                      className="w-24 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    />
                    <span className="text-[10px] text-zinc-400">
                      (Entrez <strong className="text-emerald-500">-1</strong> pour un nombre illimité)
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff Type Limits */}
              <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                  💼 Limites de Staff par Type de Rôle
                </h4>
                <p className="text-[10px] text-zinc-400">
                  Configurez le nombre maximum d'utilisateurs autorisés par rôle de staff. (-1 = Illimité, 0 = Non autorisé)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                  {STAFF_ROLES.map((role) => (
                    <div key={role.tag} className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800/80 pb-1.5">
                      <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-350 truncate">
                        {role.label}
                      </span>
                      <input
                        type="number"
                        value={staffLimits[role.tag] ?? -1}
                        onChange={(e) => handleStaffLimitChange(role.tag, e.target.value)}
                        className="w-16 px-2 py-1 text-center text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* OPTIONS PRESENT IN CLUB (TRUE / FALSE CHECKBOXES) */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                🧩 Modules / Fonctionnalités du Club (Checklist)
              </h4>
              <p className="text-[10px] text-zinc-400">
                Cochez les options incluses dans ce forfait. Les clubs inscrits à ce forfait n'auront accès qu'aux modules activés.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasDashboard}
                    onChange={(e) => setHasDashboard(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Tableau de Bord</span>
                    <span className="text-[9px] text-zinc-400">Vue d'ensemble</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasPayment}
                    onChange={(e) => setHasPayment(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Abonnement & Paiement</span>
                    <span className="text-[9px] text-zinc-400">Formules & règlements</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasPlanning}
                    onChange={(e) => setHasPlanning(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Planning du Club</span>
                    <span className="text-[9px] text-zinc-400">Agenda officiel partagé</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasMessaging}
                    onChange={(e) => setHasMessaging(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Messagerie</span>
                    <span className="text-[9px] text-zinc-400">Discussions internes</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasPolls}
                    onChange={(e) => setHasPolls(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Sondages</span>
                    <span className="text-[9px] text-zinc-400">Consultations & votes</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasStructure}
                    onChange={(e) => setHasStructure(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Mon Club & Équipes</span>
                    <span className="text-[9px] text-zinc-400">Infos & structures</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasStaff}
                    onChange={(e) => setHasStaff(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Staff Technique</span>
                    <span className="text-[9px] text-zinc-400">Membres du staff</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasPlayers}
                    onChange={(e) => setHasPlayers(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Effectifs</span>
                    <span className="text-[9px] text-zinc-400">Liste des joueurs</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasTactical}
                    onChange={(e) => setHasTactical(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Composition</span>
                    <span className="text-[9px] text-zinc-400">Feuille de match & tactique</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasTrainings}
                    onChange={(e) => setHasTrainings(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Entraînements</span>
                    <span className="text-[9px] text-zinc-400">Planification des séances</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasMatches}
                    onChange={(e) => setHasMatches(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Matchs</span>
                    <span className="text-[9px] text-zinc-400">Calendrier des rencontres</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasInjuries}
                    onChange={(e) => setHasInjuries(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Suivi Blessures</span>
                    <span className="text-[9px] text-zinc-400">Infirmerie & convalescence</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasMedical}
                    onChange={(e) => setHasMedical(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Dossier Médical</span>
                    <span className="text-[9px] text-zinc-400">Suivi de santé confidentiel</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasTests}
                    onChange={(e) => setHasTests(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Tests Physiques</span>
                    <span className="text-[9px] text-zinc-400">Évaluation athlétique</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasWelfare}
                    onChange={(e) => setHasWelfare(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Fiche Quotidienne</span>
                    <span className="text-[9px] text-zinc-400">Forme & RPE</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasGPS}
                    onChange={(e) => setHasGPS(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Télémétrie GPS</span>
                    <span className="text-[9px] text-zinc-400">Données physiologiques</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasRbac}
                    onChange={(e) => setHasRbac(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Rôles & Accès</span>
                    <span className="text-[9px] text-zinc-400">Permissions avancées</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={hasSupport}
                    onChange={(e) => setHasSupport(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide">Support Prioritaire</span>
                    <span className="text-[9px] text-zinc-400">Assistance dédiée</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <input
                    type="checkbox"
                    checked={popular}
                    onChange={(e) => setPopular(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-wide text-amber-500">Populaire / Recommandé</span>
                    <span className="text-[9px] text-zinc-400">Met l'offre en avant</span>
                  </div>
                </label>
              </div>
            </div>

            {/* CUSTOM FEATURES LIST */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-350">
                📝 Lignes de Description / Puces additionnelles (Page Tarifs)
              </h4>
              <p className="text-[10px] text-zinc-400">
                Ces points apparaîtront sous forme de liste à puces verte dans la présentation du forfait sur la page Pricing.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Ex: Analyse de la charge d'entraînement..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addFeature()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-black uppercase tracking-wider"
                >
                  Ajouter
                </button>
              </div>

              {featuresList.length > 0 && (
                <ul className="space-y-1.5 pt-2 max-h-32 overflow-y-auto">
                  {featuresList.map((feat, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800/80 text-xs">
                      <span>🟢 {feat}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-0.5 rounded hover:bg-red-500/5 cursor-pointer"
                      >
                        Retirer ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[11px] transition-colors shadow-md shadow-emerald-500/10 cursor-pointer animate-pulse-slow"
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Plans List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-semibold text-zinc-500 mt-2">Aucun forfait configuré pour le moment.</p>
          </div>
        ) : (
          plans.map((p) => {
            const parsedFeatures = p.featuresList || []

            return (
              <div
                key={p.id}
                className={`relative overflow-hidden rounded-2xl border ${
                  p.popular
                    ? "border-amber-500 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30"
                    : "border-zinc-150 dark:border-zinc-800"
                } bg-white dark:bg-zinc-900 flex flex-col justify-between`}
              >
                {/* Visual Accent Bar */}
                <div className={`h-2.5 w-full bg-${p.colorTheme === "purple" ? "purple-500" : p.colorTheme === "rose" ? "rose-500" : p.colorTheme === "emerald" ? "emerald-500" : p.colorTheme === "amber" ? "amber-500" : p.colorTheme === "indigo" ? "indigo-500" : "sky-500"}`} />

                <div className="p-6 flex-1 space-y-4">
                  {/* Name and Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          p.type === "GRATUIT"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}>
                          {p.type === "GRATUIT" ? "Gratuit" : "Payant"}
                        </span>
                        {p.popular && (
                          <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                            ✨ Populaire
                          </span>
                        )}
                      </div>
                    </div>
                    {p.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed italic">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing Details */}
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-850">
                    {p.type === "GRATUIT" ? (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Durée d'expiration</span>
                        <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {p.durationYears > 0 && `${p.durationYears} ans `}
                          {p.durationMonths > 0 && `${p.durationMonths} mois `}
                          {p.durationDays > 0 && `${p.durationDays} jours `}
                          {p.durationHours > 0 && `${p.durationHours}h `}
                          {p.durationMinutes > 0 && `${p.durationMinutes}m `}
                          {p.durationSeconds > 0 && `${p.durationSeconds}s `}
                          {p.durationYears === 0 &&
                            p.durationMonths === 0 &&
                            p.durationDays === 0 &&
                            p.durationHours === 0 &&
                            p.durationMinutes === 0 &&
                            p.durationSeconds === 0 &&
                            "Pas de limite de temps"}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Abonnement Tarifs</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {p.billingPeriodType !== "ANNUAL" && (
                            <div>
                              <p className="text-zinc-400 text-[9px] uppercase font-semibold">Mensuel</p>
                              <p className="font-extrabold text-zinc-800 dark:text-zinc-200">
                                {p.priceMonthly.toLocaleString()} DZD <span className="text-[9px] text-zinc-400 font-normal">/ mois</span>
                              </p>
                            </div>
                          )}
                          {p.billingPeriodType !== "MONTHLY" && (
                            <div>
                              <p className="text-zinc-400 text-[9px] uppercase font-semibold">Annuel</p>
                              <p className="font-extrabold text-zinc-800 dark:text-zinc-200">
                                {p.priceYearly.toLocaleString()} DZD <span className="text-[9px] text-zinc-400 font-normal">/ an</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Limits and Options */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-zinc-100 dark:border-zinc-800/80">
                      <span className="text-zinc-400 font-bold">Catégories d'équipes:</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                        {p.maxTeams === -1 ? "Illimitées" : `${p.maxTeams} équipe(s)`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-zinc-400 font-bold block">Fonctionnalités activées:</span>
                      <div className="flex flex-wrap gap-1">
                        {p.hasRbac && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Permissions RBAC</span>}
                        {p.hasTactical && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Tableau Tactique</span>}
                        {p.hasMedical && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Suivi Médical</span>}
                        {p.hasTrainings && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Entraînements</span>}
                        {p.hasMessaging && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Messagerie</span>}
                        {p.hasSupport && <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">Support 24/7</span>}
                        {p.hasGPS && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[9px] font-black uppercase tracking-wider border border-amber-500/10">🛰️ Live GPS</span>}
                      </div>
                    </div>
                  </div>

                  {/* Bullet description preview */}
                  {parsedFeatures.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Puces de la carte tarifs</span>
                      <ul className="space-y-1 text-xs">
                        {parsedFeatures.slice(0, 3).map((f, idx) => (
                          <li key={idx} className="text-zinc-500 dark:text-zinc-400 truncate">
                            🟢 {f}
                          </li>
                        ))}
                        {parsedFeatures.length > 3 && (
                          <li className="text-zinc-400 text-[10px] font-bold">
                            + {parsedFeatures.length - 3} autres points...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end gap-3">
                  <button
                    onClick={() => openEditForm(p)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    ✏️ Modifier
                  </button>
                  
                  {/* Standard default plans can still be deleted if custom, but usually they'll edit them */}
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
                  >
                    🗑️ Supprimer
                  </button>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
