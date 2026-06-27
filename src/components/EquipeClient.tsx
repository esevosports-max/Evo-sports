"use client"

import { useState, useTransition } from "react"
import { updateClubSettings, createTeamCategory, deleteTeamCategory } from "@/app/dashboard/equipe/actions"
import ExcelJS from "exceljs"


interface ClubInfo {
  name: string
  logo: string | null
  creationDate: string // formatted or ISO date
  address: string
  stadiumName: string
  stadiumCapacity: string
  phone: string
}

interface Category {
  id?: string
  name: string
  coach: string
  league: string
  maxPlayers: number
  color: string
  playerCount?: number
}

interface StaffRoleGroup {
  roleName: string
  count: number
  names: string[]
}

interface EquipeClientProps {
  club: ClubInfo
  categories: Category[]
  staffRoles: StaffRoleGroup[]
  totalStaffCount: number
  canEdit: boolean
  subscriptionPlan?: string
}

export default function EquipeClient({
  club,
  categories,
  staffRoles,
  totalStaffCount,
  canEdit,
  subscriptionPlan = "Club"
}: EquipeClientProps) {
  const isOneTeamPlan = subscriptionPlan === "1 Équipe" || subscriptionPlan === "1 equipe" || subscriptionPlan === "Standard"
  const reachedTeamLimit = isOneTeamPlan && categories.length >= 1
  const [clubInfo, setClubInfo] = useState<ClubInfo>({
    name: club.name || "EVO FC",
    logo: club.logo,
    creationDate: club.creationDate || "2018-01-01",
    address: club.address || "Paris, France",
    stadiumName: club.stadiumName || "Stade Municipal de l'Émerauderie",
    stadiumCapacity: club.stadiumCapacity || "5 000 places",
    phone: club.phone || "+33 6 12 34 56 78"
  })

  const [activeTab, setActiveTab] = useState<"info" | "categories" | "config">("info")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  // Local state for settings form
  const [formData, setFormData] = useState<ClubInfo>({ ...clubInfo })

  // Local state for category management
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCatBaseName, setNewCatBaseName] = useState("")
  const [newCatDesignation, setNewCatDesignation] = useState("")
  const [newCatLeague, setNewCatLeague] = useState("")
  const [newCatMaxPlayers, setNewCatMaxPlayers] = useState(15)
  const [isPending, startTransition] = useTransition()
  const [catSuccessMsg, setCatSuccessMsg] = useState("")
  const [catErrorMsg, setCatErrorMsg] = useState("")

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    setCatSuccessMsg("")
    setCatErrorMsg("")

    if (!newCatBaseName) {
      setCatErrorMsg("Veuillez remplir tous les champs obligatoires.")
      return
    }

    const fullName = `${newCatBaseName} ${newCatDesignation}`.trim()

    startTransition(async () => {
      const res = await createTeamCategory({
        name: fullName,
        league: newCatLeague || "Division Libre",
        coach: "À attribuer",
        maxPlayers: Math.min(Number(newCatMaxPlayers) || 0, 30)
      })

      if (res.success) {
        setCatSuccessMsg(`L'équipe "${fullName}" a été créée avec succès !`)
        setNewCatBaseName("")
        setNewCatDesignation("")
        setNewCatLeague("")
        setNewCatMaxPlayers(15)
        setIsCreateModalOpen(false)
        setTimeout(() => setCatSuccessMsg(""), 5000)
      } else {
        setCatErrorMsg(res.error || "Une erreur est survenue lors de la création.")
      }
    })
  }

  const handleDeleteCategory = (id: string) => {
    if (!id || id.startsWith("mock-")) {
      setCatErrorMsg("Impossible de supprimer une catégorie de démonstration non sauvegardée en base.")
      return
    }

    if (!confirm("Voulez-vous vraiment supprimer cette catégorie/équipe ?")) {
      return
    }

    setCatSuccessMsg("")
    setCatErrorMsg("")

    startTransition(async () => {
      const res = await deleteTeamCategory(id)
      if (res.success) {
        setCatSuccessMsg("Catégorie supprimée avec succès !")
      } else {
        setCatErrorMsg(res.error || "Une erreur est survenue lors de la suppression.")
      }
    })
  }


  // Handle updates to club configuration
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) {
      setErrorMsg("Seul le Président du club peut modifier ces paramètres.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    const result = await updateClubSettings({
      name: formData.name,
      stadiumName: formData.stadiumName,
      stadiumCapacity: formData.stadiumCapacity,
      address: formData.address,
      phone: formData.phone,
      logo: formData.logo
    })

    setLoading(false)

    if (result.success) {
      setClubInfo({ ...formData })
      setSuccessMsg("Informations du club enregistrées avec succès dans la base de données !")
      setTimeout(() => setSuccessMsg(""), 5000)
    } else {
      setErrorMsg(result.error || "Une erreur est survenue lors de l'enregistrement.")
    }
  }

  // Handle file logo upload in base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setErrorMsg("Le logo est trop volumineux. Taille maximale : 2 Mo.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const resultStr = reader.result as string
        setFormData((prev) => ({ ...prev, logo: resultStr }))
      }
    }
    reader.readAsDataURL(file)
  }

  // Format creation date for display (e.g. DD/MM/YYYY)
  const formatCreationDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    } catch {
      return dateString
    }
  }

  // Today's Date formatted beautifully for the fiche header
  const sheetGenerationDate = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  // Print function
  const handlePrint = () => {
    window.open("/print-fiche", "_blank")
  }

  // Helper to fetch image and convert to base64
  const getBase64Image = async (url: string): Promise<{ base64: string, extension: string } | null> => {
    try {
      if (url.startsWith("data:image/")) {
        const parts = url.split(",")
        const mime = url.match(/data:(image\/\w+);base64/)
        const ext = mime ? mime[1].split("/")[1] : "png"
        return { base64: parts[1], extension: ext }
      }
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = blob.type.split("/")[1] || "png"
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(",")[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      return { base64, extension: ext }
    } catch (e) {
      console.error("Failed to load image for excel:", url, e)
      return null
    }
  }

  // Export to Excel function
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Fiche Club")

    // Set Column Widths
    worksheet.columns = [
      { key: "A", width: 25 },
      { key: "B", width: 35 },
      { key: "C", width: 25 },
      { key: "D", width: 25 },
    ]

    // Set row heights for logo headers
    worksheet.getRow(1).height = 30
    worksheet.getRow(2).height = 15

    // Add logos
    const evoLogo = await getBase64Image("/logo.png")
    if (evoLogo) {
      try {
        const imageId = workbook.addImage({
          base64: evoLogo.base64,
          extension: evoLogo.extension as any,
        })
        worksheet.addImage(imageId, {
          tl: { col: 0.1, row: 0.1 },
          ext: { width: 90, height: 40 }
        })
      } catch (e) {
        console.error("Error drawing EVO logo in Excel:", e)
      }
    }

    if (clubInfo.logo) {
      const clubLogo = await getBase64Image(clubInfo.logo)
      if (clubLogo) {
        try {
          const imageId = workbook.addImage({
            base64: clubLogo.base64,
            extension: clubLogo.extension as any,
          })
          worksheet.addImage(imageId, {
            tl: { col: 3.1, row: 0.1 },
            ext: { width: 90, height: 40 }
          })
        } catch (e) {
          console.error("Error drawing Club logo in Excel:", e)
        }
      }
    }

    // Helper to style a range of cells
    const formatRange = (
      startRow: number,
      startCol: number,
      endRow: number,
      endCol: number,
      style: {
        font?: any
        fill?: any
        alignment?: any
        border?: any
      }
    ) => {
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          const cell = worksheet.getCell(r, c)
          if (style.font) cell.font = style.font
          if (style.fill) cell.fill = style.fill
          if (style.alignment) cell.alignment = style.alignment
          if (style.border) cell.border = style.border
        }
      }
    }

    // Border Styles
    const thinBorder = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } }
    }

    // Row 3: Sheet Title (merged A3:D3)
    worksheet.mergeCells("A3:D3")
    worksheet.getCell("A3").value = "FICHE DE CLUB — EVO SPORTS"
    worksheet.getRow(3).height = 30
    formatRange(3, 1, 3, 4, {
      font: { name: "Segoe UI", size: 14, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF10B981" } }, // Emerald 500
      alignment: { horizontal: "center", vertical: "middle" }
    })

    // Row 5: Section Header for General Info
    worksheet.mergeCells("A5:D5")
    worksheet.getCell("A5").value = "INFORMATIONS GÉNÉRALES DU CLUB"
    worksheet.getRow(5).height = 24
    formatRange(5, 1, 5, 4, {
      font: { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } }, // Zinc-800
      alignment: { horizontal: "left", vertical: "middle" }
    })

    // General Info Table Rows
    const generalInfos = [
      ["Nom du Club", clubInfo.name],
      ["Date de Création", formatCreationDate(clubInfo.creationDate)],
      ["Terrain d'honneur", clubInfo.stadiumName],
      ["Capacité du terrain", clubInfo.stadiumCapacity],
      ["Adresse", clubInfo.address],
      ["Numéro de Téléphone", clubInfo.phone]
    ]

    let currentRow = 6
    generalInfos.forEach(([label, value]) => {
      worksheet.getCell(`A${currentRow}`).value = label
      worksheet.getCell(`B${currentRow}`).value = value
      worksheet.mergeCells(`B${currentRow}:D${currentRow}`)
      worksheet.getRow(currentRow).height = 20

      // Format label cell
      formatRange(currentRow, 1, currentRow, 1, {
        font: { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF374151" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } },
        border: thinBorder,
        alignment: { vertical: "middle" }
      })

      // Format value cells
      formatRange(currentRow, 2, currentRow, 4, {
        font: { name: "Segoe UI", size: 10, color: { argb: "FF1F2937" } },
        alignment: { horizontal: "left", vertical: "middle" },
        border: thinBorder
      })

      currentRow++
    })

    currentRow++ // blank row

    // Teams Section Header
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = "ÉQUIPES & CATÉGORIES"
    worksheet.getRow(currentRow).height = 24
    formatRange(currentRow, 1, currentRow, 4, {
      font: { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } },
      alignment: { horizontal: "left", vertical: "middle" }
    })
    
    currentRow++

    // Teams Column Headers
    worksheet.getCell(`A${currentRow}`).value = "Équipe / Catégorie"
    worksheet.getCell(`B${currentRow}`).value = "Championnat / Division"
    worksheet.getCell(`C${currentRow}`).value = "Entraîneur Référent"
    worksheet.getCell(`D${currentRow}`).value = "Effectif"
    worksheet.getRow(currentRow).height = 22
    formatRange(currentRow, 1, currentRow, 4, {
      font: { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF065F46" } }, // Emerald 800
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1E7DD" } }, // Emerald 100
      border: {
        top: { style: "medium", color: { argb: "FF10B981" } },
        bottom: { style: "medium", color: { argb: "FF10B981" } }
      },
      alignment: { vertical: "middle" }
    })
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }

    currentRow++

    // Teams Data Rows
    categories.forEach((cat, index) => {
      worksheet.getCell(`A${currentRow}`).value = cat.name
      worksheet.getCell(`B${currentRow}`).value = cat.league
      worksheet.getCell(`C${currentRow}`).value = cat.coach
      worksheet.getCell(`D${currentRow}`).value = cat.playerCount ?? 0
      worksheet.getRow(currentRow).height = 20

      const isEven = index % 2 === 0
      formatRange(currentRow, 1, currentRow, 4, {
        font: { name: "Segoe UI", size: 10, color: { argb: "FF374151" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9FAFB" : "FFFFFFFF" } },
        border: thinBorder,
        alignment: { vertical: "middle" }
      })

      // Highlight player count
      worksheet.getCell(`D${currentRow}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF059669" } }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }

      currentRow++
    })

    currentRow++ // blank row

    // Staff Section Header
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`)
    worksheet.getCell(`A${currentRow}`).value = "STAFF TECHNIQUE & ADMINISTRATIF"
    worksheet.getRow(currentRow).height = 24
    formatRange(currentRow, 1, currentRow, 4, {
      font: { name: "Segoe UI", size: 11, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } },
      alignment: { horizontal: "left", vertical: "middle" }
    })

    currentRow++

    // Staff Column Headers
    worksheet.getCell(`A${currentRow}`).value = "Fonction / Rôle"
    worksheet.getCell(`B${currentRow}`).value = "Membres Assignés"
    worksheet.mergeCells(`B${currentRow}:C${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = "Effectif (Nombre)"
    worksheet.getRow(currentRow).height = 22
    formatRange(currentRow, 1, currentRow, 4, {
      font: { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF374151" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }, // light gray header
      border: {
        top: { style: "medium", color: { argb: "FF9CA3AF" } },
        bottom: { style: "medium", color: { argb: "FF9CA3AF" } }
      },
      alignment: { vertical: "middle" }
    })
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }

    currentRow++

    // Staff Data Rows
    staffRoles.forEach((role, index) => {
      worksheet.getCell(`A${currentRow}`).value = role.roleName
      worksheet.getCell(`B${currentRow}`).value = role.names.join(", ")
      worksheet.mergeCells(`B${currentRow}:C${currentRow}`)
      worksheet.getCell(`D${currentRow}`).value = role.count
      worksheet.getRow(currentRow).height = 20

      const isEven = index % 2 === 0
      formatRange(currentRow, 1, currentRow, 4, {
        font: { name: "Segoe UI", size: 10, color: { argb: "FF374151" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFF9FAFB" : "FFFFFFFF" } },
        border: thinBorder,
        alignment: { vertical: "middle" }
      })
      worksheet.getCell(`D${currentRow}`).font = { name: "Segoe UI", size: 10, bold: true }
      worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }

      currentRow++
    })

    // Staff Total Footer
    worksheet.getCell(`A${currentRow}`).value = "Total Effectif du Staff"
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`)
    worksheet.getCell(`D${currentRow}`).value = `${totalStaffCount} membres`
    worksheet.getRow(currentRow).height = 22
    formatRange(currentRow, 1, currentRow, 4, {
      font: { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } },
      alignment: { vertical: "middle" },
      border: {
        top: { style: "medium", color: { argb: "FF1F2937" } },
        bottom: { style: "medium", color: { argb: "FF1F2937" } }
      }
    })
    worksheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" }
    worksheet.getCell(`D${currentRow}`).font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FF34D399" } }
    worksheet.getCell(`D${currentRow}`).alignment = { horizontal: "center", vertical: "middle" }

    // Write workbook and download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const downloadUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = downloadUrl
    anchor.download = `Fiche_de_Club_${clubInfo.name.replace(/\s+/g, "_")}.xlsx`
    anchor.click()
    window.URL.revokeObjectURL(downloadUrl)
  }


  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner - Hidden when printing */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Mon Club & Équipes
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Structure organisationnelle du club, gestion des catégories et informations des installations.
          </p>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex flex-wrap gap-2 bg-zinc-100 p-1.5 rounded-xl dark:bg-zinc-800 shrink-0">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "info" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Fiche Club
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "categories" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Catégories
          </button>
          {canEdit && (
            <button
              onClick={() => setActiveTab("config")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "config" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Paramètres Club
            </button>
          )}
        </div>
      </section>

      {/* -------------------- TAB 1: FICHE CLUB (REORGANIZED LAYOUT) -------------------- */}
      {activeTab === "info" && (
        <div className="space-y-6">
          
          {/* Action Row - Print & Excel buttons (hidden when printing) */}
          <div className="flex justify-end gap-3 print:hidden">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-700 hover:via-emerald-600 hover:to-emerald-800 text-white font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md border border-emerald-700/55 transition-all active:scale-95 cursor-pointer"
            >
              <span>📊</span> Exporter en Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-300 hover:from-zinc-300 hover:via-zinc-200 hover:to-zinc-400 text-emerald-800 font-black uppercase text-[10px] tracking-wider px-4 py-2.5 shadow-md border border-zinc-300/80 transition-all active:scale-95 cursor-pointer"
            >
              <span>🖨️</span> Imprimer la Fiche
            </button>
          </div>

          {/* Fiche de Club Wrapper - Styled as an official dossier sheet */}
          <div className="rounded-3xl border-2 border-zinc-250 bg-white p-8 sm:p-12 shadow-2xl relative overflow-hidden text-zinc-900 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
            
            {/* Watermark/Accent lines */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 print:hidden" />
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/5 rounded-tl-full pointer-events-none print:hidden" />
            
            {/* Section 1: Header Row */}
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-6 mb-8">
              {/* Top Left: EVO Sports Logo */}
              <div className="flex items-center gap-3">
                <img 
                  src="/logo.png" 
                  alt="EVO SPORTS Logo" 
                  className="h-10 sm:h-12 w-auto object-contain" 
                />
              </div>

              {/* Top Right: Fiche Creation Date */}
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date d&apos;édition</p>
                <p className="text-xs font-black text-zinc-800 mt-0.5">{sheetGenerationDate}</p>
              </div>
            </div>

            {/* Section 2: Bold Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-widest text-zinc-950 border-y-2 border-zinc-900 py-3 inline-block px-10">
                Fiche de Club
              </h1>
            </div>

            {/* Section 3: Club Info in Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b-2 border-zinc-200 pb-8 mb-8">
              
              {/* Left Column: Logo, Club Name, Creation Date */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-r-0 md:border-r border-zinc-150 pr-0 md:pr-8">
                {clubInfo.logo ? (
                  <img 
                    src={clubInfo.logo} 
                    alt="Logo Club" 
                    className="h-28 w-28 object-cover rounded-2xl border-2 border-zinc-200 shadow-md shrink-0 bg-white" 
                  />
                ) : (
                  <span className="h-28 w-28 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 flex items-center justify-center font-black text-white text-4xl shadow-md shrink-0">
                    {clubInfo.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
                
                <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
                  <div>
                    <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">Club</span>
                    <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-wide mt-1.5 break-words">{clubInfo.name}</h2>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Date de création</p>
                    <p className="text-sm font-bold text-zinc-800 mt-0.5">
                      📅 {formatCreationDate(clubInfo.creationDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Ground, Capacity, Address, Phone */}
              <div className="space-y-4 flex flex-col justify-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 border-b border-zinc-100 pb-1.5 select-none">
                  Installations & Contacts
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Terrain d&apos;honneur</p>
                    <p className="text-zinc-800 font-extrabold mt-0.5">🏟️ {clubInfo.stadiumName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Capacité du terrain</p>
                    <p className="text-zinc-800 font-extrabold mt-0.5">👥 {clubInfo.stadiumCapacity}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Adresse</p>
                    <p className="text-zinc-800 font-extrabold mt-0.5">📍 {clubInfo.address}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Numéro de téléphone</p>
                    <p className="text-zinc-800 font-extrabold mt-0.5">📞 {clubInfo.phone}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Section 4: Tables Section (Teams & Staff) */}
            <div className="space-y-8">
              
              {/* Table 1: Teams (Équipes) with Squad Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">
                    Équipes & Catégories
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-250">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-250 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                        <th className="py-3 px-4">Équipe / Catégorie</th>
                        <th className="py-3 px-4">Championnat / Division</th>
                        <th className="py-3 px-4">Entraîneur Référent</th>
                        <th className="py-3 px-4 text-center">Effectif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {categories.map((cat) => (
                        <tr key={cat.name} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-zinc-950 uppercase">{cat.name}</td>
                          <td className="py-3.5 px-4 font-semibold text-zinc-500">{cat.league}</td>
                          <td className="py-3.5 px-4 font-bold text-zinc-700">{cat.coach}</td>
                          <td className="py-3.5 px-4 text-center font-black text-emerald-600 bg-emerald-500/5 text-sm">
                            {cat.playerCount ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Staff Roles & Counts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-zinc-950">
                    Staff Technique & Administratif
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-250">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-250 text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                        <th className="py-3 px-4">Fonction / Rôle</th>
                        <th className="py-3 px-4">Membres Assignés</th>
                        <th className="py-3 px-4 text-center">Effectif (Nombre)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {staffRoles.map((role) => (
                        <tr key={role.roleName} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-extrabold text-zinc-950 uppercase">{role.roleName}</td>
                          <td className="py-3.5 px-4 font-bold text-zinc-750">
                            {role.names.length > 0 ? role.names.join(", ") : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-black text-zinc-800 text-sm">
                            {role.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-zinc-950 text-white font-black text-xs">
                        <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-right">
                          Total Effectif du Staff :
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-400 text-sm font-black border-l border-zinc-800">
                          {totalStaffCount} membres
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>

            {/* Official Footer signature space */}
            <div className="mt-12 pt-8 border-t border-zinc-200 flex justify-between items-center text-[10px] font-bold text-zinc-400">
              <p>EVO SPORTS CLUB SYSTEM — DOCUMENT CERTIFIÉ CONFORME</p>
              <div className="text-right">
                <p className="uppercase text-[8px] tracking-widest font-black text-zinc-500 mb-1">Signature du Secrétariat / Cachet du Club</p>
                <div className="h-14 w-40 border border-dashed border-zinc-300 bg-zinc-50/50 rounded-lg flex items-center justify-center italic text-zinc-350">
                  Cachet officiel
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- TAB 2: CATEGORIES LIST & CREATION -------------------- */}
      {activeTab === "categories" && (
        <div className="space-y-8 max-w-4xl mx-auto print:hidden">
          
          {/* Create Category Form (only for authorized users) */}
          {canEdit && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-900 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                  Gestion des Équipes
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Configurez et gérez les catégories sportives de votre club.
                </p>
              </div>
              {reachedTeamLimit ? (
                <div className="text-[10px] text-amber-600 bg-amber-500/10 dark:bg-amber-955/20 border border-amber-500/20 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider">
                  ⚠️ Forfait '1 Équipe' limité à une seule équipe.
                </div>
              ) : (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-xl border border-zinc-350 bg-zinc-200 hover:bg-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  Créer une équipe ➕
                </button>
              )}
            </div>
          )}

          {catSuccessMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-xs font-bold text-emerald-600 text-center animate-bounce">
              {catSuccessMsg}
            </div>
          )}

          {catErrorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-2.5 text-xs font-bold text-red-600 text-center animate-pulse">
              {catErrorMsg}
            </div>
          )}

          {/* Modal Popup for Creating Team */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 space-y-6 animate-in zoom-in-95 duration-205">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 text-lg font-black cursor-pointer"
                >
                  ✕
                </button>
                <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                    Créer une Nouvelle Équipe
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Ajoutez une nouvelle catégorie pour votre effectif.
                  </p>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Nom de la Catégorie</label>
                    <input
                      type="text"
                      required
                      value={newCatBaseName}
                      onChange={(e) => setNewCatBaseName(e.target.value)}
                      placeholder="ex: Séniors, U19, U17"
                      className="w-full rounded-xl border border-zinc-205 bg-white px-3 py-2 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Nombre (Désignation de l'équipe)</label>
                    <input
                      type="text"
                      value={newCatDesignation}
                      onChange={(e) => setNewCatDesignation(e.target.value)}
                      placeholder="ex: A, B, 1, 2"
                      className="w-full rounded-xl border border-zinc-205 bg-white px-3 py-2 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                    <p className="text-[8px] text-zinc-400 font-medium mt-1">
                      Indiquez la lettre ou le numéro (ex: "A" pour créer "Séniors A").
                    </p>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Championnat / Division</label>
                    <input
                      type="text"
                      required
                      value={newCatLeague}
                      onChange={(e) => setNewCatLeague(e.target.value)}
                      placeholder="ex: Régional 1, Division Libre"
                      className="w-full rounded-xl border border-zinc-205 bg-white px-3 py-2 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-zinc-500 uppercase mb-1">
                      Effectif Max (Limité à 30)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={newCatMaxPlayers}
                      onChange={(e) => setNewCatMaxPlayers(Math.min(Number(e.target.value) || 0, 30))}
                      className="w-full rounded-xl border border-zinc-205 bg-white px-3 py-2 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                    />
                    <p className="text-[8px] text-zinc-400 font-medium mt-1">
                      ⚠️ Limité à 30 joueurs maximum selon les conditions de votre forfait.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black uppercase text-xs tracking-wider py-3 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider py-3 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? "Création..." : "Créer ➕"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Categories List in a Beautiful Table */}
          <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-white">
                Liste des Équipes & Catégories
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Tableau récapitulatif des équipes engagées.</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                    <th className="py-3 px-4">Nom de la Catégorie / Équipe</th>
                    <th className="py-3 px-4">Championnat / Division</th>
                    <th className="py-3 px-4">Entraîneur Référent</th>
                    <th className="py-3 px-4 text-center">Effectif</th>
                    {canEdit && <th className="py-3 px-4 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="py-8 text-center font-bold text-zinc-400">
                        Aucune catégorie enregistrée.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-white uppercase">{cat.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-zinc-500 dark:text-zinc-400">{cat.league}</td>
                        <td className="py-3.5 px-4 font-bold text-zinc-700 dark:text-zinc-300">{cat.coach}</td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 text-sm">
                          {cat.playerCount ?? 0} / {cat.maxPlayers} max
                        </td>
                        {canEdit && (
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleDeleteCategory(cat.id || "")}
                              className="text-red-500 hover:text-red-750 hover:bg-red-55 dark:hover:bg-red-950/30 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Supprimer 🗑️
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}

      {/* -------------------- TAB 3: CONFIGURATION FORM -------------------- */}
      {activeTab === "config" && canEdit && (
        <div className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 max-w-2xl mx-auto space-y-6 print:hidden">
          
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white">
              Modifier les Informations de l&apos;Association (Base de Données)
            </h3>
            <p className="text-[10px] text-zinc-450 font-semibold mt-0.5">Ces modifications seront sauvegardées de manière persistante.</p>
          </div>

          {successMsg && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-bold text-emerald-650 text-center animate-bounce">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-bold text-red-600 text-center animate-pulse">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleUpdateConfig} className="space-y-5">
            
            {/* Club Logo Upload Section */}
            <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              {formData.logo ? (
                <img 
                  src={formData.logo} 
                  alt="Club Logo Preview" 
                  className="h-16 w-16 object-cover rounded-xl border border-zinc-200 shadow-inner bg-white shrink-0" 
                />
              ) : (
                <span className="h-16 w-16 rounded-xl bg-zinc-150 flex items-center justify-center font-black text-zinc-400 text-xs shrink-0 select-none">
                  Pas de logo
                </span>
              )}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-zinc-500 uppercase">Changer le logo du Club (Max 2 Mo)</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-150 shrink-0">
                    Choisir un fichier
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload} 
                    />
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logo: null }))}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all duration-150 shrink-0"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1">Nom Officiel du Club</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1">Stade Principal / Terrain</label>
                <input
                  type="text"
                  required
                  value={formData.stadiumName}
                  onChange={(e) => setFormData({ ...formData, stadiumName: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1">Capacité du stade</label>
                <input
                  type="text"
                  required
                  value={formData.stadiumCapacity}
                  onChange={(e) => setFormData({ ...formData, stadiumCapacity: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1">Adresse Complète</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1">Numéro de Téléphone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-900 shadow-inner outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 uppercase mb-1 select-none">Date de Création (Lecture Seule)</label>
                <input
                  type="text"
                  disabled
                  value={formatCreationDate(formData.creationDate)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-450 dark:border-zinc-800 dark:bg-zinc-950 font-semibold cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase text-xs tracking-wider px-5 py-3 shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enregistrement...
                  </>
                ) : (
                  <>Sauvegarder les modifications 💾</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
