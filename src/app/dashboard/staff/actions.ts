"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createStaffMember(data: {
  firstName: string
  lastName: string
  roleTag: string
  email: string
  phone: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  categoryIds: string[]
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL") {
      throw new Error("Action réservée aux gestionnaires")
    }

    if (userRole === "SECRETAIRE_GENERAL" && ["PRESIDENT", "SECRETAIRE_GENERAL", "DIRECTEUR_SPORTIF"].includes(data.roleTag)) {
      throw new Error("Vous n'êtes pas autorisé à attribuer ce rôle")
    }

    // Find the club ID
    let club = await db.club.findUnique({
      where: { presidentId: userId }
    })

    if (!club && userRole === "MANAGER_EVO_SPORTS") {
      club = await db.club.findFirst()
    }

    if (!club) {
      const staffMember = await db.staff.findUnique({
        where: { userId },
        include: { club: true }
      })
      if (staffMember) {
        club = staffMember.club
      }
    }

    if (!club) {
      throw new Error("Club introuvable")
    }

    // Find the role in the database
    let staffRole = await db.role.findUnique({
      where: { name: data.roleTag }
    })

    const isHeadCoach = data.roleTag === "ENTRAINEUR_PRINCIPAL"
    const isAssistantCoach = data.roleTag === "ENTRAINEUR_ADJOINT"

    if ((isHeadCoach || isAssistantCoach) && data.categoryIds.length > 1) {
      throw new Error("Un entraîneur principal ou adjoint ne peut être affecté qu'à une seule équipe.")
    }

    // Check target category constraints
    for (const catId of data.categoryIds) {
      const category = await db.teamCategory.findUnique({
        where: { id: catId },
        include: {
          staffMembers: {
            include: {
              user: {
                include: { role: true }
              }
            }
          }
        }
      })

      if (category) {
        if (isHeadCoach) {
          const hasHeadCoach = category.staffMembers.some(
            (sm) => sm.user?.role?.name === "ENTRAINEUR_PRINCIPAL"
          )
          if (hasHeadCoach) {
            throw new Error(`L'équipe "${category.name}" a déjà un entraîneur principal.`)
          }
        }
        if (isAssistantCoach) {
          const hasAssistantCoach = category.staffMembers.some(
            (sm) => sm.user?.role?.name === "ENTRAINEUR_ADJOINT"
          )
          if (hasAssistantCoach) {
            throw new Error(`L'équipe "${category.name}" a déjà un entraîneur adjoint.`)
          }
        }
      }
    }

    // Create related User account
    const fullName = `${data.lastName.toUpperCase()} ${data.firstName}`
    const user = await db.user.create({
      data: {
        name: fullName,
        email: data.email,
        phone: data.phone,
        password: "StaffPassword123", // Default password
        roleId: staffRole?.id || null
      }
    })

    // Create Staff record
    await db.staff.create({
      data: {
        userId: user.id,
        clubId: club.id,
        title: staffRole?.description || data.roleTag,
        categories: {
          connect: data.categoryIds.map(id => ({ id }))
        }
      }
    })

    // If this is a PRESIDENT, update the Club table to link to this user as president
    if (data.roleTag === "PRESIDENT") {
      await db.club.update({
        where: { id: club.id },
        data: { presidentId: user.id }
      })
    }

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (e: any) {
    console.error("Error creating staff member:", e)
    return { success: false, error: e.message || "Erreur de création du staff" }
  }
}

export async function deleteStaffMember(staffId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL") {
      throw new Error("Action réservée aux gestionnaires")
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: { user: { include: { role: true } } }
    })

    if (!staff) {
      throw new Error("Membre du staff introuvable")
    }

    if (userRole === "SECRETAIRE_GENERAL") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "SECRETAIRE_GENERAL" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à supprimer ce rôle")
      }
    }

    // Delete related User which cascades to delete Staff
    await db.user.delete({
      where: { id: staff.userId }
    })

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (e: any) {
    console.error("Error deleting staff member:", e)
    return { success: false, error: e.message || "Erreur lors de la suppression" }
  }
}

export async function updateStaffMember(
  staffId: string,
  data: {
    name: string
    email: string
    phone: string
    password?: string
    roleTag: string
    categoryIds: string[]
  }
) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL") {
      throw new Error("Action réservée aux gestionnaires")
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: { user: { include: { role: true } } }
    })

    if (!staff) {
      throw new Error("Membre du staff introuvable")
    }

    if (userRole === "SECRETAIRE_GENERAL") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "SECRETAIRE_GENERAL" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à modifier ce rôle")
      }
    }

    let staffRole = await db.role.findUnique({
      where: { name: data.roleTag }
    })

    const isHeadCoach = data.roleTag === "ENTRAINEUR_PRINCIPAL"
    const isAssistantCoach = data.roleTag === "ENTRAINEUR_ADJOINT"

    if ((isHeadCoach || isAssistantCoach) && data.categoryIds.length > 1) {
      throw new Error("Un entraîneur principal ou adjoint ne peut être affecté qu'à une seule équipe.")
    }

    // Check target category constraints
    for (const catId of data.categoryIds) {
      const category = await db.teamCategory.findUnique({
        where: { id: catId },
        include: {
          staffMembers: {
            include: {
              user: {
                include: { role: true }
              }
            }
          }
        }
      })

      if (category) {
        if (isHeadCoach) {
          const hasHeadCoach = category.staffMembers.some(
            (sm) => sm.user?.role?.name === "ENTRAINEUR_PRINCIPAL" && sm.id !== staffId
          )
          if (hasHeadCoach) {
            throw new Error(`L'équipe "${category.name}" a déjà un entraîneur principal.`)
          }
        }
        if (isAssistantCoach) {
          const hasAssistantCoach = category.staffMembers.some(
            (sm) => sm.user?.role?.name === "ENTRAINEUR_ADJOINT" && sm.id !== staffId
          )
          if (hasAssistantCoach) {
            throw new Error(`L'équipe "${category.name}" a déjà un entraîneur adjoint.`)
          }
        }
      }
    }

    await db.user.update({
      where: { id: staff.userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...(data.password ? { password: data.password } : {}),
        roleId: staffRole?.id || null
      }
    })

    await db.staff.update({
      where: { id: staffId },
      data: {
        title: staffRole?.description || data.roleTag,
        categories: {
          set: data.categoryIds.map(id => ({ id }))
        }
      }
    })

    revalidatePath("/dashboard/staff")
    return { success: true }
  } catch (e: any) {
    console.error("Error updating staff member:", e)
    return { success: false, error: e.message || "Erreur lors de la modification" }
  }
}

export async function toggleBlockStaffMember(staffId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL") {
      throw new Error("Action réservée aux gestionnaires")
    }

    const staff = await db.staff.findUnique({
      where: { id: staffId },
      include: { user: { include: { role: true } } }
    })

    if (!staff) {
      throw new Error("Membre du staff introuvable")
    }

    if (userRole === "SECRETAIRE_GENERAL") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "SECRETAIRE_GENERAL" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à bloquer ce rôle")
      }
    }

    const isBlockedNow = !staff.user.blocked

    await db.user.update({
      where: { id: staff.userId },
      data: {
        blocked: isBlockedNow
      }
    })

    revalidatePath("/dashboard/staff")
    return { success: true, blocked: isBlockedNow }
  } catch (e: any) {
    console.error("Error toggling block for staff member:", e)
    return { success: false, error: e.message || "Erreur lors du blocage" }
  }
}


