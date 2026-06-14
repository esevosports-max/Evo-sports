"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { declareInjury, healPlayer } from "@/app/dashboard/medical/blessures/actions"

interface Category {
  id: string
  name: string
}

interface Player {
  id: string
  name: string
  teamCategoryId: string | null
  teamCategoryName: string | null
  isInjured: boolean
  injuryType: string | null
  injurySeverity: string | null
  injuryDuration: string | null
  injuryDate: Date | null
  injuryReturn: Date | null
  injuryStatus: string | null
  injuryProgress: number
  injuryDeclaredBy: string | null
}

interface BlessuresClientProps {
  initialPlayers: Player[]
  categories: Category[]
  userRole?: string
}

export default function BlessuresClient({ initialPlayers, categories, userRole }: BlessuresClientProps) {
  const isPlayer = userRole === "JOUEUR"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [selectedReportPlayer, setSelectedReportPlayer] = useState<Player | null>(null)
  
  // Lists filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("Tous")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("Tous")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Form states
  const [formTeamId, setFormTeamId] = useState<string>("")
  const [formPlayerId, setFormPlayerId] = useState<string>("")
  const [injuryType, setInjuryType] = useState("")
  const [severity, setSeverity] = useState<"Bénigne" | "Modérée" | "Grave">("Modérée")
  const [durationValue, setDurationValue] = useState<number>(3)
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months">("weeks")
  const [dateDeclared, setDateDeclared] = useState<string>(
    new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    if (selectedReportPlayer) {
      const timer = setTimeout(() => {
        window.print()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [selectedReportPlayer])

  // Filter players for the list of unavailable players (where isInjured is true)
  const injuredPlayers = initialPlayers.filter((p) => {
    if (!p.isInjured) return false
    
    // Category filter
    const matchesCategory = 
      selectedCategoryFilter === "Tous"
        ? true
        : selectedCategoryFilter === "Sans équipe"
        ? !p.teamCategoryId
        : p.teamCategoryId === selectedCategoryFilter

    if (!matchesCategory) return false

    // Status filter
    const isHealed = p.injuryReturn ? new Date(p.injuryReturn) <= new Date() : false
    if (selectedStatusFilter === "Actif") return !isHealed
    if (selectedStatusFilter === "Expire") return isHealed
    
    return true
  })

  // Filter players for the form selection based on selected team
  const availablePlayersForForm = initialPlayers.filter((p) => {
    // Match the selected category
    const matchesCategory = 
      formTeamId === "Sans équipe" 
        ? !p.teamCategoryId 
        : p.teamCategoryId === formTeamId
    
    // Do not show players who are already injured in the selection list
    return matchesCategory && !p.isInjured
  })

  const getEstimatedReturnDate = () => {
    if (!dateDeclared || !durationValue) return null
    const d = new Date(dateDeclared)
    if (durationUnit === "days") {
      d.setDate(d.getDate() + Number(durationValue))
    } else if (durationUnit === "weeks") {
      d.setDate(d.getDate() + Number(durationValue) * 7)
    } else if (durationUnit === "months") {
      d.setMonth(d.getMonth() + Number(durationValue))
    }
    return d
  }

  const estimatedReturnDate = getEstimatedReturnDate()

  const handleDeclare = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg("")

    if (!formPlayerId) {
      setErrorMsg("Veuillez sélectionner un joueur.")
      return
    }
    if (!injuryType) {
      setErrorMsg("Veuillez saisir un diagnostic.")
      return
    }

    const selectedPlayer = initialPlayers.find(p => p.id === formPlayerId)
    const playerName = selectedPlayer?.name || "le joueur"

    startTransition(async () => {
      const res = await declareInjury(formPlayerId, {
        injuryType,
        severity,
        durationValue,
        durationUnit,
        dateDeclared
      })

      if (res.success) {
        setSuccessMsg(`Fiche d'indisponibilité créée pour ${playerName} !`)
        setFormPlayerId("")
        setInjuryType("")
        setSeverity("Modérée")
        setDurationValue(3)
        setDurationUnit("weeks")
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const handleHeal = (playerId: string, playerName: string) => {
    startTransition(async () => {
      const res = await healPlayer(playerId)
      if (res.success) {
        setSuccessMsg(`${playerName} est rétabli et de retour dans l'effectif actif !`)
        router.refresh()
        setTimeout(() => setSuccessMsg(""), 5000)
      } else {
        setErrorMsg(res.error || "Impossible de mettre à jour le statut du joueur.")
        setTimeout(() => setErrorMsg(""), 5000)
      }
    })
  }

  const formatDate = (d: any) => {
    if (!d) return "N/A"
    const dateObj = new Date(d)
    if (isNaN(dateObj.getTime())) return "N/A"
    return dateObj.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Suivi des Blessures & Infirmerie
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Registre interne confidentiel d&apos;indisponibilité physique, protocoles de rééducation et retour au jeu.
          </p>
        </div>

        {/* List Filters */}
        {!isPlayer && (
          <div className="flex flex-wrap items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase pl-1">Équipe :</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Tous">Toutes</option>
                <option value="Sans équipe">Sans équipe</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase pl-1">Statut :</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 shadow-sm outline-none transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Tous">Tous les rapports</option>
                <option value="Actif">Blessures Actives</option>
                <option value="Expiré">Retours Dépassés</option>
                <option value="Rétabli">Joueurs Rétablis</option>
              </select>
            </div>
          </div>
        )}
      </section>

      {/* Grid: Injury Log & Declare Injury Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Injury Logs (Left 2 cols) */}
        <div className={`${isPlayer ? "lg:col-span-3" : "lg:col-span-2"} space-y-4`}>
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
              Rapports & Archives Médicales ({injuredPlayers.length})
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
              * Les rapports en noir et blanc indiquent un dossier expiré ou guéri.
            </span>
          </div>

          {injuredPlayers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-850 p-12 text-center text-zinc-500 font-bold">
              Aucun rapport médical disponible pour cette sélection.
            </div>
          ) : (
            <div className="space-y-4">
              {injuredPlayers.map((record) => {
                const isStatusActif = record.injuryStatus === "Actif";
                const isStatusExpired = record.injuryStatus === "Expiré";
                const isStatusHealed = record.injuryStatus === "Rétabli";

                return (
                  <div 
                    key={record.id} 
                    className={`rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row justify-between gap-6 relative overflow-hidden transition-all duration-300 ${
                      isStatusActif 
                        ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" 
                        : "border-zinc-200 bg-zinc-50/50 grayscale dark:border-zinc-800 dark:bg-zinc-950/40 opacity-80"
                    }`}
                  >
                    {/* Left vertical status bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      isStatusActif 
                        ? 'bg-red-500' 
                        : isStatusHealed 
                        ? 'bg-emerald-500' 
                        : 'bg-zinc-400'
                    }`} />
                    
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-white tracking-wide">
                          {record.name}
                        </h4>
                        
                        {record.teamCategoryName && (
                          <span className="inline-flex rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-zinc-500">
                            {record.teamCategoryName}
                          </span>
                        )}

                        <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          !isStatusActif 
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                            : record.injurySeverity === "Grave" 
                            ? "bg-red-500/10 text-red-500" 
                            : record.injurySeverity === "Modérée" 
                            ? "bg-amber-500/10 text-amber-500" 
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}>
                          Gravité: {record.injurySeverity}
                        </span>

                        {isStatusActif && (
                          <span className="inline-flex rounded-lg bg-red-500/10 text-red-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            🩹 Blessure Active
                          </span>
                        )}
                        {isStatusExpired && (
                          <span className="inline-flex rounded-lg bg-amber-500/10 text-amber-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            ⏳ Retour estimé atteint
                          </span>
                        )}
                        {isStatusHealed && (
                          <span className="inline-flex rounded-lg bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                            ✔️ Joueur Rétabli
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{record.injuryType}</p>
                      
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          Statut : <strong className="text-zinc-650 dark:text-zinc-400">{record.injuryStatus}</strong>
                        </p>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          Durée : <strong className="text-zinc-650 dark:text-zinc-400">{record.injuryDuration}</strong>
                        </p>
                      </div>

                      {/* Progress recovery bar */}
                      <div className="space-y-1 pt-1.5">
                        <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase">
                          <span>Protocole de rééducation</span>
                          <span>{record.injuryProgress}% complété</span>
                        </div>
                        <div className="w-full bg-zinc-150 rounded-full h-1.5 dark:bg-zinc-800">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-1000 ${
                              isStatusActif 
                                ? 'bg-emerald-500' 
                                : isStatusHealed 
                                ? 'bg-emerald-600' 
                                : 'bg-zinc-400'
                            }`} 
                            style={{ width: `${record.injuryProgress}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col justify-between items-end shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-zinc-150 dark:border-zinc-800 min-w-[170px]">
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase">Déclarée le</p>
                        <p className="text-zinc-850 dark:text-zinc-200 text-xs font-black">{formatDate(record.injuryDate)}</p>
                      </div>
                      
                      <div className="text-right mt-3 sm:mt-0">
                        <p className="text-[9px] text-zinc-400 font-bold uppercase">Retour Estimé</p>
                        <p className={`text-xs font-black ${!isStatusActif ? 'text-zinc-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {formatDate(record.injuryReturn)}
                        </p>
                      </div>

                      {!isStatusHealed ? (
                        <div className="flex gap-2 w-full mt-3">
                          <button
                            onClick={() => setSelectedReportPlayer(record)}
                            className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider py-1.5 px-3 transition-all cursor-pointer text-center"
                          >
                            Rapport 📄
                          </button>
                          {!isPlayer && (
                            <button
                              onClick={() => handleHeal(record.id, record.name)}
                              disabled={isPending}
                              className="flex-1 rounded-lg bg-zinc-150 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-zinc-800 dark:hover:bg-emerald-950/30 text-zinc-650 dark:text-zinc-350 text-[10px] font-extrabold uppercase tracking-wider py-1.5 px-3 transition-all border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer text-center"
                            >
                              Rétabli ✔️
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedReportPlayer(record)}
                          className="mt-3 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-extrabold uppercase tracking-wider py-1.5 px-3 transition-all cursor-pointer text-center no-print"
                        >
                          Voir le Rapport 📄
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Declare Injury Form (Right 1 col) */}
        {!isPlayer && (
          <div className="lg:col-span-1 rounded-2xl border border-emerald-500/30 bg-emerald-50/25 dark:border-emerald-800/40 dark:bg-emerald-950/20 p-6 shadow-sm space-y-6 h-fit backdrop-blur-sm">
          <div className="space-y-1 pb-3 border-b border-zinc-150 dark:border-zinc-850">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              Déclarer une Blessure
            </h3>
            <p className="text-[10px] text-zinc-450">Enregistrer une nouvelle indisponibilité physique.</p>
          </div>

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 text-center animate-bounce">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleDeclare} className="space-y-4">
            {/* Step 1: Choose Team */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">1. Choisir l&apos;Équipe</label>
              <select
                required
                value={formTeamId}
                onChange={(e) => {
                  setFormTeamId(e.target.value)
                  setFormPlayerId("") // Reset player selection when team changes
                }}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="">Sélectionner une équipe...</option>
                <option value="Sans équipe">Joueurs sans équipe</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Choose Player (appears once team is chosen) */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">2. Choisir le Joueur</label>
              <select
                required
                disabled={!formTeamId}
                value={formPlayerId}
                onChange={(e) => setFormPlayerId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all disabled:opacity-50 disabled:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                {!formTeamId ? (
                  <option value="">Sélectionnez d&apos;abord une équipe</option>
                ) : availablePlayersForForm.length === 0 ? (
                  <option value="">Aucun joueur disponible dans cette équipe</option>
                ) : (
                  <>
                    <option value="">Sélectionner un joueur...</option>
                    {availablePlayersForForm.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Step 3: Diagnostic */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">3. Diagnostic / Blessure</label>
              <input
                type="text"
                required
                placeholder="Ex: Entorse externe de la cheville"
                value={injuryType}
                onChange={(e) => setInjuryType(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
              />
            </div>

            {/* Step 4: Gravité */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">4. Gravité</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              >
                <option value="Bénigne">Bénigne (Soins simples)</option>
                <option value="Modérée">Modérée (Arrêt temporaire)</option>
                <option value="Grave">Grave (Arrêt prolongé / Chirurgie)</option>
              </select>
            </div>

            {/* Step 5: Durée d'indisponibilité */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">5. Durée d&apos;indisponibilité</label>
              <div className="grid grid-cols-5 gap-2">
                <input
                  type="number"
                  required
                  min="1"
                  value={durationValue}
                  onChange={(e) => setDurationValue(Number(e.target.value))}
                  className="col-span-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold text-center"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as any)}
                  className="col-span-3 w-full rounded-xl border border-zinc-200 bg-white px-2 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                >
                  <option value="days">Jours</option>
                  <option value="weeks">Semaines</option>
                  <option value="months">Mois</option>
                </select>
              </div>
            </div>

            {/* Step 6: Date de la blessure */}
            <div>
              <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">6. Date de la blessure</label>
              <input
                type="date"
                required
                value={dateDeclared}
                onChange={(e) => setDateDeclared(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none focus:border-red-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
              />
            </div>

            {/* Live Auto Calculation Display */}
            {estimatedReturnDate && (
              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-950/60 p-3 border border-zinc-150 dark:border-zinc-850 space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase text-zinc-400">
                  <span>Calcul automatique de retour</span>
                  <span className="text-emerald-500">✔ Actif</span>
                </div>
                <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Date de retour estimée :{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatDate(estimatedReturnDate)}
                  </strong>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !formPlayerId}
              className="w-full rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-wider py-3.5 shadow-md shadow-red-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isPending ? "Enregistrement..." : "Déclarer Blessé 🩹"}
            </button>
          </form>
        </div>
        )}
      </div>

      {selectedReportPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-sm animate-in fade-in duration-200 print:bg-white print:p-0">
          {/* Styles for printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .print-report-modal, .print-report-modal * {
                visibility: visible;
              }
              .print-report-modal {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none !important;
                box-shadow: none !important;
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="print-report-modal bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:rounded-none max-h-[95vh] flex flex-col">
            
            {/* Conf confidential header banner with X close button */}
            <div className="bg-red-600 text-white px-6 py-2.5 flex justify-between items-center text-[10px] font-black uppercase tracking-wider print:bg-zinc-800 print:text-white pr-10 relative">
              <span>🔒 Fiche Médicale Confidentielle</span>
              <span>EVO Sports Club</span>
              
              <button
                onClick={() => setSelectedReportPlayer(null)}
                className="absolute right-4 top-2 text-white hover:text-red-100 text-sm font-black transition-all cursor-pointer no-print focus:outline-none"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Logo & Title */}
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                    Rapport de Blessure & Indisponibilité
                  </h2>
                  <p className="text-xs text-zinc-405 dark:text-zinc-400 font-bold mt-1">
                    Généré automatiquement par le Département Médical
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">ID Joueur</p>
                  <p className="text-xs font-mono font-bold text-zinc-650 dark:text-zinc-350">
                    #{selectedReportPlayer.id.substring(selectedReportPlayer.id.length - 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Grid Athlete Info & Injury Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Patient */}
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Informations Joueur
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Nom de l'Athlète</span>
                      <span className="font-extrabold text-zinc-900 dark:text-white text-sm">{selectedReportPlayer.name}</span>
                    </div>
                    {selectedReportPlayer.teamCategoryName && (
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Équipe / Catégorie</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{selectedReportPlayer.teamCategoryName}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Déclaré par (Staff)</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{selectedReportPlayer.injuryDeclaredBy || "Staff Médical"}</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Assessment */}
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                    Diagnostic & Indisponibilité
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Diagnostic</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{selectedReportPlayer.injuryType}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Gravité</span>
                        <span className={`font-extrabold ${
                          selectedReportPlayer.injurySeverity === "Grave" ? "text-red-500" : selectedReportPlayer.injurySeverity === "Modérée" ? "text-amber-500" : "text-emerald-500"
                        }`}>{selectedReportPlayer.injurySeverity}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase block">Durée estimée</span>
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">{selectedReportPlayer.injuryDuration}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase block">Réhabilitation prescrite</span>
                      <span className="font-bold text-zinc-600 dark:text-zinc-400">{selectedReportPlayer.injuryStatus}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Timing details */}
              <div className="border-t border-b border-zinc-100 dark:border-zinc-800 py-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Date Déclarée</span>
                  <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{formatDate(selectedReportPlayer.injuryDate)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Date de Retour Estimée</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatDate(selectedReportPlayer.injuryReturn)}</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-2 bg-emerald-50/10 dark:bg-zinc-950 p-4 rounded-xl border border-emerald-500/10">
                <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase">
                  <span>Progression du Protocole de Soins</span>
                  <span className="text-emerald-500">{selectedReportPlayer.injuryProgress}% complété</span>
                </div>
                <div className="w-full bg-zinc-150 rounded-full h-2 dark:bg-zinc-800">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${selectedReportPlayer.injuryProgress}%` }} 
                  />
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-12 text-xs">
                <div>
                  <div className="w-40 border-b border-zinc-200 dark:border-zinc-800 h-10 mb-1" />
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Signature du Praticien</span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="w-40 border-b border-zinc-200 dark:border-zinc-800 h-10 mb-1" />
                  <span className="text-[9px] text-zinc-400 font-bold uppercase block">Cachet Médical Club</span>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-zinc-50 dark:bg-zinc-950/60 px-6 py-4 flex justify-between gap-3 border-t border-zinc-150 dark:border-zinc-850 no-print">
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold uppercase text-xs px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                Imprimer 🖨️
              </button>
              <button
                onClick={() => setSelectedReportPlayer(null)}
                className="rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-750 dark:text-zinc-200 font-extrabold uppercase text-xs px-5 py-2.5 transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
