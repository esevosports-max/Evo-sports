"use client"

import { useState, useEffect, useRef } from "react"
import { saveCompositionAction, sendCompositionNotificationAction, communicateCompositionAction, uncommunicateCompositionAction } from "@/app/dashboard/composition/actions"

interface Player {
  id: string
  name: string
  number: number
  position: string // e.g. "Gardien", "Défenseur", "Milieu", "Attaquant"
  teamCategoryId: string | null
  teamCategoryName: string | null
}

interface Category {
  id: string
  name: string
}

interface PitchSlot {
  id: string // e.g. "GK", "DEF-0", "DEF-1", "MID-0", etc.
  type: "GK" | "DEF" | "MID" | "FWD"
  label: string // e.g. "GDB", "DEF", "MIL", "ATT"
  x: number // percentage
  y: number // percentage
  playerId: string | null // assigned player ID
}

interface DatabaseComposition {
  teamCategoryId: string
  formation: {
    defenders: number
    midfielders: number
    forwards: number
  }
  slots: PitchSlot[]
  substitutes: string[]
  isCommunicated?: boolean
  communicatedAt?: string | null
}

interface CompositionClientProps {
  initialPlayers: Player[]
  categories: Category[]
  initialCompositions: DatabaseComposition[]
}

interface SentNotification {
  name: string
  role: string
  message: string
}

