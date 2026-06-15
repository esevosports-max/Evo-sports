"use client"

import { useState, useTransition, useMemo } from "react"
import { updateMedicalRecord } from "@/app/dashboard/medical/dossier-medical/actions"
import { useRouter } from "next/navigation"

export interface UnifiedMedicalRecord {
  id: string
  userId: string
  name: string
  type: "JOUEUR" | "STAFF"
  roleLabel: string
  teamCategoryName: string | null
  teamCategoryId: string | null
  bloodGroup: string | null
  allergies: string | null
  lastCheckup: string | null
  clearance: string | null
  medicalNotes: string[]
  number: number | null
  position: string | null
  age: number | null
  nationality: string | null
  birthDate: string | null
  medicalTreatment: string | null
  medication: string | null
}

const JerseyIcon = ({ number }: { number: number | null }) => (
  <div className="relative flex items-center justify-center w-8 h-8 select-none shrink-0">
    <svg className="w-full h-full text-emerald-500 dark:text-emerald-400 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L3 5.5V9h2.5v11h13V9H21V5.5L18 2h-3.5c-.2 1.3-1.3 2.5-2.5 2.5S9.7 3.3 9.5 2H6z" />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white dark:text-zinc-950 mt-1">
      {number !== null ? number : ""}
    </span>
  </div>
)

const StaffIcon = ({ role }: { role: string }) => {
  const abbr = useMemo(() => {
    if (!role) return "ST"
    const clean = role.trim().replace(/[^a-zA-Z\sÀ-ÿ]/g, "")
    const words = clean.split(/\s+/).filter((w) => w.length > 0)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return clean.substring(0, 2).toUpperCase()
  }, [role])

  const colorClasses = useMemo(() => {
    switch (abbr) {
      case "PR": // Président
        return "bg-purple-500/10 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-400"
      case "DS": // Directeur Sportif
        return "bg-blue-500/10 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
      case "ME":
      case "MD": // Médecin
        return "bg-rose-550/10 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
      case "EP": // Entraîneur Principal
        return "bg-emerald-550/10 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
      case "EA": // Entraîneur Adjoint
        return "bg-amber-500/10 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
      case "KI": // Kiné
        return "bg-teal-500/10 border-teal-200 text-teal-700 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-400"
      default:
        return "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
    }
  }, [abbr])

  return (
    <div className={`flex items-center justify-center w-8 h-8 border rounded-xl select-none shrink-0 shadow-sm ${colorClasses}`}>
      <span className="text-[10px] font-black tracking-wider">
        {abbr}
      </span>
    </div>
  )
}

interface DossierMedicalClientProps {
  initialRecords: UnifiedMedicalRecord[]
  teamCategories: Array<{ id: string; name: string }>
  userRole: string
  clubInfo: {
    name: string
    logo: string | null
    creationDate: string
  }
}

