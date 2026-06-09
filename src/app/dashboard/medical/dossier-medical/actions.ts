"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateMedicalRecord(
  playerId: string,
  data: {
    bloodGroup: string
    allergies: string
    clearance: string
    lastCheckup: string
    newNote?: string
  }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "MEDECIN", "DIRECTEUR_SPORTIF"]
    if (!allowedRoles.includes(userRole || "")) {
      throw new Error("Action réservée aux professionnels de santé et gestionnaires du club")
    }

    // Fetch current player medical record to append note
    const player = await db.player.findUnique({
      where: { id: playerId },
      select: { medicalNotes: true }
    })

    if (!player) {
      throw new Error("Joueur introuvable")
    }

    let updatedNotes = [...player.medicalNotes]
    if (data.newNote && data.newNote.trim()) {
      updatedNotes.push(data.newNote.trim())
    }

    await db.player.update({
      where: { id: playerId },
      data: {
        bloodGroup: data.bloodGroup,
        allergies: data.allergies,
        clearance: data.clearance,
        lastCheckup: data.lastCheckup,
        medicalNotes: updatedNotes
      }
    })

    revalidatePath("/dashboard/medical/dossier-medical")
    return { success: true }
  } catch (e: any) {
    console.error("Error updating medical record:", e)
    return { success: false, error: e.message || "Erreur de mise à jour du dossier médical" }
  }
}
