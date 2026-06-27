"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logAccountAction } from "@/lib/actionLogger"

// Verify the operator is MANAGER_EVO_SPORTS
async function verifyManager() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error("Non autorisé")
  }
  const userRole = session.user.role?.name
  if (userRole !== "MANAGER_EVO_SPORTS") {
    throw new Error("Réservé au Manager EVO Sports")
  }
  return session.user
}

export async function restoreDeletedAccount(deletedAccountId: string) {
  try {
    const operator = await verifyManager()

    const deletedRecord = await db.deletedAccount.findUnique({
      where: { id: deletedAccountId }
    })

    if (!deletedRecord) {
      throw new Error("Compte supprimé introuvable")
    }

    const data = JSON.parse(deletedRecord.originalData)
    
    // Check if email already in use by active account
    if (data.user.email) {
      const existingUser = await db.user.findUnique({
        where: { email: data.user.email }
      })
      if (existingUser) {
        throw new Error("L'adresse email est déjà utilisée par un autre compte actif.")
      }
    }

    // Recreate user
    const user = await db.user.create({
      data: {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        password: data.user.password,
        roleId: data.user.roleId,
        phone: data.user.phone,
        blocked: data.user.blocked || false,
      }
    })

    if (deletedRecord.roleTag === "JOUEUR" && data.player) {
      // Recreate player
      await db.player.create({
        data: {
          id: data.player.id,
          userId: user.id,
          clubId: data.player.clubId,
          position: data.player.position,
          number: data.player.number,
          teamCategoryId: data.player.teamCategoryId,
          age: data.player.age,
          height: data.player.height,
          weight: data.player.weight,
          foot: data.player.foot,
          isInjured: data.player.isInjured || false,
          injuryType: data.player.injuryType,
          injurySeverity: data.player.injurySeverity,
          injuryDuration: data.player.injuryDuration,
          injuryDate: data.player.injuryDate ? new Date(data.player.injuryDate) : null,
          injuryReturn: data.player.injuryReturn ? new Date(data.player.injuryReturn) : null,
          injuryStatus: data.player.injuryStatus,
          injuryProgress: data.player.injuryProgress || 5,
          injuryDeclaredBy: data.player.injuryDeclaredBy,
          bloodGroup: data.player.bloodGroup,
          allergies: data.player.allergies,
          lastCheckup: data.player.lastCheckup,
          clearance: data.player.clearance || "Autorisé",
          medicalNotes: data.player.medicalNotes || [],
          nationality: data.player.nationality,
          birthDate: data.player.birthDate,
          medicalTreatment: data.player.medicalTreatment,
          medication: data.player.medication
        }
      })
    } else if (data.staff) {
      // Recreate staff
      await db.staff.create({
        data: {
          id: data.staff.id,
          userId: user.id,
          clubId: data.staff.clubId,
          title: data.staff.title,
          bloodGroup: data.staff.bloodGroup,
          allergies: data.staff.allergies,
          lastCheckup: data.staff.lastCheckup,
          clearance: data.staff.clearance || "Autorisé",
          medicalNotes: data.staff.medicalNotes || [],
          age: data.staff.age,
          nationality: data.staff.nationality,
          birthDate: data.staff.birthDate,
          medicalTreatment: data.staff.medicalTreatment,
          medication: data.staff.medication,
          categories: data.categories && data.categories.length > 0 
            ? { connect: data.categories.map((catId: string) => ({ id: catId })) }
            : undefined
        }
      })
    }

    // Remove from DeletedAccount bin
    await db.deletedAccount.delete({
      where: { id: deletedAccountId }
    })

    // Log the restoration action
    await logAccountAction({
      actionType: "CREATE",
      targetName: user.name || "Compte Restauré",
      targetRole: deletedRecord.roleTag,
      operatorName: operator.name || operator.email || "Manager Evo",
      operatorRole: "MANAGER_EVO_SPORTS",
      clubId: deletedRecord.clubId
    })

    revalidatePath("/dashboard/manager/comptes-supprimes")
    return { success: true }
  } catch (err: any) {
    console.error("Error restoring account:", err)
    return { success: false, error: err.message || "Erreur de restauration" }
  }
}

export async function permanentlyDeleteAccount(deletedAccountId: string) {
  try {
    const operator = await verifyManager()

    const deletedRecord = await db.deletedAccount.delete({
      where: { id: deletedAccountId }
    })

    // Log action
    await logAccountAction({
      actionType: "DELETE",
      targetName: deletedRecord.name + " (Permanent)",
      targetRole: deletedRecord.roleTag,
      operatorName: operator.name || operator.email || "Manager Evo",
      operatorRole: "MANAGER_EVO_SPORTS",
      clubId: deletedRecord.clubId
    })

    revalidatePath("/dashboard/manager/comptes-supprimes")
    return { success: true }
  } catch (err: any) {
    console.error("Error permanently deleting account:", err)
    return { success: false, error: err.message || "Erreur de suppression définitive" }
  }
}
