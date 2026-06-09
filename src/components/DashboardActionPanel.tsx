"use client"

import { useState } from "react"

interface ActionItem {
  label: string
  actionName: string
}

interface PanelConfig {
  title: string
  description: string
  colorTheme: {
    border: string
    bg: string
    titleText: string
    dot: string
    badge: string
  }
  requiredPermission: string
  actions: {
    add: ActionItem
    edit: ActionItem
    delete: ActionItem
    block: ActionItem
  }
}

export default function DashboardActionPanel({
  userRole,
  permissions,
  isPresidentOrManager,
}: {
  userRole: string
  permissions: string[]
  isPresidentOrManager: boolean
}) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "info">("success")

  const hasPerm = (required: string) => {
    if (isPresidentOrManager) return true
    return permissions.includes(required)
  }

  const triggerAction = (actionName: string, sector: string) => {
    setToastType("success")
    setToastMessage(`Succès : L'action "${actionName}" a été exécutée avec succès dans le secteur "${sector}".`)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const panels: PanelConfig[] = [
    {
      title: "Bureau Directeur (Présidence)",
      description: "Gestion stratégique, audit des statuts du club, configurations système et validations de haut niveau.",
      colorTheme: {
        border: "border-red-200/60 dark:border-red-950/40",
        bg: "bg-red-50/10 dark:bg-red-950/5",
        titleText: "text-red-900 dark:text-red-400",
        dot: "bg-red-500",
        badge: "bg-red-500/10 text-red-500",
      },
      requiredPermission: "roles:write",
      actions: {
        add: { label: "Ajouter Staff", actionName: "Ajouter un membre de staff" },
        edit: { label: "Modifier Club", actionName: "Modifier les informations juridiques" },
        delete: { label: "Supprimer Rôle", actionName: "Supprimer un rôle personnalisé" },
        block: { label: "Bloquer Compte", actionName: "Bloquer un accès utilisateur" },
      },
    },
    {
      title: "Pôle Recrutement & Contrats",
      description: "Gestion des transferts de joueurs, négociations salariales, budget et signatures des contrats sportifs.",
      colorTheme: {
        border: "border-amber-200/60 dark:border-amber-950/40",
        bg: "bg-amber-50/10 dark:bg-amber-950/5",
        titleText: "text-amber-900 dark:text-amber-400",
        dot: "bg-amber-500",
        badge: "bg-amber-500/10 text-amber-500",
      },
      requiredPermission: "effectifs:write",
      actions: {
        add: { label: "Ajouter Offre", actionName: "Ajouter une proposition de transfert" },
        edit: { label: "Modifier Salaire", actionName: "Modifier la grille salariale" },
        delete: { label: "Supprimer Offre", actionName: "Supprimer une option contractuelle" },
        block: { label: "Bloquer Budget", actionName: "Bloquer le budget de recrutement" },
      },
    },
    {
      title: "Secrétariat Général & Logistique",
      description: "Organisation des matchs officiels, homologations des licences auprès de la Fédération et réservations.",
      colorTheme: {
        border: "border-teal-200/60 dark:border-teal-950/40",
        bg: "bg-teal-50/10 dark:bg-teal-950/5",
        titleText: "text-teal-900 dark:text-teal-400",
        dot: "bg-teal-500",
        badge: "bg-teal-500/10 text-teal-500",
      },
      requiredPermission: "match:write",
      actions: {
        add: { label: "Planifier Match", actionName: "Planifier un match de championnat" },
        edit: { label: "Modifier Licence", actionName: "Modifier un dossier de licence" },
        delete: { label: "Supprimer Match", actionName: "Annuler le planning logistique" },
        block: { label: "Bloquer Accès", actionName: "Bloquer la feuille de match officielle" },
      },
    },
    {
      title: "Espace Technique & Tactique",
      description: "Création des séances d'entraînement physiques/tactiques et gestion des compositions d'équipe type.",
      colorTheme: {
        border: "border-indigo-200/60 dark:border-indigo-950/40",
        bg: "bg-indigo-50/10 dark:bg-indigo-950/5",
        titleText: "text-indigo-900 dark:text-indigo-400",
        dot: "bg-indigo-500",
        badge: "bg-indigo-500/10 text-indigo-500",
      },
      requiredPermission: "entrainement:write",
      actions: {
        add: { label: "Créer Séance", actionName: "Créer une séance d'entraînement" },
        edit: { label: "Modifier 11 Type", actionName: "Modifier la composition d'équipe" },
        delete: { label: "Annuler Séance", actionName: "Supprimer un exercice tactique" },
        block: { label: "Bloquer Roster", actionName: "Verrouiller le vestiaire d'équipe" },
      },
    },
    {
      title: "Pôle Médical & Aptitudes",
      description: "Suivi des protocoles de rééducation des blessures, fiches d'aptitudes physiques et bilans de santé.",
      colorTheme: {
        border: "border-rose-200/60 dark:border-rose-950/40",
        bg: "bg-rose-50/10 dark:bg-rose-950/5",
        titleText: "text-rose-900 dark:text-rose-400",
        dot: "bg-rose-500",
        badge: "bg-rose-500/10 text-rose-500",
      },
      requiredPermission: "medical:write",
      actions: {
        add: { label: "Déclarer Blessure", actionName: "Déclarer une indisponibilité joueur" },
        edit: { label: "Modifier Traitement", actionName: "Modifier la fiche de soin" },
        delete: { label: "Supprimer Fiche", actionName: "Archiver un compte rendu médical" },
        block: { label: "Bloquer Aptitude", actionName: "Bloquer l'aptitude physique de match" },
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Dynamic Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-md rounded-2xl border border-emerald-500 bg-white dark:bg-zinc-900 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider">Autorisation Appliquée</h4>
              <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-semibold">{toastMessage}</p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {panels.map((panel) => {
        const isAuthorized = hasPerm(panel.requiredPermission)

        return (
          <div
            key={panel.title}
            className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${panel.colorTheme.border} ${panel.colorTheme.bg}`}
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150/40 dark:border-zinc-800/40">
              <div className="flex items-center space-x-2">
                <span className={`flex h-2.5 w-2.5 rounded-full ${panel.colorTheme.dot}`} />
                <h3 className={`text-sm font-black uppercase tracking-wider ${panel.colorTheme.titleText}`}>
                  {panel.title}
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                isAuthorized ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-400"
              }`}>
                {isAuthorized ? (
                  <>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    Accès Autorisé
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    Accès Restreint
                  </>
                )}
              </span>
            </div>

            {/* Description */}
            <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
              {panel.description}
            </p>

            {/* Action Grid Matrix */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Matrice des Droits d&apos;Actions (CRUD & Blocage)
                </span>
                {!isAuthorized && (
                  <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                    Permissions manquantes pour ce Rôle
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. ADD ACTION */}
                <button
                  onClick={() => triggerAction(panel.actions.add.actionName, panel.title)}
                  disabled={!isAuthorized}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-center border transition-all duration-200 ${
                    isAuthorized
                      ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border-zinc-300/80 text-emerald-800 hover:from-white hover:text-emerald-600 hover:via-zinc-100 hover:to-zinc-200 active:scale-95 shadow-sm cursor-pointer"
                      : "bg-zinc-100/30 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed select-none opacity-40 line-through"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {!isAuthorized && "🔒"} ➕ {panel.actions.add.label}
                  </span>
                </button>

                {/* 2. EDIT ACTION */}
                <button
                  onClick={() => triggerAction(panel.actions.edit.actionName, panel.title)}
                  disabled={!isAuthorized}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-center border transition-all duration-200 ${
                    isAuthorized
                      ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border-zinc-300/80 text-emerald-800 hover:from-white hover:text-emerald-600 hover:via-zinc-100 hover:to-zinc-200 active:scale-95 shadow-sm cursor-pointer"
                      : "bg-zinc-100/30 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed select-none opacity-40 line-through"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {!isAuthorized && "🔒"} ✏️ {panel.actions.edit.label}
                  </span>
                </button>

                {/* 3. DELETE ACTION */}
                <button
                  onClick={() => triggerAction(panel.actions.delete.actionName, panel.title)}
                  disabled={!isAuthorized}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-center border transition-all duration-200 ${
                    isAuthorized
                      ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border-zinc-300/80 text-emerald-800 hover:from-white hover:text-emerald-600 hover:via-zinc-100 hover:to-zinc-200 active:scale-95 shadow-sm cursor-pointer"
                      : "bg-zinc-100/30 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed select-none opacity-40 line-through"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {!isAuthorized && "🔒"} 🗑️ {panel.actions.delete.label}
                  </span>
                </button>

                {/* 4. BLOCK ACTION */}
                <button
                  onClick={() => triggerAction(panel.actions.block.actionName, panel.title)}
                  disabled={!isAuthorized}
                  className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider text-center border transition-all duration-200 ${
                    isAuthorized
                      ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border-zinc-300/80 text-emerald-800 hover:from-white hover:text-emerald-600 hover:via-zinc-100 hover:to-zinc-200 active:scale-95 shadow-sm cursor-pointer"
                      : "bg-zinc-100/30 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800/40 text-zinc-400 dark:text-zinc-650 cursor-not-allowed select-none opacity-40 line-through"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1">
                    {!isAuthorized && "🔒"} 🚫 {panel.actions.block.label}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