export default function CompositionClient({
  initialPlayers,
  categories,
  initialCompositions,
}: CompositionClientProps) {
  // Determine initial selected category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (typeof window !== "undefined" && categories.length > 0) {
      const lastSelectedCat = localStorage.getItem("evo_sports_last_selected_category")
      if (lastSelectedCat && categories.some((c) => c.id === lastSelectedCat)) {
        return lastSelectedCat
      }
      return categories[0].id
    }
    return categories.length > 0 ? categories[0].id : ""
  })

  // 1. Formation State: Defenders - Midfielders - Forwards
  const [formation, setFormation] = useState({
    defenders: 4,
    midfielders: 3,
    forwards: 3,
  })

  // Inputs for editing formation
  const [inputDefenders, setInputDefenders] = useState(4)
  const [inputMidfielders, setInputMidfielders] = useState(3)
  const [inputForwards, setInputForwards] = useState(3)

  // 2. Pitch Slots State
  const [slots, setSlots] = useState<PitchSlot[]>([])

  // 3. Substitutes State (List of player IDs)
  const [substitutes, setSubstitutes] = useState<string[]>([])

  // List of all compositions
  const [compositions, setCompositions] = useState<DatabaseComposition[]>(initialCompositions)

  // Sync state if initialCompositions prop changes
  useEffect(() => {
    setCompositions(initialCompositions)
  }, [initialCompositions])

  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPosition, setFilterPosition] = useState<"Tous" | "Gardien" | "Défenseur" | "Milieu" | "Attaquant">("Tous")
  const [toastText, setToastText] = useState("")
  const [validationError, setValidationError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Extra requirements: Notify and Print actions
  const [isSavedAndComplete, setIsSavedAndComplete] = useState(false)
  const [isSendingNotifications, setIsSendingNotifications] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<SentNotification[] | null>(null)

  const [isCommunicated, setIsCommunicated] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isCommunicating, setIsCommunicating] = useState(false)
  
  // Drag and drop state
  const [activeDragSlotId, setActiveDragSlotId] = useState<string | null>(null)
  const pitchRef = useRef<HTMLDivElement>(null)

  // Helper to generate default slots for a formation
  const generateDefaultSlots = (def: number, mid: number, fwd: number, existingSlots: PitchSlot[] = []) => {
    const newSlots: PitchSlot[] = []

    // Goalkeeper: Always 1
    const gkSlot = existingSlots.find((s) => s.id === "GK")
    newSlots.push({
      id: "GK",
      type: "GK",
      label: "GDB",
      x: gkSlot?.x ?? 50,
      y: gkSlot?.y ?? 88,
      playerId: gkSlot?.playerId ?? null,
    })

    // Defenders
    for (let i = 0; i < def; i++) {
      const id = `DEF-${i}`
      const existing = existingSlots.find((s) => s.id === id)
      // Horizontal spacing
      const defaultX = (100 * (i + 1)) / (def + 1)
      newSlots.push({
        id,
        type: "DEF",
        label: "DEF",
        x: existing?.x ?? defaultX,
        y: existing?.y ?? 68,
        playerId: existing?.playerId ?? null,
      })
    }

    // Midfielders
    for (let i = 0; i < mid; i++) {
      const id = `MID-${i}`
      const existing = existingSlots.find((s) => s.id === id)
      // Horizontal spacing
      const defaultX = (100 * (i + 1)) / (mid + 1)
      newSlots.push({
        id,
        type: "MID",
        label: "MIL",
        x: existing?.x ?? defaultX,
        y: existing?.y ?? 45,
        playerId: existing?.playerId ?? null,
      })
    }

    // Forwards
    for (let i = 0; i < fwd; i++) {
      const id = `FWD-${i}`
      const existing = existingSlots.find((s) => s.id === id)
      // Horizontal spacing
      const defaultX = (100 * (i + 1)) / (fwd + 1)
      newSlots.push({
        id,
        type: "FWD",
        label: "ATT",
        x: existing?.x ?? defaultX,
        y: existing?.y ?? 22,
        playerId: existing?.playerId ?? null,
      })
    }

    return newSlots
  }

  // Load composition dynamically when the active category changes
  useEffect(() => {
    if (!selectedCategoryId) return

    // Save active category preference
    localStorage.setItem("evo_sports_last_selected_category", selectedCategoryId)

    // 1. Try loading from Server-Fetched database compositions first
    const dbComp = initialCompositions.find((c) => c.teamCategoryId === selectedCategoryId)
    if (dbComp) {
      setFormation(dbComp.formation)
      setInputDefenders(dbComp.formation.defenders)
      setInputMidfielders(dbComp.formation.midfielders)
      setInputForwards(dbComp.formation.forwards)
      setSlots(dbComp.slots)
      setSubstitutes(dbComp.substitutes)
      setValidationError("")
      
      const totalStarters = dbComp.slots.filter((s) => s.playerId !== null).length
      setIsSavedAndComplete(totalStarters === 11 && dbComp.substitutes.length >= 2)
      setIsCommunicated(!!dbComp.isCommunicated)
      return
    }

    // 2. Try loading from localStorage as a fallback
    const saved = localStorage.getItem(`evo_sports_composition_${selectedCategoryId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.formation) {
          setFormation(parsed.formation)
          setInputDefenders(parsed.formation.defenders)
          setInputMidfielders(parsed.formation.midfielders)
          setInputForwards(parsed.formation.forwards)
        }
        if (parsed.slots) {
          setSlots(parsed.slots)
        }
        if (parsed.substitutes) {
          setSubstitutes(parsed.substitutes)
        }
        setValidationError("")
        setIsSavedAndComplete(false)
        return
      } catch (e) {
        console.error("Failed to parse saved composition", e)
      }
    }

    // 3. Fallback/Default layout: 4-3-3
    const initialSlots = generateDefaultSlots(4, 3, 3)
    setSlots(initialSlots)
    setFormation({ defenders: 4, midfielders: 3, forwards: 3 })
    setInputDefenders(4)
    setInputMidfielders(3)
    setInputForwards(3)
    setSubstitutes([])
    setValidationError("")
    setIsSavedAndComplete(false)
  }, [selectedCategoryId, initialCompositions])

  // Save changes helper (saves locally to localStorage for quick restore on disconnect)
  const saveCompositionLocally = (updatedSlots: PitchSlot[], updatedSubs: string[], updatedFormation = formation) => {
    setIsSavedAndComplete(false) // Bypasses print/message actions until saved to database
    setIsCommunicated(false)
    if (!selectedCategoryId) return
    localStorage.setItem(
      `evo_sports_composition_${selectedCategoryId}`,
      JSON.stringify({
        formation: updatedFormation,
        slots: updatedSlots,
        substitutes: updatedSubs,
      })
    )
  }

  // Determine total starters assigned
  const totalStartersCount = slots.filter((s) => s.playerId !== null).length

  // Save composition to database using Server Action
  const handleSaveToDatabase = async () => {
    if (!selectedCategoryId) return
    setIsSaving(true)
    setValidationError("")

    try {
      const res = await saveCompositionAction({
        teamCategoryId: selectedCategoryId,
        formation,
        slots,
        substitutes,
      })

      if (res.success) {
        showToast("Composition enregistrée avec succès dans la base de données ! 💾")
        // Check if composition is complete (11 starters and >= 2 substitutes)
        setIsSavedAndComplete(totalStartersCount === 11 && substitutes.length >= 2)
        // Update local compositions list state
        setCompositions(prev => {
          const exists = prev.some(c => c.teamCategoryId === selectedCategoryId)
          if (exists) {
            return prev.map(c =>
              c.teamCategoryId === selectedCategoryId
                ? { ...c, formation, slots, substitutes }
                : c
            )
          } else {
            return [...prev, { teamCategoryId: selectedCategoryId, formation, slots, substitutes, isCommunicated: false, communicatedAt: null }]
          }
        })
      } else {
        setValidationError(res.error || "Une erreur est survenue lors de l'enregistrement.")
      }
    } catch (e: any) {
      console.error(e)
      setValidationError("Impossible de contacter le serveur.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle sending notifications (messages) to players
  const handleSendNotifications = async () => {
    if (!selectedCategoryId || totalStartersCount !== 11) return
    setIsSendingNotifications(true)

    const notificationsData: Array<{ name: string; role: string; email?: string }> = []
    const sentList: SentNotification[] = []

    // Compile notifications for all players in this squad category (Starters, substitutes, and non-selected)
    squadPlayers.forEach((player) => {
      let roleDesc = ""
      let messageText = ""

      const starterSlot = slots.find((s) => s.playerId === player.id)
      const isBench = substitutes.includes(player.id)

      if (starterSlot) {
        roleDesc = `Titulaire (Poste: ${starterSlot.label})`
        messageText = `Message de composition de la part de l'entraîneur : Bonjour ${player.name}, vous êtes titulaire au poste de ${starterSlot.label} pour le match.`
      } else if (isBench) {
        roleDesc = "Remplaçant (Banc)"
        messageText = `Message de composition de la part de l'entraîneur : Bonjour ${player.name}, vous êtes sur le banc des remplaçants pour le match.`
      } else {
        roleDesc = "Non convoqué"
        messageText = `Message de composition de la part de l'entraîneur : Bonjour ${player.name}, vous n'êtes pas dans la composition pour ce match.`
      }

      notificationsData.push({
        name: player.name,
        role: roleDesc,
      })

      sentList.push({
        name: player.name,
        role: roleDesc,
        message: messageText,
      })
    })

    try {
      const res = await sendCompositionNotificationAction({
        teamCategoryId: selectedCategoryId,
        notifications: notificationsData,
      })

      if (res.success) {
        setSentNotifications(sentList)
        showToast("Messages envoyés aux joueurs ! ✉️")
      } else {
        alert("Une erreur est survenue lors de l'envoi : " + res.error)
      }
    } catch (e) {
      console.error(e)
      alert("Impossible de contacter le serveur pour l'envoi des messages.")
    } finally {
      setIsSendingNotifications(false)
    }
  }

  // Open printer-friendly page for the match sheet
  const handlePrintMatchSheet = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const teamCategory = categories.find((c) => c.id === selectedCategoryId)
    const teamName = teamCategory ? teamCategory.name : "Équipe"

    const startersList = slots.map((slot) => {
      const player = getPlayerById(slot.playerId)
      return {
        role: slot.label,
        name: player ? player.name : "Non assigné",
        number: player ? player.number : "-",
      }
    })

    const subsList = substitutes.map((subId) => {
      const player = getPlayerById(subId)
      return {
        name: player ? player.name : "Inconnu",
        number: player ? player.number : "-",
      }
    })

    printWindow.document.write(`
      <html>
        <head>
          <title>Feuille de Match - ${teamName}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; }
            .header-container { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px; }
            .logo-img { height: 65px; object-fit: contain; }
            .header-text { text-align: left; }
            .header-text h1 { font-size: 26px; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
            .header-text h2 { font-size: 16px; color: #6b7280; font-weight: normal; margin: 5px 0 0 0; }
            h3 { font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
            .section { margin-bottom: 35px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; padding: 12px 15px; background-color: #f9fafb; font-weight: bold; font-size: 12px; text-transform: uppercase; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .badge { display: inline-block; padding: 3px 8px; background-color: #f3f4f6; border-radius: 4px; font-weight: bold; font-size: 11px; }
            .badge-gk { background-color: #fef3c7; color: #d97706; }
            .badge-def { background-color: #d1fae5; color: #059669; }
            .badge-mid { background-color: #e0f2fe; color: #0284c7; }
            .badge-fwd { background-color: #fce7f3; color: #db2777; }
            .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-box { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .meta-box p { margin: 5px 0; font-size: 13px; color: #4b5563; }
            .meta-box strong { color: #111827; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="${window.location.origin}/logo.png" class="logo-img" alt="Logo" />
            <div class="header-text">
              <h1>EVO SPORTS</h1>
              <h2>Feuille de Match Officielle</h2>
            </div>
          </div>
          
          <div class="meta-grid">
            <div class="meta-box">
              <p><strong>Catégorie :</strong> ${teamName}</p>
              <p><strong>Formation :</strong> ${formation.defenders}-${formation.midfielders}-${formation.forwards}</p>
            </div>
            <div class="meta-box" style="text-align: right;">
              <p><strong>Date d'édition :</strong> ${new Date().toLocaleDateString("fr-FR")}</p>
              <p><strong>Statut :</strong> Composition validée</p>
            </div>
          </div>

          <div class="section">
            <h3>Titulaires (Stade)</h3>
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">N°</th>
                  <th style="width: 50%;">Nom du Joueur</th>
                  <th style="width: 20%;">Poste</th>
                  <th style="width: 20%;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${startersList
                  .map((s) => {
                    const badgeClass = s.role.startsWith("GK") ? "badge-gk" : s.role.startsWith("DEF") ? "badge-def" : s.role.startsWith("MID") ? "badge-mid" : "badge-fwd"
                    return `
                      <tr>
                        <td><strong>${s.number}</strong></td>
                        <td>${s.name}</td>
                        <td><span class="badge ${badgeClass}">${s.role}</span></td>
                        <td>Titulaire</td>
                      </tr>
                    `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>Remplaçants (Banc)</h3>
            ${
              subsList.length === 0
                ? "<p style='font-size: 13px; color: #6b7280; font-style: italic;'>Aucun remplaçant désigné pour ce match.</p>"
                : `
                <table>
                  <thead>
                    <tr>
                      <th style="width: 10%;">N°</th>
                      <th style="width: 70%;">Nom du Joueur</th>
                      <th style="width: 20%;">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subsList
                      .map(
                        (s) => `
                      <tr>
                        <td><strong>${s.number}</strong></td>
                        <td>${s.name}</td>
                        <td>Remplaçant</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
            }
          </div>

          <div class="footer">
            Document généré automatiquement par EVO SPORTS. Tous droits réservés &copy; ${new Date().getFullYear()}.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Show dynamic toast message
  const showToast = (text: string) => {
    setToastText(text)
    const timeout = setTimeout(() => setToastText(""), 4000)
    return () => clearTimeout(timeout)
  }

  // Auto-apply formation when custom inputs change
  useEffect(() => {
    const totalOutfield = inputDefenders + inputMidfielders + inputForwards
    const totalPlayers = totalOutfield + 1 // including GK

    if (totalPlayers > 11) {
      setValidationError(
        `Le nombre total de joueurs (${totalPlayers}) dépasse 11. Veuillez ajuster la formation.`
      )
      return
    }

    if (inputDefenders < 1 || inputMidfielders < 1 || inputForwards < 1) {
      setValidationError("Chaque ligne (DEF, MIL, ATT) doit contenir au moins 1 joueur.")
      return
    }

    setValidationError("")

    // Check if the formation actually changed
    if (
      formation.defenders === inputDefenders &&
      formation.midfielders === inputMidfielders &&
      formation.forwards === inputForwards
    ) {
      return
    }

    // Apply the new formation
    const newFormation = {
      defenders: inputDefenders,
      midfielders: inputMidfielders,
      forwards: inputForwards,
    }
    setFormation(newFormation)

    // Gather all currently assigned players
    const currentAssignments = {
      GK: slots.find((s) => s.type === "GK")?.playerId ?? null,
      DEF: slots.filter((s) => s.type === "DEF" && s.playerId).map((s) => s.playerId as string),
      MID: slots.filter((s) => s.type === "MID" && s.playerId).map((s) => s.playerId as string),
      FWD: slots.filter((s) => s.type === "FWD" && s.playerId).map((s) => s.playerId as string),
    }

    // Generate new empty slots
    const defaultSlots = generateDefaultSlots(newFormation.defenders, newFormation.midfielders, newFormation.forwards)

    // Re-assign players up to the new slot limits
    const updatedSlots = defaultSlots.map((slot) => {
      if (slot.type === "GK") {
        return { ...slot, playerId: currentAssignments.GK }
      } else if (slot.type === "DEF") {
        const player = currentAssignments.DEF.shift() ?? null
        return { ...slot, playerId: player }
      } else if (slot.type === "MID") {
        const player = currentAssignments.MID.shift() ?? null
        return { ...slot, playerId: player }
      } else {
        const player = currentAssignments.FWD.shift() ?? null
        return { ...slot, playerId: player }
      }
    })

    setSlots(updatedSlots)
    saveCompositionLocally(updatedSlots, substitutes, newFormation)
  }, [inputDefenders, inputMidfielders, inputForwards])

  // Quick Preset Formations helper
  const handlePreset = (def: number, mid: number, fwd: number) => {
    setInputDefenders(def)
    setInputMidfielders(mid)
    setInputForwards(fwd)
    showToast(`Schéma tactique configuré en ${def}-${mid}-${fwd}. N'oubliez pas d'enregistrer !`)
  }

  // 4. Assigning/Unassigning Logic
  const assignPlayerToSlot = (playerId: string, slotId: string) => {
    let updatedSlots = slots.map((s) => (s.playerId === playerId ? { ...s, playerId: null } : s))
    const updatedSubs = substitutes.filter((id) => id !== playerId)
    const targetSlot = slots.find((s) => s.id === slotId)

    updatedSlots = updatedSlots.map((s) => {
      if (s.id === slotId) {
        return { ...s, playerId }
      }
      return s
    })

    setSlots(updatedSlots)
    setSubstitutes(updatedSubs)
    saveCompositionLocally(updatedSlots, updatedSubs)

    const p = initialPlayers.find((player) => player.id === playerId)
    showToast(`${p?.name} est maintenant titulaire (${targetSlot?.label})`)
  }

  const assignPlayerToSubstitutes = (playerId: string) => {
    const updatedSlots = slots.map((s) => (s.playerId === playerId ? { ...s, playerId: null } : s))

    if (substitutes.includes(playerId)) return

    const updatedSubs = [...substitutes, playerId]
    setSlots(updatedSlots)
    setSubstitutes(updatedSubs)
    saveCompositionLocally(updatedSlots, updatedSubs)

    const p = initialPlayers.find((player) => player.id === playerId)
    showToast(`${p?.name} a été ajouté aux remplaçants`)
  }

  const unassignPlayer = (playerId: string) => {
    const updatedSlots = slots.map((s) => (s.playerId === playerId ? { ...s, playerId: null } : s))
    const updatedSubs = substitutes.filter((id) => id !== playerId)

    setSlots(updatedSlots)
    setSubstitutes(updatedSubs)
    saveCompositionLocally(updatedSlots, updatedSubs)

    const p = initialPlayers.find((player) => player.id === playerId)
    showToast(`${p?.name} a été retiré de la composition`)
  }

  const clearLineup = () => {
    if (!confirm("Voulez-vous vraiment vider toute la composition ?")) return
    const updatedSlots = slots.map((s) => ({ ...s, playerId: null }))
    const updatedSubs: string[] = []
    setSlots(updatedSlots)
    setSubstitutes(updatedSubs)
    saveCompositionLocally(updatedSlots, updatedSubs)
    showToast("Composition vidée. Cliquez sur enregistrer pour valider.")
  }

  const handleUncommunicate = async (categoryId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette composition de la liste des compositions communiquées ? Elle ne sera plus visible pour les joueurs.")) return

    try {
      const res = await uncommunicateCompositionAction(categoryId)
      if (res.success) {
        showToast("La composition a été retirée des compositions communiquées. ❌")
        setCompositions(prev => prev.map(c => 
          c.teamCategoryId === categoryId 
            ? { ...c, isCommunicated: false, communicatedAt: null }
            : c
        ))
        if (categoryId === selectedCategoryId) {
          setIsCommunicated(false)
        }
      } else {
        alert("Une erreur est survenue lors du retrait de la composition : " + res.error)
      }
    } catch (e) {
      console.error(e)
      alert("Impossible de retirer la composition.")
    }
  }


  // 5. Draggable Coordinates Mechanics (pitch coordinates)
  const handlePitchMouseMove = (e: React.MouseEvent) => {
    if (!activeDragSlotId || !pitchRef.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    
    let x = ((e.clientX - rect.left) / rect.width) * 100
    let y = ((e.clientY - rect.top) / rect.height) * 100

    x = Math.max(4, Math.min(96, x))
    y = Math.max(4, Math.min(96, y))

    x = Math.round(x * 10) / 10
    y = Math.round(y * 10) / 10

    setSlots((prev) =>
      prev.map((s) => (s.id === activeDragSlotId ? { ...s, x, y } : s))
    )
  }

  const handlePitchTouchMove = (e: React.TouchEvent) => {
    if (!activeDragSlotId || !pitchRef.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    
    let x = ((touch.clientX - rect.left) / rect.width) * 100
    let y = ((touch.clientY - rect.top) / rect.height) * 100

    x = Math.max(4, Math.min(96, x))
    y = Math.max(4, Math.min(96, y))

    x = Math.round(x * 10) / 10
    y = Math.round(y * 10) / 10

    setSlots((prev) =>
      prev.map((s) => (s.id === activeDragSlotId ? { ...s, x, y } : s))
    )
  }

  const stopPitchDragging = () => {
    if (activeDragSlotId) {
      setActiveDragSlotId(null)
      saveCompositionLocally(slots, substitutes)
    }
  }

  // HTML5 Drag and Drop Events for player cards from the list
  const handleCardDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData("playerId", playerId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleSlotDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData("playerId")
    if (playerId) {
      assignPlayerToSlot(playerId, slotId)
    }
  }

  const handleSubsDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const playerId = e.dataTransfer.getData("playerId")
    if (playerId) {
      assignPlayerToSubstitutes(playerId)
    }
  }

  // Helper mappings
  const getPlayerById = (id: string | null) => {
    if (!id) return null
    return initialPlayers.find((p) => p.id === id) || null
  }

  const isStarter = (playerId: string) => slots.some((s) => s.playerId === playerId)
  const isSub = (playerId: string) => substitutes.includes(playerId)

  // Filter squad players to only show those belonging to the selected category (l'équipe)
  const squadPlayers = initialPlayers.filter((p) => p.teamCategoryId === selectedCategoryId)

  // Filter players list in the sidebar by search and position filters
  const filteredPlayers = squadPlayers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.number.toString() === searchQuery
    const matchesPosition = filterPosition === "Tous" || p.position === filterPosition
    return matchesSearch && matchesPosition
  })

  const communicatedList = compositions.filter((c) => c.isCommunicated)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Dynamic Toast Message */}
      {toastText && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl border border-emerald-500 bg-white p-4 shadow-2xl dark:bg-zinc-900 transition-all transform animate-bounce">
          <p className="text-xs font-bold text-zinc-800 dark:text-emerald-400 flex items-center gap-2">
            <span>✅</span> {toastText}
          </p>
        </div>
      )}

      {/* Header Banner & Formation Control */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            Composition Tactique
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Choisissez la structure de match, déplacez les joueurs sur le terrain, affectez les titulaires et gérez les remplaçants.
          </p>
        </div>

        {/* Action Controls & Presets */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4 w-full xl:w-auto">
          {/* Quick presets */}
          <div className="flex items-center gap-1 bg-zinc-150 p-1 rounded-xl dark:bg-zinc-800 self-start">
            <span className="text-[10px] font-black text-zinc-400 uppercase px-2">Presets :</span>
            {[
              { d: 4, m: 3, f: 3, name: "4-3-3" },
              { d: 4, m: 4, f: 2, name: "4-4-2" },
              { d: 3, m: 4, f: 3, name: "3-4-3" },
              { d: 3, m: 5, f: 2, name: "3-5-2" },
              { d: 5, m: 3, f: 2, name: "5-3-2" },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset.d, preset.m, preset.f)}
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer transition-all ${
                  formation.defenders === preset.d &&
                  formation.midfielders === preset.m &&
                  formation.forwards === preset.f
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <button
            onClick={clearLineup}
            className="px-4 py-2 text-xs font-black text-white bg-red-500 hover:bg-red-400 active:scale-95 rounded-xl shadow-md cursor-pointer transition-all uppercase tracking-wider self-start"
          >
            Vider
          </button>
        </div>
      </section>

      {/* Validation Message */}
      {validationError && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm font-bold text-red-650 dark:text-red-400 text-center animate-pulse">
          ⚠️ {validationError}
        </div>
      )}

      {/* Main Board Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Visual Soccer Pitch Mockup (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Custom Formation Input Form */}
          <div className="rounded-2xl border border-zinc-200/50 bg-white p-4 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-4">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <span className="text-xs font-black uppercase text-zinc-500 dark:text-zinc-400">
                Composition Custom (X-Y-Z) :
              </span>
              
              <div className="flex items-center gap-2">
                {/* Defenders input */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setInputDefenders(Math.max(1, inputDefenders - 1))}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-l-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <div className="h-8 w-10 bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-900 dark:text-white flex items-center justify-center text-xs border-y border-zinc-200/50 dark:border-zinc-850">
                    {inputDefenders}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputDefenders + inputMidfielders + inputForwards < 10) {
                        setInputDefenders(inputDefenders + 1)
                      } else {
                        showToast("Max 10 joueurs de champ atteints !")
                      }
                    }}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-r-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-zinc-400">-</span>
                
                {/* Midfielders input */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setInputMidfielders(Math.max(1, inputMidfielders - 1))}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-l-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <div className="h-8 w-10 bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-900 dark:text-white flex items-center justify-center text-xs border-y border-zinc-200/50 dark:border-zinc-850">
                    {inputMidfielders}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputDefenders + inputMidfielders + inputForwards < 10) {
                        setInputMidfielders(inputMidfielders + 1)
                      } else {
                        showToast("Max 10 joueurs de champ atteints !")
                      }
                    }}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-r-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <span className="font-bold text-zinc-400">-</span>

                {/* Forwards input */}
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setInputForwards(Math.max(1, inputForwards - 1))}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-l-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <div className="h-8 w-10 bg-zinc-50 dark:bg-zinc-950 font-black text-zinc-900 dark:text-white flex items-center justify-center text-xs border-y border-zinc-200/50 dark:border-zinc-850">
                    {inputForwards}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputDefenders + inputMidfielders + inputForwards < 10) {
                        setInputForwards(inputForwards + 1)
                      } else {
                        showToast("Max 10 joueurs de champ atteints !")
                      }
                    }}
                    className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800 rounded-r-lg font-black text-zinc-650 hover:bg-zinc-200 dark:text-zinc-300 flex items-center justify-center text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

            </form>

            <div className="text-right text-xs font-bold text-zinc-450 dark:text-zinc-400">
              Outfield: <span className="text-emerald-500 font-extrabold">{inputDefenders + inputMidfielders + inputForwards} / 10</span>
              <span className="mx-2">|</span>
              Total: <span className="text-emerald-500 font-extrabold">{inputDefenders + inputMidfielders + inputForwards + 1} / 11</span>
            </div>
          </div>

          {/* Tactical Pitch Wrapper */}
          <div className="space-y-4">
            {/* The Green Pitch */}
            <div
              ref={pitchRef}
              onMouseMove={handlePitchMouseMove}
              onTouchMove={handlePitchTouchMove}
              onMouseUp={stopPitchDragging}
              onTouchEnd={stopPitchDragging}
              onMouseLeave={stopPitchDragging}
              className="w-full h-[550px] rounded-3xl border border-emerald-600/30 bg-[#166534] shadow-2xl relative overflow-hidden select-none"
            >
              {/* Field Markings */}
              <div className="absolute inset-4 border-2 border-white/20 pointer-events-none rounded-2xl" />
              <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-white/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-36 w-36 rounded-full border-2 border-white/20 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/25 pointer-events-none" />

              {/* Penalty Box Top */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-32 w-[60%] border-b-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-12 w-[25%] border-b-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute top-28 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/25 pointer-events-none" />

              {/* Penalty Box Bottom */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-32 w-[65%] border-t-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-12 w-[25%] border-t-2 border-x-2 border-white/20 pointer-events-none" />
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-white/25 pointer-events-none" />

              {/* Corner Arcs */}
              <div className="absolute top-4 left-4 h-6 w-6 border-b border-r border-white/10 rounded-br-full pointer-events-none" />
              <div className="absolute top-4 right-4 h-6 w-6 border-b border-l border-white/10 rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-4 left-4 h-6 w-6 border-t border-r border-white/10 rounded-tr-full pointer-events-none" />
              <div className="absolute bottom-4 right-4 h-6 w-6 border-t border-l border-white/10 rounded-tl-full pointer-events-none" />

              {/* Pitch Grass Striping */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-full h-[12.5%] ${idx % 2 === 0 ? "bg-black" : "bg-transparent"}`}
                  />
                ))}
              </div>

              {/* Render Draggable Slots */}
              {slots.map((slot) => {
                const assignedPlayer = getPlayerById(slot.playerId)
                
                return (
                  <div
                    key={slot.id}
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-shadow"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleSlotDrop(e, slot.id)}
                  >
                    <div
                      onMouseDown={(e) => {
                        if ((e.target as HTMLElement).closest(".remove-btn")) return
                        setActiveDragSlotId(slot.id)
                      }}
                      onTouchStart={(e) => {
                        if ((e.target as HTMLElement).closest(".remove-btn")) return
                        setActiveDragSlotId(slot.id)
                      }}
                      className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full flex flex-col items-center justify-center border-2 shadow-xl cursor-grab active:cursor-grabbing transition-all transform hover:scale-105 select-none relative ${
                        assignedPlayer
                          ? slot.type === "GK"
                            ? "bg-amber-400 border-white text-zinc-950"
                            : "bg-emerald-500 border-white text-white"
                          : "bg-black/35 border-dashed border-white/40 text-white/50 hover:bg-black/50 hover:border-white/60"
                      }`}
                    >
                      {assignedPlayer ? (
                        <>
                          <span className="text-sm sm:text-base font-black">
                            {assignedPlayer.number}
                          </span>
                          <span className="text-[7px] font-black uppercase bg-black/20 px-1 rounded-sm mt-0.5">
                            {slot.label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              unassignPlayer(assignedPlayer.id)
                            }}
                            className="remove-btn absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-400 text-white font-black text-[9px] rounded-full h-4 w-4 flex items-center justify-center border border-white cursor-pointer shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm font-black">+</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider">
                            {slot.label}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-center mt-1.5 max-w-[85px] mx-auto pointer-events-none">
                      <p className="text-[9px] sm:text-xs font-black text-white bg-zinc-950/70 border border-white/10 px-1.5 py-0.5 rounded-md drop-shadow-md truncate">
                        {assignedPlayer ? assignedPlayer.name.split(" ").pop() : "Vide"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Substitution Area (Completely OUTSIDE the pitch/stadium) */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleSubsDrop}
              className="w-full rounded-2xl border-2 border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-4 shadow-sm hover:border-emerald-500/50 transition-colors"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850 mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <span>🔄</span> Remplaçants ({substitutes.length})
                </h4>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Glissez des joueurs de la liste ici pour les mettre sur le banc
                </span>
              </div>

              {substitutes.length === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 leading-relaxed">
                  Glissez des joueurs de la liste ici, ou cliquez sur "+ Banc" pour les ajouter.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {substitutes.map((subId) => {
                    const player = getPlayerById(subId)
                    if (!player) return null
                    return (
                      <div
                        key={subId}
                        className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-850 rounded-xl p-2 flex items-center justify-between min-w-0 shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 h-5 w-5 rounded flex items-center justify-center shrink-0 border border-amber-500/20">
                            {player.number}
                          </span>
                          <span className="text-xs font-bold truncate text-zinc-700 dark:text-zinc-200">
                            {player.name.split(" ").pop()}
                          </span>
                        </div>
                        <button
                          onClick={() => unassignPlayer(subId)}
                          className="text-xs font-black text-zinc-400 hover:text-red-500 cursor-pointer p-1"
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Database SAVE Button - Placed Under the pitch & substitutes */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || !selectedCategoryId}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-550 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-emerald-600/15 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-500/40"
              >
                {isSaving ? "Enregistrement en cours..." : "Enregistrer la Composition"}
              </button>
            </div>

            {/* Extra Requirements: Send Message and Print buttons - Visible ONLY when composition is saved and complete (11 starters) */}
            {isSavedAndComplete && (
              <div className="mt-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 flex flex-col sm:flex-row gap-3 justify-center animate-in slide-in-from-bottom duration-300">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isCommunicating}
                  className={`flex-1 py-3 px-4 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    isCommunicated
                      ? "bg-emerald-600 hover:bg-emerald-550 border-emerald-550"
                      : "bg-blue-600 hover:bg-blue-550 border-blue-500"
                  }`}
                >
                  📢 {isCommunicated ? "Formation Communiquée (Renvoyer)" : "Communiquer la formation"}
                </button>
                <button
                  onClick={handlePrintMatchSheet}
                  className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
                >
                  Imprimer la feuille de match
                </button>
              </div>
            )}

            {/* Confirm communication modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="text-center space-y-4">
                    <div className="mx-auto h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xl">
                      📢
                    </div>
                    <h3 className="text-base font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                      Communiquer la formation ?
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      En communiquant cette formation, un message et une notification en temps réel seront envoyés à tous les joueurs titulaires et remplaçants sélectionnés. Ils pourront consulter la composition depuis leur tableau de bord.
                    </p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-zinc-200 dark:border-zinc-700"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!selectedCategoryId) return
                        setIsCommunicating(true)
                        try {
                          const res = await communicateCompositionAction(selectedCategoryId)
                          if (res.success) {
                            setIsCommunicated(true)
                            showToast("La formation a été communiquée aux joueurs avec succès ! 📢")
                            setShowConfirmModal(false)
                            setCompositions(prev => prev.map(c => 
                              c.teamCategoryId === selectedCategoryId 
                                ? { ...c, isCommunicated: true, communicatedAt: new Date().toISOString() }
                                : c
                            ))
                          } else {
                            alert("Erreur lors de la communication : " + res.error)
                          }
                        } catch (e) {
                          console.error(e)
                          alert("Impossible de communiquer la formation.")
                        } finally {
                          setIsCommunicating(false)
                        }
                      }}
                      disabled={isCommunicating}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-550 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all border border-blue-500 shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isCommunicating ? "Envoi..." : "Confirmer"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal for displaying sent messages details */}
            {sentNotifications && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-850">
                    <h3 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                      Notifications Envoyées
                    </h3>
                    <button
                      onClick={() => setSentNotifications(null)}
                      className="text-zinc-400 hover:text-zinc-650 dark:hover:text-white text-xl font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar pr-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                      Les messages de composition d&apos;équipe suivants ont été envoyés avec succès :
                    </p>
                    {sentNotifications.map((notif, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-zinc-800 dark:text-zinc-200">{notif.name}</span>
                          <span className="text-emerald-500 uppercase text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {notif.role}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                          &ldquo;{notif.message}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-zinc-150 dark:border-zinc-850 flex justify-end">
                    <button
                      onClick={() => setSentNotifications(null)}
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Squad Selection Panel (Right 1 col) */}
        <div className="lg:col-span-1 rounded-2xl border border-zinc-200/50 bg-white p-5 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 flex flex-col h-[700px] overflow-hidden">
          
          <div className="pb-4 border-b border-zinc-150 dark:border-zinc-850 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-850 dark:text-white flex items-center justify-between">
              <span>👥 EFFECTIFS CLUB</span>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded-full text-zinc-500">
                {squadPlayers.length} joueurs
              </span>
            </h3>

            {/* Dynamic category selector */}
            {categories.length > 1 ? (
              <div className="flex flex-col gap-1.5 bg-emerald-50/50 dark:bg-zinc-950 p-3 rounded-xl border border-emerald-100/50 dark:border-zinc-800">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Sélectionner l&apos;équipe / catégorie :
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value)
                    setSearchQuery("")
                  }}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm outline-none transition-all dark:border-zinc-850 dark:bg-zinc-900 dark:text-white font-bold"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : categories.length === 1 ? (
              <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                <span className="uppercase tracking-wider">Équipe chargée :</span>
                <span className="text-emerald-500 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  {categories[0].name}
                </span>
              </div>
            ) : (
              <div className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl border border-red-200 dark:border-red-900 text-center">
                ⚠️ Aucune catégorie trouvée. Veuillez en créer une d&apos;abord.
              </div>
            )}

            {/* Position filter */}
            <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-800">
              {(["Tous", "Gardien", "Défenseur", "Milieu", "Attaquant"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(pos)}
                  className={`px-2 py-1 text-[9px] font-black rounded-lg cursor-pointer transition-all ${
                    filterPosition === pos
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher nom ou numéro..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 shadow-inner outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-650 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List of squad players */}
          <div className="flex-1 overflow-y-auto pt-4 space-y-2.5 custom-scrollbar pr-1">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-xs font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                Aucun joueur disponible pour cette sélection.
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const starter = isStarter(player.id)
                const sub = isSub(player.id)
                
                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleCardDragStart(e, player.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between group cursor-grab active:cursor-grabbing ${
                      starter
                        ? "bg-emerald-500/5 border-emerald-500/20 dark:bg-emerald-500/10"
                        : sub
                        ? "bg-amber-500/5 border-amber-500/20 dark:bg-amber-500/10"
                        : "bg-white border-zinc-150 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-850 dark:hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-xs font-black h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          starter
                            ? "bg-emerald-500 border-emerald-600 text-white"
                            : sub
                            ? "bg-amber-400 border-amber-500 text-zinc-900"
                            : "bg-zinc-100 border-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-750 dark:text-zinc-200"
                        }`}
                      >
                        {player.number}
                      </span>
                      
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 truncate uppercase">
                          {player.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-black uppercase text-zinc-400">
                            {player.position}
                          </span>
                          {player.teamCategoryName && (
                            <>
                              <span className="text-[8px] text-zinc-300">•</span>
                              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[80px]">
                                {player.teamCategoryName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {starter ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                            Titulaire
                          </span>
                          <button
                            onClick={() => unassignPlayer(player.id)}
                            className="h-6 w-6 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : sub ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                            Remplaçant
                          </span>
                          <button
                            onClick={() => unassignPlayer(player.id)}
                            className="h-6 w-6 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all"
                            title="Retirer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const playerRole = player.position === "Gardien" ? "GK" : 
                                                 player.position === "Défenseur" ? "DEF" :
                                                 player.position === "Milieu" ? "MID" : "FWD"
                              
                              const emptySlotOfRole = slots.find((s) => s.type === playerRole && !s.playerId)
                              const emptyAnySlot = slots.find((s) => !s.playerId)
                              const targetSlot = emptySlotOfRole || emptyAnySlot
                              
                              if (targetSlot) {
                                assignPlayerToSlot(player.id, targetSlot.id)
                              } else {
                                if (totalStartersCount >= 11) {
                                  showToast("Le stade est plein (11 titulaires max) !")
                                } else {
                                  showToast("Pas de poste disponible correspondant !")
                                }
                              }
                            }}
                            className="px-2 py-1 text-[8px] font-black bg-emerald-500 text-white rounded hover:bg-emerald-400 active:scale-95 cursor-pointer uppercase transition-all shadow-sm"
                            title="Placer sur le terrain"
                          >
                            + Terrain
                          </button>
                          
                          <button
                            onClick={() => assignPlayerToSubstitutes(player.id)}
                            className="px-2 py-1 text-[8px] font-black bg-amber-400 text-zinc-950 rounded hover:bg-amber-300 active:scale-95 cursor-pointer uppercase transition-all shadow-sm"
                            title="Placer sur le banc"
                          >
                            + Banc
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Section des compositions communiquées */}
      <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-150 dark:border-zinc-850 pb-3 gap-2">
          <div>
            <h2 className="text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-white flex items-center gap-2">
              📢 Compositions Communiquées ({communicatedList.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Compositions actuellement visibles par les joueurs sur leur tableau de bord.
            </p>
          </div>
        </div>

        {communicatedList.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs font-bold">
            Aucune composition n&apos;est actuellement communiquée aux joueurs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {communicatedList.map((comp) => {
              const catName = categories.find((c) => c.id === comp.teamCategoryId)?.name || "Catégorie inconnue"
              return (
                <div
                  key={comp.teamCategoryId}
                  className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] dark:bg-emerald-950/5 flex flex-col justify-between gap-4 transition-all hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase truncate">
                        {catName}
                      </h4>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider shrink-0">
                        Publiée
                      </span>
                    </div>
                    
                    <div className="text-xs space-y-1 text-zinc-650 dark:text-zinc-400">
                      <p>
                        ⚽ Schéma : <strong className="text-zinc-850 dark:text-white">{comp.formation.defenders}-{comp.formation.midfielders}-{comp.formation.forwards}</strong>
                      </p>
                      <p>
                        👥 Effectif : <strong className="text-zinc-850 dark:text-white">11 Titulaires</strong> &bull; <strong className="text-zinc-850 dark:text-white">{comp.substitutes ? comp.substitutes.length : 0} Remplaçants</strong>
                      </p>
                      {comp.communicatedAt && (
                        <p className="text-[10px] text-zinc-400 italic mt-2" suppressHydrationWarning>
                          Le {new Date(comp.communicatedAt).toLocaleDateString("fr-FR")} à {new Date(comp.communicatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCategoryId(comp.teamCategoryId)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }}
                      className="flex-1 py-2 text-center bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border border-zinc-200/50 dark:border-zinc-800"
                    >
                      ✏️ Voir / Modifier
                    </button>
                    
                    <button
                      onClick={() => handleUncommunicate(comp.teamCategoryId)}
                      className="flex-1 py-2 text-center bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-red-500/10 active:scale-95 border border-red-500"
                    >
                      🗑️ Supprimer de la liste
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
