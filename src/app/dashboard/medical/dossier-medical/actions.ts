"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function updateMedicalRecord(
  memberId: string,
  memberType: "JOUEUR" | "STAFF",
  data: {
    bloodGroup: string
    allergies: string
    clearance: string
    lastCheckup: string
    newNote?: string
    age?: number
    nationality?: string
    birthDate?: string
    medicalTreatment?: string
    medication?: string
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

    if (memberType === "JOUEUR") {
      const player = await db.player.findUnique({
        where: { id: memberId },
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
        where: { id: memberId },
        data: {
          bloodGroup: data.bloodGroup || null,
          allergies: data.allergies || null,
          clearance: data.clearance || "Autorisé",
          lastCheckup: data.lastCheckup || null,
          medicalNotes: updatedNotes,
          age: data.age !== undefined && data.age !== null ? Number(data.age) : undefined,
          nationality: data.nationality || null,
          birthDate: data.birthDate || null,
          medicalTreatment: data.medicalTreatment || null,
          medication: data.medication || null
        }
      })
    } else {
      const staff = await db.staff.findUnique({
        where: { id: memberId },
        select: { medicalNotes: true }
      })

      if (!staff) {
        throw new Error("Membre du staff introuvable")
      }

      let updatedNotes = [...staff.medicalNotes]
      if (data.newNote && data.newNote.trim()) {
        updatedNotes.push(data.newNote.trim())
      }

      await db.staff.update({
        where: { id: memberId },
        data: {
          bloodGroup: data.bloodGroup || null,
          allergies: data.allergies || null,
          clearance: data.clearance || "Autorisé",
          lastCheckup: data.lastCheckup || null,
          medicalNotes: updatedNotes,
          age: data.age !== undefined && data.age !== null ? Number(data.age) : undefined,
          nationality: data.nationality || null,
          birthDate: data.birthDate || null,
          medicalTreatment: data.medicalTreatment || null,
          medication: data.medication || null
        }
      })
    }

    revalidatePath("/dashboard/medical/dossier-medical")
    return { success: true }
  } catch (e: any) {
    console.error("Error updating medical record:", e)
    return { success: false, error: e.message || "Erreur de mise à jour du dossier médical" }
  }
}
