"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  "1 Équipe": { monthly: 10000, yearly: 100000 },
  "Club": { monthly: 15000, yearly: 144000 },
  "Professionnel": { monthly: 20000, yearly: 192000 },
  "Elite": { monthly: 25000, yearly: 240000 },
}

export default function PaymentPage() {
  const router = useRouter()
  const [clubInfo, setClubInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [actionType, setActionType] = useState<"VIEW" | "RENEW" | "UPGRADE">("RENEW")

  // Form states
  const [selectedPlan, setSelectedPlan] = useState("Club")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [paymentMethod, setPaymentMethod] = useState<"BARIDIMOB" | "SERIAL" | "CHEQUE">("BARIDIMOB")

  // Serial code fields
  const [serialCode, setSerialCode] = useState("")
  const [serialIdent, setSerialIdent] = useState("")

  // Upload fields
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null)
  const [attachmentName, setAttachmentName] = useState("")

  const [submitting, setSubmitting] = useState(false)

  // Fetch club subscription status
  const fetchClubStatus = async () => {
    try {
      const res = await fetch("/api/payment")
      if (res.ok) {
        const data = await res.json()
        setClubInfo(data)
        if (data.subscriptionPlan) {
          setSelectedPlan(data.subscriptionPlan)
        }
        
        const isActive = data.subscriptionStatus === "Actif"
        const expires = data.subscriptionExpires
        const isExpired = expires && new Date(expires) < new Date()
        
        if (isActive && !isExpired) {
          setActionType("VIEW")
          router.refresh()
        } else {
          setActionType("RENEW")
        }
      } else {
        const errData = await res.json()
        setError(errData.error || "Impossible de récupérer les informations du club.")
      }
    } catch (err) {
      console.error(err)
      setError("Erreur réseau.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClubStatus()
  }, [])

  // File upload reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setError("Le fichier est trop volumineux. Max : 2 Mo.")
      return
    }

    setError("")
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachmentBase64(reader.result)
        setAttachmentName(file.name)
      }
    }
    reader.onerror = () => {
      setError("Erreur de lecture du fichier.")
    }
    reader.readAsDataURL(file)
  }

  // Handle submit payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSubmitting(true)

    try {
      let payload: any = { method: paymentMethod }

      if (paymentMethod === "SERIAL") {
        if (!serialCode || !serialIdent) {
          throw new Error("Veuillez saisir le code de 16 chiffres et l'identifiant de 6 caractères.")
        }
        if (serialCode.length !== 16 || serialIdent.length !== 6) {
          throw new Error("Le code de série doit comporter exactement 16 chiffres et l'identifiant 6 caractères.")
        }
        payload.code = serialCode
        payload.identifier = serialIdent
      } else {
        // Baridimob or Cheque
        if (!attachmentBase64) {
          throw new Error("Veuillez joindre la pièce jointe (reçu BaridiMob ou photo du chèque).")
        }
        payload.plan = actionType === "UPGRADE" && clubInfo?.subscriptionPlan ? getNextPlan(clubInfo.subscriptionPlan) : selectedPlan
        payload.duration = billingPeriod === "monthly" ? "MONTHLY" : "YEARLY"
        payload.amount = getCalculatedPrice()
        payload.attachment = attachmentBase64
      }

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la validation du paiement.")
      }

      setSuccess(data.message || "Paiement envoyé avec succès ! Validation en cours.")
      
      // Clean up inputs
      setSerialCode("")
      setSerialIdent("")
      setAttachmentBase64(null)
      setAttachmentName("")

      // Refetch club status to update the UI
      setTimeout(() => {
        fetchClubStatus()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Erreur lors du traitement.")
    } finally {
      setSubmitting(false)
    }
  }

  const PLAN_ORDER = ["1 Équipe", "Club", "Professionnel", "Elite"]

  const getNextPlan = (currentPlan: string): string | null => {
    const idx = PLAN_ORDER.indexOf(currentPlan)
    if (idx === -1 || idx === PLAN_ORDER.length - 1) return null
    return PLAN_ORDER[idx + 1]
  }

  const getCalculatedPrice = () => {
    let planToPrice = selectedPlan
    if (actionType === "UPGRADE" && clubInfo?.subscriptionPlan) {
      const nextPlan = getNextPlan(clubInfo.subscriptionPlan)
      if (nextPlan) {
        planToPrice = nextPlan
      }
    }
    const prices = PLAN_PRICES[planToPrice] || PLAN_PRICES["Club"]
    const base = billingPeriod === "monthly" ? prices.monthly : prices.yearly
    if (actionType === "UPGRADE") {
      return base / 2
    }
    return base
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Chargement de votre statut...</p>
        </div>
      </div>
    )
  }

  // Check if club is blocked, expired or pending
  const isPendingValidation = clubInfo?.subscriptionStatus === "EnAttente" || clubInfo?.subscriptionStatus === "En attente"

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto py-4">
      {/* Title */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black font-sport italic uppercase tracking-wider text-zinc-900 dark:text-white">
          Abonnement & Facturation
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gérez la formule d&apos;accès de votre club et effectuez vos règlements en toute sécurité.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-pulse">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-bounce">
          {success}
        </div>
      )}

      {/* 1. Restricted Access for non-Presidents or Pending Screen */}
      {clubInfo?.userRole && clubInfo.userRole !== "PRESIDENT" ? (
        <div className={`rounded-2xl border p-8 sm:p-10 text-center space-y-6 shadow-xl backdrop-blur-md ${
          clubInfo?.subscriptionStatus === "Actif"
            ? "border-emerald-500/20 bg-emerald-50/5 dark:bg-emerald-950/5"
            : "border-red-500/20 bg-red-50/5 dark:bg-red-950/5"
        }`}>
          <div className={`mx-auto h-16 w-16 flex items-center justify-center rounded-full ${
            clubInfo?.subscriptionStatus === "Actif"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 text-red-650 dark:text-red-400"
          }`}>
            {clubInfo?.subscriptionStatus === "Actif" ? (
              <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              {clubInfo?.subscriptionStatus === "Actif" ? "Abonnement Actif" : "Accès Restreint - Abonnement Expiré"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
              {clubInfo?.subscriptionStatus === "Actif" ? (
                <>
                  L&apos;abonnement du club <span className="font-extrabold text-emerald-650 dark:text-emerald-400">{clubInfo?.clubName}</span> est actif.
                </>
              ) : (
                <>
                  L&apos;abonnement du club <span className="font-extrabold text-emerald-650 dark:text-emerald-400">{clubInfo?.clubName}</span> est actuellement inactif, expiré ou bloqué.
                </>
              )}
            </p>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-semibold">
              {clubInfo?.subscriptionStatus === "Actif" 
                ? "Seul le Président est habilité à modifier ou renouveler la formule d'abonnement."
                : "Veuillez contacter le Président ou le responsable de votre club afin de procéder au règlement de la formule d'accès."}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto text-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border border-zinc-200 dark:border-zinc-750 font-sport italic"
            >
              Se déconnecter
            </Link>
          </div>
        </div>
      ) : isPendingValidation ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/5 dark:bg-amber-950/5 p-8 sm:p-10 text-center space-y-6 shadow-xl backdrop-blur-md">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <svg className="h-8 w-8 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
              Paiement en Cours de Validation
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
              Votre demande de paiement par <span className="font-extrabold text-amber-600 dark:text-amber-400">{clubInfo?.latestSubmission?.method}</span> de <span className="font-extrabold">{clubInfo?.latestSubmission?.amount.toLocaleString()} DA</span> pour l&apos;offre <span className="font-extrabold text-emerald-600">{clubInfo?.latestSubmission?.plan}</span> est actuellement en attente de vérification par le gestionnaire EVO SPORTS.
            </p>
            <p className="text-[11px] text-zinc-400 font-medium">
              Soumise le {new Date(clubInfo?.latestSubmission?.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={fetchClubStatus}
              className="w-full sm:w-auto rounded-xl bg-amber-500 text-white px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-amber-600 transition-all shadow-md"
            >
              Actualiser le statut
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-zinc-300 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all border border-zinc-200 dark:border-zinc-750"
            >
              Se déconnecter
            </Link>
          </div>
        </div>
      ) : actionType === "VIEW" ? (
        <div className="rounded-3xl border border-zinc-200/50 bg-white p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-300 dark:border-zinc-800/50 dark:bg-zinc-900 lg:col-span-3">
          <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-850 pb-5">
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                Abonnement Actif
              </h2>
              <p className="text-xs text-zinc-400 font-bold uppercase mt-0.5">
                Les fonctionnalités de votre club sont entièrement déverrouillées
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Club</span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">{clubInfo?.clubName}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Formule Active</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{clubInfo?.subscriptionPlan || "Club"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Statut</span>
                <span className="inline-flex rounded-lg bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                  {clubInfo?.subscriptionStatus || "Actif"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Date d&apos;expiration</span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  {clubInfo?.subscriptionExpires
                    ? new Date(clubInfo.subscriptionExpires).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                    : "Illimitée"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Mode de paiement</span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  {clubInfo?.latestSubmission?.method || clubInfo?.subscriptionMethod || "BaridiMob"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-black uppercase text-zinc-400">Montant réglé</span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  {clubInfo?.latestSubmission?.amount 
                    ? `${clubInfo.latestSubmission.amount.toLocaleString()} DA` 
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                if (clubInfo?.subscriptionPlan) {
                  setSelectedPlan(clubInfo.subscriptionPlan)
                }
                setActionType("RENEW")
              }}
              className="flex-1 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-md hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-center cursor-pointer font-sport italic"
            >
              Renouveler l&apos;abonnement
            </button>

            <button
              onClick={() => {
                window.location.href = "/dashboard"
              }}
              className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-center cursor-pointer font-sport italic flex items-center justify-center gap-1.5 border border-zinc-850 dark:border-zinc-200"
            >
              Revenir au Tableau de Bord
            </button>

            {clubInfo?.subscriptionPlan !== "Elite" && (
              <button
                onClick={() => {
                  const nextPlan = getNextPlan(clubInfo?.subscriptionPlan)
                  if (nextPlan) {
                    setSelectedPlan(nextPlan)
                  }
                  setActionType("UPGRADE")
                }}
                className="flex-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 dark:bg-zinc-850 dark:hover:bg-zinc-800 dark:text-white px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all border border-zinc-200 dark:border-zinc-750 text-center cursor-pointer font-sport italic"
              >
                Mettre à niveau l&apos;abonnement
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 lg:col-span-3">
          {clubInfo?.subscriptionStatus === "Actif" && (
            <button
              type="button"
              onClick={() => setActionType("VIEW")}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              ← Retour aux informations de l&apos;abonnement
            </button>
          )}
          {clubInfo?.latestSubmission?.status === "REJECTED" && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 space-y-3 text-left shadow-lg animate-in fade-in duration-300">
              <h4 className="text-xs font-black uppercase tracking-wider text-red-650 dark:text-red-400 flex items-center gap-1.5">
                ❌ Demande Précédente Refusée
              </h4>
              <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                Votre précédente demande de paiement par <span className="font-extrabold text-red-600 dark:text-red-400">{clubInfo.latestSubmission.method}</span> de <span className="font-extrabold">{clubInfo.latestSubmission.amount.toLocaleString()} DA</span> pour l&apos;offre <span className="font-extrabold">{clubInfo.latestSubmission.plan}</span> a été refusée.
              </p>
              {clubInfo.latestSubmission.rejectionReason && (
                <div className="bg-red-500/5 dark:bg-red-950/20 border border-red-500/10 rounded-xl p-3 text-xs">
                  <span className="font-black text-red-600 dark:text-red-400 uppercase text-[9px] block mb-1">Motif du refus</span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-bold">{clubInfo.latestSubmission.rejectionReason}</p>
                </div>
              )}
              <p className="text-[10px] text-zinc-400 font-medium">
                Veuillez soumettre à nouveau vos informations de paiement ci-dessous ou saisir un code de série valide pour réactiver votre accès.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Side */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70 p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Formulaire de Règlement
            </h3>

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              
              {/* Readonly Club ID */}
              <div>
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  Identifiant du Club
                </label>
                <input
                  type="text"
                  readOnly
                  value={clubInfo?.clubId || ""}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 font-bold select-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 outline-none"
                />
              </div>

              {/* Offer Selector & Billing Period (only for offline methods, serial codes specify their own) */}
              {paymentMethod !== "SERIAL" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                      Offre / Formule
                    </label>
                    {actionType === "UPGRADE" ? (
                      <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 font-extrabold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white flex items-center justify-between">
                        <span>{getNextPlan(clubInfo?.subscriptionPlan || "")}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase font-black">
                          Mise à niveau (50%)
                        </span>
                      </div>
                    ) : actionType === "RENEW" && clubInfo?.subscriptionStatus === "Actif" ? (
                      <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 font-extrabold dark:border-zinc-800 dark:bg-zinc-950 dark:text-white flex items-center justify-between">
                        <span>{clubInfo?.subscriptionPlan}</span>
                        <span className="text-[10px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full uppercase font-black">
                          Renouvellement
                        </span>
                      </div>
                    ) : (
                      <select
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                      >
                        <option value="1 Équipe">1 Équipe</option>
                        <option value="Club">Club</option>
                        <option value="Professionnel">Professionnel</option>
                        <option value="Elite">Elite</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                      Période de Facturation
                    </label>
                    <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-inner p-1 bg-zinc-50/50 dark:bg-zinc-950/20">
                      <button
                        type="button"
                        onClick={() => setBillingPeriod("monthly")}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                          billingPeriod === "monthly"
                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        Mensuel
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingPeriod("yearly")}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                          billingPeriod === "yearly"
                            ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        Annuel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
                  Mode de Paiement
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("BARIDIMOB")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all gap-1.5 ${
                      paymentMethod === "BARIDIMOB"
                        ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">BaridiMob</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">Validation manuelle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("SERIAL")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all gap-1.5 ${
                      paymentMethod === "SERIAL"
                        ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Code Série</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">Activation instantanée</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CHEQUE")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all gap-1.5 ${
                      paymentMethod === "CHEQUE"
                        ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Chèque</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">Validation manuelle</span>
                  </button>
                </div>
              </div>

              {/* Mode BaridiMob details & Upload */}
              {paymentMethod === "BARIDIMOB" && (
                <div className="space-y-4 border border-zinc-200/50 dark:border-zinc-850 p-5 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/10">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Coordonnées BaridiMob / CCP</p>
                    <div className="p-3 bg-white dark:bg-zinc-950 border rounded-lg flex items-center justify-between shadow-inner">
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase">RIB EVO SPORTS</p>
                        <p className="text-sm font-extrabold text-zinc-900 dark:text-white select-all">007 99999 0000123456 78</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full">CCP</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Ajouter le reçu de transaction (Image ou PDF) *
                    </label>
                    <div className="flex items-center gap-4">
                      {attachmentBase64 ? (
                        <div className="flex-1 flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/30 rounded-lg">
                          <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 truncate max-w-[200px]">{attachmentName}</span>
                          <button
                            type="button"
                            onClick={() => { setAttachmentBase64(null); setAttachmentName("") }}
                            className="text-[10px] font-black uppercase text-red-500 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <label className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl py-6 cursor-pointer border-zinc-200 hover:border-emerald-500/50 dark:border-zinc-800 transition-colors">
                          <div className="text-center space-y-1">
                            <svg className="mx-auto h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="block text-xs font-bold text-zinc-600 dark:text-zinc-350">Téléverser la pièce jointe</span>
                            <span className="block text-[10px] text-zinc-400">PDF, PNG, JPG (Max 2 Mo)</span>
                          </div>
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mode Serial Code input */}
              {paymentMethod === "SERIAL" && (
                <div className="space-y-4 border border-zinc-200/50 dark:border-zinc-850 p-5 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                        Identifiant du code (6 caractères) *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="Ex: AB12C3"
                        value={serialIdent}
                        onChange={(e) => setSerialIdent(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-extrabold uppercase tracking-widest shadow-inner outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">
                        Code de série (16 chiffres) *
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        required
                        placeholder="Ex: 1234567890123456"
                        value={serialCode}
                        onChange={(e) => setSerialCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-extrabold tracking-widest shadow-inner outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    * Saisissez l&apos;identifiant de 6 caractères et le code de 16 chiffres fournis par EVO SPORTS pour activer immédiatement votre licence.
                  </p>
                </div>
              )}

              {/* Mode Chèque details & Upload */}
              {paymentMethod === "CHEQUE" && (
                <div className="space-y-4 border border-zinc-200/50 dark:border-zinc-850 p-5 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/10">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Règlement par Chèque Bancaire</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                      Libellez votre chèque à l&apos;ordre de <span className="text-zinc-900 dark:text-white font-black">EVO SPORTS</span>, puis téléversez une photo claire du recto du chèque ci-dessous.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                      Photo du Chèque *
                    </label>
                    <div className="flex items-center gap-4">
                      {attachmentBase64 ? (
                        <div className="flex-1 flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/30 rounded-lg">
                          <span className="text-xs font-bold text-zinc-750 dark:text-zinc-300 truncate max-w-[200px]">{attachmentName}</span>
                          <button
                            type="button"
                            onClick={() => { setAttachmentBase64(null); setAttachmentName("") }}
                            className="text-[10px] font-black uppercase text-red-500 hover:underline"
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <label className="flex-1 flex items-center justify-center border-2 border-dashed rounded-xl py-6 cursor-pointer border-zinc-200 hover:border-emerald-500/50 dark:border-zinc-800 transition-colors">
                          <div className="text-center space-y-1">
                            <svg className="mx-auto h-6 w-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="block text-xs font-bold text-zinc-600 dark:text-zinc-350">Joindre la photo du chèque</span>
                            <span className="block text-[10px] text-zinc-400">PNG, JPG (Max 2 Mo)</span>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-md hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 transition-all font-sport italic"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Traitement...
                  </>
                ) : (
                  paymentMethod === "SERIAL" ? "Activer la licence" : "Soumettre le paiement"
                )}
              </button>

            </form>
          </div>

          {/* Pricing summary sidebar */}
          <div className="rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70 p-6 shadow-xl space-y-6">
            <h3 className="text-md font-black uppercase tracking-wider text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
              Récapitulatif de l&apos;Abonnement
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span>Club</span>
                <span className="text-zinc-900 dark:text-white truncate max-w-[120px]">{clubInfo?.clubName}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span>Formule Choisie</span>
                <span className="text-zinc-900 dark:text-white font-extrabold">
                  {actionType === "UPGRADE" && clubInfo?.subscriptionPlan ? getNextPlan(clubInfo.subscriptionPlan) : selectedPlan}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span>Fréquence</span>
                <span className="text-zinc-900 dark:text-white font-extrabold capitalize">{billingPeriod === "monthly" ? "Mensuel" : "Annuel"}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span>Statut Actuel</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${
                  clubInfo?.subscriptionStatus === "Essai"
                    ? (clubInfo?.subscriptionExpires && new Date(clubInfo.subscriptionExpires) < new Date()
                      ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400")
                    : clubInfo?.subscriptionStatus === "Actif"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                }`}>
                  {clubInfo?.subscriptionStatus === "Essai"
                    ? (clubInfo?.subscriptionExpires && new Date(clubInfo.subscriptionExpires) < new Date()
                      ? "Essai Expiré"
                      : "Essai Gratuit")
                    : clubInfo?.subscriptionStatus || "Bloqué"}
                </span>
              </div>

              {clubInfo?.subscriptionExpires && (
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                  <span>Expiration</span>
                  <span className="text-zinc-900 dark:text-white">
                    {new Date(clubInfo.subscriptionExpires).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>

            {paymentMethod !== "SERIAL" && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Montant Total à Régler</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{getCalculatedPrice().toLocaleString()}</span>
                  <span className="ml-1 text-sm font-bold text-zinc-500">DA</span>
                  <span className="ml-1 text-[10px] text-zinc-400">/{billingPeriod === "monthly" ? "mois" : "an"}</span>
                </div>
              </div>
            )}

            {paymentMethod === "SERIAL" && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-center">
                <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
                  L&apos;activation par code de série s&apos;applique immédiatement avec l&apos;offre et la durée encodées dans le numéro de série.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

    </div>
  )
}