export default function DossierMedicalClient({
  initialRecords,
  teamCategories,
  userRole,
  clubInfo,
}: DossierMedicalClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isPlayer = userRole === "JOUEUR"
  const canEdit = ["PRESIDENT", "MANAGER_EVO_SPORTS", "MEDECIN", "DIRECTEUR_SPORTIF"].includes(userRole)

  // State for all medical records
  const [records, setRecords] = useState<UnifiedMedicalRecord[]>(initialRecords)
  
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<"list" | "manage">("list")
  
  // Tab 1 (List) States
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedRole, setSelectedRole] = useState<string>("ALL")
  const [viewRecord, setViewRecord] = useState<UnifiedMedicalRecord | null>(
    isPlayer && initialRecords.length > 0 ? initialRecords[0] : null
  )

  // Tab 2 (Manage / Create-Modify) States
  const [manageMode, setManageMode] = useState<"CREATE" | "MODIFY">("CREATE")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")
  
  // Form states for Create/Modify
  const [bloodGroup, setBloodGroup] = useState("")
  const [allergies, setAllergies] = useState("")
  const [clearance, setClearance] = useState("Autorisé")
  const [lastCheckup, setLastCheckup] = useState("")
  const [newNote, setNewNote] = useState("")
  const [age, setAge] = useState("")
  const [nationality, setNationality] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [medicalTreatment, setMedicalTreatment] = useState("")
  const [medication, setMedication] = useState("")

  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Check if a record has actual medical data filled
  const hasMedicalData = (r: UnifiedMedicalRecord) => {
    return !!(
      r.bloodGroup ||
      r.allergies ||
      r.lastCheckup ||
      r.medicalNotes.length > 0 ||
      r.age ||
      r.nationality ||
      r.birthDate ||
      r.medicalTreatment ||
      r.medication
    )
  }

  // Filter members list for Creation mode (members who do NOT have a medical record yet)
  const unconfiguredMembers = useMemo(() => {
    return records.filter((r) => !hasMedicalData(r))
  }, [records])

  // Filter members list for Modification mode (members who DO have a medical record set)
  const configuredMembers = useMemo(() => {
    return records.filter((r) => hasMedicalData(r))
  }, [records])

  // Handle Tab Switch
  const handleTabChange = (tab: "list" | "manage") => {
    setActiveTab(tab)
    setErrorMsg("")
    setSuccessMsg("")
    // Reset selection in manage mode
    setSelectedMemberId("")
    resetFormFields()
  }

  // Reset Form fields
  const resetFormFields = () => {
    setBloodGroup("")
    setAllergies("")
    setClearance("Autorisé")
    setLastCheckup(new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }))
    setNewNote("")
    setAge("")
    setNationality("")
    setBirthDate("")
    setMedicalTreatment("")
    setMedication("")
  }

  // Handle member selection in Manage Mode
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    const member = records.find((r) => r.id === memberId)
    if (member) {
      setBloodGroup(member.bloodGroup || "")
      setAllergies(member.allergies || "")
      setClearance(member.clearance || "Autorisé")
      setLastCheckup(
        member.lastCheckup || new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
      )
      setAge(member.age !== null && member.age !== undefined ? String(member.age) : "")
      setNationality(member.nationality || "")
      setBirthDate(member.birthDate || "")
      setMedicalTreatment(member.medicalTreatment || "")
      setMedication(member.medication || "")
    } else {
      resetFormFields()
    }
  }

  // Handle Create or Modify Submit
  const handleManageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMemberId) {
      setErrorMsg("Veuillez sélectionner un membre.")
      return
    }

    const member = records.find((r) => r.id === selectedMemberId)
    if (!member) return

    setErrorMsg("")
    setSuccessMsg("")

    startTransition(async () => {
      const res = await updateMedicalRecord(member.id, member.type, {
        bloodGroup,
        allergies,
        clearance,
        lastCheckup,
        newNote: newNote.trim() || undefined,
        age: age ? Number(age) : undefined,
        nationality: nationality || undefined,
        birthDate: birthDate || undefined,
        medicalTreatment: medicalTreatment || undefined,
        medication: medication || undefined,
      })

      if (res.success) {
        setSuccessMsg(
          manageMode === "CREATE"
            ? "Fiche médicale créée avec succès !"
            : "Fiche médicale mise à jour avec succès !"
        )
        setNewNote("")

        // Update local state immediately
        const updatedRecords = records.map((r) => {
          if (r.id !== member.id) return r
          const notes = [...r.medicalNotes]
          if (newNote.trim()) {
            notes.push(newNote.trim())
          }
          return {
            ...r,
            bloodGroup: bloodGroup || null,
            allergies: allergies || null,
            clearance,
            lastCheckup: lastCheckup || null,
            medicalNotes: notes,
            age: age ? Number(age) : null,
            nationality: nationality || null,
            birthDate: birthDate || null,
            medicalTreatment: medicalTreatment || null,
            medication: medication || null,
          }
        })
        setRecords(updatedRecords)
        
        // If modifying, update the view context
        if (viewRecord && viewRecord.id === member.id) {
          const updatedView = updatedRecords.find((r) => r.id === member.id)
          if (updatedView) setViewRecord(updatedView)
        }

        // Reset selector
        setSelectedMemberId("")
        resetFormFields()

        router.refresh()
        setTimeout(() => setSuccessMsg(""), 4500)
      } else {
        setErrorMsg(res.error || "Une erreur est survenue lors du traitement.")
      }
    })
  }

  // Filtered list of records for display in Tab 1
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Search Query
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 2. Category Filter
      let matchesCategory = true
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "NONE") {
          matchesCategory = !r.teamCategoryId
        } else {
          matchesCategory = r.teamCategoryId === selectedCategory
        }
      }

      // 3. Role Filter
      let matchesRole = true
      if (selectedRole !== "ALL") {
        if (selectedRole === "JOUEUR") {
          matchesRole = r.type === "JOUEUR"
        } else if (selectedRole === "STAFF") {
          matchesRole = r.type === "STAFF"
        }
      }

      return matchesSearch && matchesCategory && matchesRole
    })
  }, [records, searchQuery, selectedCategory, selectedRole])

  // Export filtered records to CSV
  const handleExportCSV = () => {
    const headers = [
      "Nom",
      "Type",
      "Rôle/Titre",
      "Catégorie/Équipe",
      "Âge",
      "Nationalité",
      "Date de Naissance",
      "Groupe Sanguin",
      "Allergies",
      "Dernier Bilan",
      "Aptitude",
      "Traitement Médical",
      "Médicaments",
      "Observations"
    ]

    const csvRows = [headers.join(",")]

    filteredRecords.forEach((r) => {
      const notesEscaped = r.medicalNotes.join(" | ").replace(/"/g, '""')
      const row = [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.type === "JOUEUR" ? "Joueur" : "Staff"}"`,
        `"${r.roleLabel.replace(/"/g, '""')}"`,
        `"${(r.teamCategoryName || "Sans Équipe").replace(/"/g, '""')}"`,
        `"${r.age !== null ? r.age : "N/A"}"`,
        `"${(r.nationality || "N/A").replace(/"/g, '""')}"`,
        `"${(r.birthDate || "N/A").replace(/"/g, '""')}"`,
        `"${(r.bloodGroup || "N/A").replace(/"/g, '""')}"`,
        `"${(r.allergies || "Aucune").replace(/"/g, '""')}"`,
        `"${(r.lastCheckup || "N/A").replace(/"/g, '""')}"`,
        `"${(r.clearance || "Autorisé").replace(/"/g, '""')}"`,
        `"${(r.medicalTreatment || "Aucun").replace(/"/g, '""')}"`,
        `"${(r.medication || "Aucun").replace(/"/g, '""')}"`,
        `"${notesEscaped}"`
      ]
      csvRows.push(row.join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `dossiers_medicaux_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print List function
  const handlePrintList = () => {
    const style = document.createElement("style")
    style.id = "dynamic-print-style"
    style.innerHTML = `@page { size: A4 landscape !important; margin: 10mm !important; }`
    document.head.appendChild(style)

    document.body.classList.add("printing-list")
    window.print()
    document.body.classList.remove("printing-list")

    style.remove()
  }

  // Print Single Dossier function
  const handleViewClick = (r: UnifiedMedicalRecord) => {
    setViewRecord(r)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Styles for clean PDF printing and layout concealment */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          .print-hide {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Individual dossier print override */
          body.printing-dossier #print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            visibility: visible !important;
            z-index: 9999 !important;
            background: white !important;
            color: black !important;
            border: 2px solid #e4e4e7 !important;
            border-radius: 1rem !important;
            padding: 2.5rem !important;
            box-shadow: none !important;
          }
          body.printing-dossier #print-area * {
            visibility: visible !important;
          }
          body.printing-dossier > div > div:first-child,
          body.printing-dossier section, 
          body.printing-dossier nav,
          body.printing-dossier header,
          body.printing-dossier aside,
          body.printing-dossier footer,
          body.printing-dossier .no-print-layout,
          body.printing-list > div > div:first-child,
          body.printing-list section, 
          body.printing-list nav,
          body.printing-list header,
          body.printing-list aside,
          body.printing-list footer,
          body.printing-list .no-print-layout {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {!viewRecord ? (
        <>
          {/* Header Banner */}
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print-hide">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Dossiers Médicaux Confidentiels
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Fiches d&apos;aptitude, antécédents, allergies et observations cliniques sécurisées du club.
          </p>
        </div>
        <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1">
          🔒 Accès Médical Sécurisé ({userRole})
        </span>
      </section>

      {/* Main Tabs Navigation */}
      {!isPlayer && canEdit && (
        <div className="flex gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800 print-hide">
          <button
            onClick={() => handleTabChange("list")}
            className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm ${
              activeTab === "list"
                ? "bg-gradient-to-b from-zinc-200 to-zinc-300 border-zinc-400 text-emerald-700 dark:from-zinc-700 dark:to-zinc-800 dark:border-zinc-600 dark:text-emerald-400 ring-2 ring-emerald-500/25"
                : "bg-gradient-to-b from-zinc-50 to-zinc-100 border-zinc-200 text-emerald-600 hover:from-zinc-100 hover:to-zinc-150 dark:from-zinc-800 dark:to-zinc-900 dark:border-zinc-700 dark:text-emerald-500 dark:hover:from-zinc-750 dark:hover:to-zinc-800"
            }`}
          >
            Liste des Dossiers
          </button>
          <button
            onClick={() => handleTabChange("manage")}
            className={`px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm ${
              activeTab === "manage"
                ? "bg-gradient-to-b from-zinc-200 to-zinc-300 border-zinc-400 text-emerald-700 dark:from-zinc-700 dark:to-zinc-800 dark:border-zinc-600 dark:text-emerald-400 ring-2 ring-emerald-500/25"
                : "bg-gradient-to-b from-zinc-50 to-zinc-100 border-zinc-200 text-emerald-600 hover:from-zinc-100 hover:to-zinc-150 dark:from-zinc-800 dark:to-zinc-900 dark:border-zinc-700 dark:text-emerald-500 dark:hover:from-zinc-750 dark:hover:to-zinc-800"
            }`}
          >
            Créer / Modifier
          </button>
        </div>
      )}

      {/* -------------------- TAB 1: LIST VIEW -------------------- */}
      {activeTab === "list" && (
        <div className="space-y-6">
          
          {/* Filters Area (Non-Players) */}
          {!isPlayer && (
            <div className="rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col lg:flex-row items-center justify-between gap-4 print-hide">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto flex-1">
                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-white outline-none focus:border-emerald-500 shadow-inner w-full"
                />

                {/* Team Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-850 dark:text-white outline-none focus:border-emerald-500 shadow-inner"
                >
                  <option value="ALL">Toutes les équipes</option>
                  <option value="NONE">Sans équipe</option>
                  {teamCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-850 dark:text-white outline-none focus:border-emerald-500 shadow-inner"
                >
                  <option value="ALL">Tous les rôles</option>
                  <option value="JOUEUR">Joueurs</option>
                  <option value="STAFF">Membres du Staff</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full lg:w-auto justify-end">
                <button
                  onClick={handlePrintList}
                  className="rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 font-black text-[10px] uppercase tracking-wider px-4 py-2.5 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  🖨️ Imprimer la Liste
                </button>
                <button
                  onClick={handleExportCSV}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  📥 Exporter (Excel/CSV)
                </button>
              </div>
            </div>
          )}

          {/* Records Table / List */}
          {filteredRecords.length === 0 ? (
            <div className="p-10 text-center font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              Aucun dossier médical ne correspond à vos critères de recherche.
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-zinc-200 dark:border-zinc-800">
                  <thead>
                    <tr className="bg-zinc-100/70 dark:bg-zinc-950/30 text-[9px] font-black uppercase text-zinc-450 tracking-wider">
                      <th className="py-4 px-5 border border-zinc-200 dark:border-zinc-800">Nom</th>
                      <th className="py-4 px-4 border border-zinc-200 dark:border-zinc-800">Rôle</th>
                      <th className="py-4 px-4 border border-zinc-200 dark:border-zinc-800">Équipe</th>
                      <th className="py-4 px-3 text-center border border-zinc-200 dark:border-zinc-800">Gr. Sanguin</th>
                      <th className="py-4 px-4 border border-zinc-200 dark:border-zinc-800">Allergies</th>
                      <th className="py-4 px-4 text-center border border-zinc-200 dark:border-zinc-800">Aptitude</th>
                      <th className="py-4 px-4 border border-zinc-200 dark:border-zinc-800">Dernier Bilan</th>
                      <th className="py-4 px-5 text-right print-hide border border-zinc-200 dark:border-zinc-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => {
                      const hasData = hasMedicalData(r)
                      return (
                        <tr
                          key={r.id}
                          className="even:bg-zinc-50/30 dark:even:bg-zinc-950/5 hover:bg-zinc-50/70 dark:hover:bg-zinc-950/15 text-xs font-semibold text-zinc-750 dark:text-zinc-300 transition-colors"
                        >
                          <td className="py-3.5 px-5 font-bold text-zinc-950 dark:text-white flex items-center gap-3 border border-zinc-200 dark:border-zinc-800">
                            {r.type === "JOUEUR" ? (
                              <JerseyIcon number={r.number} />
                            ) : (
                              <StaffIcon role={r.roleLabel} />
                            )}
                            <div>
                              <span className="block">{r.name}</span>
                              {r.type === "JOUEUR" && r.position && (
                                <span className="text-[9px] text-zinc-400 uppercase tracking-widest block">{r.position}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-200 dark:border-zinc-800">
                            {r.roleLabel}
                          </td>
                          <td className="py-3.5 px-4 font-bold border border-zinc-200 dark:border-zinc-800">
                            {r.teamCategoryName || "Sans Équipe"}
                          </td>
                          <td className="py-3.5 px-3 text-center border border-zinc-200 dark:border-zinc-800">
                            {r.bloodGroup ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-650 dark:text-red-400 font-extrabold text-[10px]">
                                {r.bloodGroup}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700">--</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 truncate max-w-[150px] border border-zinc-200 dark:border-zinc-800">
                            {r.allergies ? (
                              <span className="text-red-500 font-bold">{r.allergies}</span>
                            ) : hasData ? (
                              <span className="text-zinc-400 dark:text-zinc-600">Aucune</span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700 font-normal italic">Non configuré</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center border border-zinc-200 dark:border-zinc-800">
                            {hasData ? (
                              <span className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                                r.clearance === "Autorisé" || !r.clearance
                                  ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                                  : r.clearance === "Restreint"
                                  ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                                  : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                              }`}>
                                {r.clearance || "Autorisé"}
                              </span>
                            ) : (
                              <span className="text-zinc-300 dark:text-zinc-700">--</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500 text-[10px] font-bold uppercase border border-zinc-200 dark:border-zinc-800">
                            {r.lastCheckup || "--"}
                          </td>
                          <td className="py-3.5 px-5 text-right print-hide border border-zinc-200 dark:border-zinc-800">
                            <button
                              onClick={() => handleViewClick(r)}
                              className="rounded-xl bg-red-500 hover:bg-red-650 active:scale-95 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 transition-all cursor-pointer shadow-sm border border-red-600/10"
                            >
                              Voir
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* -------------------- TAB 2: MANAGE VIEW -------------------- */}
      {activeTab === "manage" && canEdit && (
        <div className="rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 p-6 sm:p-8 shadow-sm space-y-6 print-hide">
          
          {/* Sub-mode Selection Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-5">
            <button
              onClick={() => {
                setManageMode("CREATE")
                setSelectedMemberId("")
                resetFormFields()
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-center transition-all ${
                manageMode === "CREATE"
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-wider">Créer une Fiche Médicale</span>
            </button>
            <button
              onClick={() => {
                setManageMode("MODIFY")
                setSelectedMemberId("")
                resetFormFields()
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-center transition-all ${
                manageMode === "MODIFY"
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-wider">Modifier une Fiche Existante</span>
            </button>
          </div>

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 dark:text-red-400 text-center">
              {errorMsg}
            </div>
          )}

          {/* Core Creation / Edition Form */}
          <form onSubmit={handleManageSubmit} className="space-y-6">
            
            {/* Member Selector */}
            <div>
              <label className="block text-[10px] font-black text-zinc-450 uppercase mb-2 tracking-wider">
                {manageMode === "CREATE"
                  ? "Sélectionner un membre sans dossier médical"
                  : "Sélectionner le dossier médical à modifier"}
              </label>
              
              <select
                value={selectedMemberId}
                onChange={(e) => handleSelectMember(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-xs font-extrabold text-zinc-850 dark:text-white shadow-inner outline-none focus:border-emerald-500"
              >
                <option value="">-- Choisir un joueur ou membre du staff --</option>
                {manageMode === "CREATE"
                  ? unconfiguredMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roleLabel} • {m.teamCategoryName || "Sans Équipe"})
                      </option>
                    ))
                  : configuredMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.roleLabel} • {m.teamCategoryName || "Sans Équipe"})
                      </option>
                    ))}
              </select>

              {manageMode === "CREATE" && unconfiguredMembers.length === 0 && (
                <p className="text-[10px] text-zinc-400 font-semibold mt-2">
                  * Tous les membres enregistrés possèdent déjà un dossier médical.
                </p>
              )}
            </div>

            {selectedMemberId && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Civil / Personal info fields */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <h4 className="text-[10px] text-zinc-400 dark:text-zinc-550 font-black uppercase tracking-widest mb-4">
                    Informations Générales
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Âge
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 24"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Nationalités
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Algérienne, Française"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Date de Naissance
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 15 mai 2002"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical parameters fields */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <h4 className="text-[10px] text-zinc-400 dark:text-zinc-550 font-black uppercase tracking-widest mb-4">
                    Paramètres Médicaux
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Blood Group */}
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Groupe Sanguin
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
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

                    {/* Allergies */}
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Allergies connues
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Pénicilline, Arachides ou 'Aucune'"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    {/* Last Checkup */}
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Date du dernier bilan médical
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 14 Juin 2026"
                        value={lastCheckup}
                        onChange={(e) => setLastCheckup(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    {/* Aptitude / Clearance */}
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Aptitude d&apos;activité
                      </label>
                      <select
                        value={clearance}
                        onChange={(e) => setClearance(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-bold"
                      >
                        <option value="Autorisé">Autorisé (Aptitude complète)</option>
                        <option value="Restreint">Restreint (Entraînement adapté)</option>
                        <option value="Interdit">Interdit (Repos médical total)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Treatment and Medication fields */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <h4 className="text-[10px] text-zinc-400 dark:text-zinc-550 font-black uppercase tracking-widest mb-4">
                    Suivi Clinique & Pharmacologique
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Traitement Médical Signalé
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Kinésithérapie post-entorse, Rééducation"
                        value={medicalTreatment}
                        onChange={(e) => setMedicalTreatment(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                        Médicaments Signalés
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Ventoline en cas de crise, Antalgiques"
                        value={medication}
                        onChange={(e) => setMedication(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Observation / Clinical Notes */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-5">
                  <label className="block text-[9px] font-black text-zinc-450 uppercase mb-1 tracking-wider">
                    {manageMode === "CREATE"
                      ? "Observation clinique initiale (Optionnel)"
                      : "Ajouter une observation clinique supplémentaire (Optionnel)"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: Validation de la condition cardiovasculaire, kinésithérapie requise..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white shadow-inner outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider px-6 py-3.5 shadow-md shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isPending ? "Traitement..." : manageMode === "CREATE" ? "Créer le dossier" : "Enregistrer les modifications"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
        </>
      ) : (
        /* -------------------- DEDICATED RECORD VIEW PAGE -------------------- */
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Action Navigation Header */}
          <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-4 rounded-2xl shadow-sm print-hide">
            {!isPlayer ? (
              <button
                onClick={() => setViewRecord(null)}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer shadow-md shadow-red-600/10"
              >
                Retour
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={() => {
                const style = document.createElement("style")
                style.id = "dynamic-print-style"
                style.innerHTML = `@page { size: A4 portrait !important; margin: 15mm !important; }`
                document.head.appendChild(style)

                document.body.classList.add("printing-dossier")
                window.print()
                document.body.classList.remove("printing-dossier")

                style.remove()
              }}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-450 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
            >
              Imprimer
            </button>
          </div>

          {/* Dossier Card Container */}
          <div
            id="print-area"
            className="w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 sm:p-10 shadow-sm space-y-6"
          >
            {/* Header: EVO SPORTS Brand Logo & Title */}
            <div className="flex items-center gap-3 pb-6 border-b border-zinc-150 dark:border-zinc-800">
              <img
                src="/logo.png"
                alt="EVO SPORTS"
                className="h-12 w-auto object-contain shrink-0"
              />
              <div className="min-w-0 border-l border-zinc-200 dark:border-zinc-850 pl-3">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-black">
                  PLATEFORME D&apos;OPTIMISATION & SUIVI MÉDICAL
                </p>
              </div>
            </div>

            {/* Sub-Header: Team/Club Logo, Name, and Creation Date */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-950/35 border border-zinc-150 dark:border-zinc-850">
              <div className="flex items-center gap-3">
                {clubInfo.logo ? (
                  <img
                    src={clubInfo.logo}
                    alt="Logo Club"
                    className="w-12 h-12 rounded-xl object-contain border border-zinc-200 dark:border-zinc-800 bg-white"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-black uppercase shadow-sm">
                    {clubInfo.name.substring(0, 2)}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs text-zinc-400 font-black uppercase tracking-wider">Club / Équipe</p>
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">{clubInfo.name}</h4>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[9px] text-zinc-400 font-black uppercase tracking-wider">Fondé le</p>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{clubInfo.creationDate}</p>
              </div>
            </div>

            {/* Section: Dossier Title */}
            <div className="text-center py-2">
              <h3 className="text-xl font-black text-zinc-950 dark:text-white uppercase tracking-wide">
                DOSSIER MÉDICAL DE : <span className="text-emerald-600 dark:text-emerald-400">{viewRecord.name}</span>
              </h3>
            </div>

            {/* Clinical Demographics Sheet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900/50">
              <div>
                <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Rôle / Fonction</span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 uppercase">{viewRecord.roleLabel}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Âge</span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{viewRecord.age !== null ? `${viewRecord.age} ans` : "Non spécifié"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Nationalités</span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200 truncate block">{viewRecord.nationality || "Non spécifiée"}</span>
              </div>
              <div>
                <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Date de naissance</span>
                <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{viewRecord.birthDate || "Non spécifiée"}</span>
              </div>
            </div>

            {/* Medical Metrics Details List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800/80 pb-2">
                <h5 className="text-[10px] text-zinc-455 dark:text-zinc-550 font-black uppercase tracking-widest">
                  Fiche Médicale Détaillée
                </h5>
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border ${
                  viewRecord.clearance === "Autorisé" || !viewRecord.clearance
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400"
                    : viewRecord.clearance === "Restreint"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                    : "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-400"
                }`}>
                  Aptitude : {viewRecord.clearance || "Autorisé"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Équipe</span>
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 block">
                    {viewRecord.teamCategoryName || "Sans Équipe"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Date du dernier Bilan</span>
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 block">
                    {viewRecord.lastCheckup || "Aucun bilan récent"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Groupe Sanguin</span>
                  <span className="text-xs font-black text-red-500 mt-1 block">
                    {viewRecord.bloodGroup || "Non déterminé"}
                  </span>
                </div>
              </div>

              {/* Reported Clinicial Indices */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Traitement Médical Signalé</span>
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 block">
                    {viewRecord.medicalTreatment || "Aucun traitement en cours"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Médicament Signalé</span>
                  <span className="text-xs font-extrabold text-zinc-850 dark:text-zinc-200 mt-1 block">
                    {viewRecord.medication || "Aucun médicament pris"}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850">
                  <span className="block text-[9px] text-zinc-400 font-black uppercase tracking-wider">Allergies Signalées</span>
                  <span className={`text-xs font-black mt-1 block ${viewRecord.allergies ? "text-red-500" : "text-zinc-500"}`}>
                    {viewRecord.allergies || "Aucune allergie connue"}
                  </span>
                </div>
              </div>
            </div>

            {/* Observations History */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] text-zinc-455 dark:text-zinc-550 font-black uppercase tracking-widest">
                Observations de Médecine
              </p>
              
              {viewRecord.medicalNotes.length === 0 ? (
                <div className="text-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/10 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-455 text-xs font-semibold">
                  Aucune note clinique enregistrée à ce jour.
                </div>
              ) : (
                <div className="space-y-2">
                  {viewRecord.medicalNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-50 dark:bg-zinc-950/30 rounded-xl px-4 py-3 border border-zinc-150 dark:border-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-relaxed relative pl-6"
                    >
                      <span className="absolute left-2.5 top-4 h-2 w-2 rounded-full bg-emerald-500 border border-white dark:border-zinc-900 shadow-sm" />
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer: Generation Date & Time */}
            <div className="text-center pt-6 border-t border-zinc-150 dark:border-zinc-800 mt-6">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black">
                Fiche générée le {new Date().toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                }).replace(":", "h")}
              </p>
              <p className="text-[8px] text-zinc-400 dark:text-zinc-550 uppercase tracking-widest font-bold mt-1">
                Document médical confidentiel - EVO SPORTS
              </p>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}
