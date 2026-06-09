"use client"

import { useState, useTransition } from "react"
import { updateMedicalRecord } from "@/app/dashboard/medical/dossier-medical/actions"
import { useRouter } from "next/navigation"

export interface PlayerMedicalInfo {
  id: string
  name: string
  number: number | null
  position: string | null
  teamCategoryName: string | null
  bloodGroup: string | null
  allergies: string | null
  lastCheckup: string | null
  clearance: string | null
  medicalNotes: string[]
}

interface DossierMedicalClientProps {
  initialPlayers: PlayerMedicalInfo[]
  userRole: string
}

export default function DossierMedicalClient({
  initialPlayers,
  userRole,
}: DossierMedicalClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [players, setPlayers] = useState<PlayerMedicalInfo[]>(initialPlayers)
  const [activePlayer, setActivePlayer] = useState<PlayerMedicalInfo | null>(
    initialPlayers.length > 0 ? initialPlayers[0] : null
  )

  // Form states
  const [bloodGroup, setBloodGroup] = useState(activePlayer?.bloodGroup || "")
  const [allergies, setAllergies] = useState(activePlayer?.allergies || "")
  const [clearance, setClearance] = useState(activePlayer?.clearance || "Autorisé")
  const [lastCheckup, setLastCheckup] = useState(
    activePlayer?.lastCheckup || new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  )
  const [newNote, setNewNote] = useState("")

  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Update form fields when active player changes
  const handleSelectPlayer = (player: PlayerMedicalInfo) => {
    setActivePlayer(player)
    setBloodGroup(player.bloodGroup || "")
    setAllergies(player.allergies || "")
    setClearance(player.clearance || "Autorisé")
    setLastCheckup(
      player.lastCheckup || new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    )
    setNewNote("")
    setErrorMsg("")
    setSuccessMsg("")
  }

  // Can the current user edit the records?
  const canEdit = ["PRESIDENT", "MANAGER_EVO_SPORTS", "MEDECIN"].includes(userRole)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activePlayer) return

    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await updateMedicalRecord(activePlayer.id, {
        bloodGroup,
        allergies,
        clearance,
        lastCheckup,
        newNote: newNote.trim() || undefined,
      })

      if (res.success) {
        setSuccessMsg("Dossier médical mis à jour avec succès !")
        setNewNote("")

        // Update local state
        const updatedPlayers = players.map((p) => {
          if (p.id !== activePlayer.id) return p
          const notes = [...p.medicalNotes]
          if (newNote.trim()) {
            notes.push(newNote.trim())
          }
          return {
            ...p,
            bloodGroup,
            allergies,
            clearance,
            lastCheckup,
            medicalNotes: notes,
          }
        })
        setPlayers(updatedPlayers)
        const updatedActive = updatedPlayers.find((p) => p.id === activePlayer.id)
        if (updatedActive) {
          setActivePlayer(updatedActive)
        }

        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4000)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors de la mise à jour.")
      }
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Dossiers Médicaux Confidentiels
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Fiches d&apos;aptitude athlétique, antécédents de santé, allergies déclarées et observations cliniques de l&apos;équipe médicale.
          </p>
        </div>
        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
          🔒 Accès Médical Sécurisé ({userRole})
        </span>
      </section>

      {players.length === 0 ? (
        <div className="p-8 text-center font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          Aucun joueur enregistré pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Player Roster Selector (Left Col) */}
          <div className="lg:col-span-1 rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-4 max-h-[70vh] overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Sélectionner un Joueur ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map((p) => {
                const isSelected = activePlayer?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlayer(p)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex justify-between items-center cursor-pointer ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : "bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/55 border-zinc-200 dark:border-zinc-850 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide truncate max-w-[150px]">
                        {p.name}
                      </p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">
                        {p.teamCategoryName || "Sans Équipe"} • N° {p.number ?? "--"}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      p.clearance === "Autorisé" || !p.clearance
                        ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : p.clearance === "Restreint"
                        ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                        : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                    }`}>
                      {p.clearance || "Autorisé"}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Player Folder (Right 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {activePlayer && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 shadow-sm space-y-6">
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    {/* SVG Football Jersey Icon */}
                    <div className="relative">
                      <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current text-emerald-500 dark:text-emerald-400">
                        <path d="M 80 10 L 65 10 C 60 20 40 20 35 10 L 20 10 L 5 25 L 20 35 L 20 90 L 80 90 L 80 35 L 95 25 Z" />
                        <text x="50" y="62" textAnchor="middle" className="fill-white dark:fill-zinc-900 font-black text-3xl font-sans">
                          {activePlayer.number ?? ""}
                        </text>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase text-zinc-900 dark:text-white tracking-wide">
                        Dossier de {activePlayer.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase mt-0.5">
                        Poste : {activePlayer.position || "Non spécifié"} | Dernier bilan : {activePlayer.lastCheckup || "Jamais"}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-widest border ${
                    activePlayer.clearance === "Autorisé" || !activePlayer.clearance
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : activePlayer.clearance === "Restreint"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400"
                  }`}>
                    Aptitude : {activePlayer.clearance || "Autorisé"}
                  </span>
                </div>

                {/* Quick Indicators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="rounded-xl border border-zinc-150 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-black">Groupe Sanguin</p>
                    <p className="text-zinc-800 dark:text-zinc-200 text-sm font-black mt-1">
                      {activePlayer.bloodGroup || "Non renseigné"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-150 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 uppercase font-black">Allergies connues</p>
                    <p className={`text-sm font-black mt-1 ${activePlayer.allergies ? "text-red-500" : "text-zinc-500"}`}>
                      {activePlayer.allergies || "Aucune allergie signalée"}
                    </p>
                  </div>
                </div>

                {/* Medical Log Observations */}
                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">
                    Observations Cliniques du Médecin
                  </p>
                  {activePlayer.medicalNotes.length === 0 ? (
                    <div className="text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/10 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs font-bold">
                      Aucune note ou observation enregistrée pour ce joueur.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activePlayer.medicalNotes.map((note, index) => (
                        <div
                          key={index}
                          className="bg-zinc-50 dark:bg-zinc-950/30 rounded-xl px-4 py-3 border border-zinc-150 dark:border-zinc-850 text-xs font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed relative pl-6"
                        >
                          <span className="absolute left-2.5 top-4 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 shadow-sm" />
                          {note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Form (Only shown if user has allowed role) */}
                {canEdit ? (
                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-850">
                    <h4 className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-4">
                      Mettre à jour le Dossier & Ajouter une Observation
                    </h4>

                    {successMsg && (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center mb-4">
                        {successMsg}
                      </div>
                    )}

                    {errorMsg && (
                      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 dark:text-red-400 text-center mb-4">
                        {errorMsg}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                            Groupe Sanguin
                          </label>
                          <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                          >
                            <option value="">Non renseigné</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                            Allergies connues
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Pénicilline, Pollen ou 'Aucune'"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                            Date du dernier bilan
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: 12 Juin 2026"
                            value={lastCheckup}
                            onChange={(e) => setLastCheckup(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                            Aptitude athlétique
                          </label>
                          <select
                            value={clearance}
                            onChange={(e) => setClearance(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-bold"
                          >
                            <option value="Autorisé">Autorisé (Aptitude complète)</option>
                            <option value="Restreint">Restreint (Entraînement adapté)</option>
                            <option value="Interdit">Interdit (Repos médical complet)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                          Nouvelle observation (Optionnel)
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Ex: Aptitude cardiovasculaire confirmée, kinésithérapie nécessaire pour légère tension..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isPending}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider px-5 py-3 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? "Enregistrement..." : "Enregistrer les modifications 💾"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 text-xs font-semibold text-zinc-400 text-center">
                    🔒 Vous n&apos;avez pas les permissions nécessaires pour modifier ce dossier médical.
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
