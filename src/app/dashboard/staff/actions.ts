"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { logAccountAction } from "@/lib/actionLogger"

export async function createStaffMember(data: {
  firstName: string
  lastName: string
  roleTag: string
  email: string
  phone: string
  password?: string
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

    if (userRole === "DIRECTEUR_SPORTIF" && ["PRESIDENT", "DIRECTEUR_SPORTIF"].includes(data.roleTag)) {
      throw new Error("Vous n'êtes pas autorisé à attribuer ce rôle")
    }

    if (data.roleTag === "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
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

    // Check subscription plan limits for 1 Équipe
    const plan = club.subscriptionPlan || "Club"
    const isOneTeamPlan = plan === "1 Équipe" || plan === "1 equipe" || plan === "Standard"
    
    if (isOneTeamPlan && userRole !== "PRESIDENT" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL" && userRole !== "MANAGER_EVO_SPORTS") {
      const forbiddenRoles = ["ENTRAINEUR_ADJOINT", "SECRETAIRE_GENERAL", "ENTRAINEUR_GARDIENS", "PREPARATEUR_PHYSIQUE"]
      if (forbiddenRoles.includes(data.roleTag)) {
        throw new Error("Votre forfait '1 Équipe' ne permet pas de créer ce type de compte.")
      }

      if (data.roleTag === "ENTRAINEUR_PRINCIPAL") {
        const headCoachCount = await db.staff.count({
          where: {
            clubId: club.id,
            user: {
              role: { name: "ENTRAINEUR_PRINCIPAL" }
            }
          }
        })
        if (headCoachCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet de créer qu'un seul Entraîneur Principal.")
        }
      }

      if (data.roleTag === "DIRECTEUR_SPORTIF") {
        const dirSportifCount = await db.staff.count({
          where: {
            clubId: club.id,
            user: {
              role: { name: "DIRECTEUR_SPORTIF" }
            }
          }
        })
        if (dirSportifCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet de créer qu'un seul Directeur Sportif.")
        }
      }

      if (data.roleTag === "MEDECIN") {
        const medecinCount = await db.staff.count({
          where: {
            clubId: club.id,
            user: {
              role: { name: "MEDECIN" }
            }
          }
        })
        if (medecinCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet de créer qu'un seul Médecin du Club.")
        }
      }
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

    // Check if email already in use
    const emailNormalized = data.email.toLowerCase().trim()
    const existingUser = await db.user.findUnique({
      where: { email: emailNormalized }
    })
    if (existingUser) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }

    const existingDeleted = await db.deletedAccount.findFirst({
      where: { email: emailNormalized }
    })
    if (existingDeleted) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }

    // Create related User account
    const fullName = `${data.lastName.toUpperCase()} ${data.firstName}`
    const user = await db.user.create({
      data: {
        name: fullName,
        email: emailNormalized,
        phone: data.phone,
        password: data.password || "StaffPassword123", // Default password if not provided
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

    await logAccountAction({
      actionType: "CREATE",
      targetName: fullName,
      targetRole: data.roleTag,
      operatorName: session.user.name || session.user.email || "Utilisateur",
      operatorRole: userRole || "ADMIN",
      clubId: club.id
    })

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
      include: {
        categories: true,
        user: { include: { role: true } }
      }
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

    if (userRole === "DIRECTEUR_SPORTIF") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à supprimer ce rôle")
      }
    }

    // Save account state for restoration/trash bin before deleting
    const originalData = JSON.stringify({
      user: {
        id: staff.user.id,
        name: staff.user.name,
        email: staff.user.email,
        password: staff.user.password,
        roleId: staff.user.roleId,
        phone: staff.user.phone,
        blocked: staff.user.blocked
      },
      staff: {
        id: staff.id,
        userId: staff.userId,
        clubId: staff.clubId,
        title: staff.title,
        bloodGroup: staff.bloodGroup,
        allergies: staff.allergies,
        lastCheckup: staff.lastCheckup,
        clearance: staff.clearance,
        medicalNotes: staff.medicalNotes,
        age: staff.age,
        nationality: staff.nationality,
        birthDate: staff.birthDate,
        medicalTreatment: staff.medicalTreatment,
        medication: staff.medication
      },
      categories: staff.categories.map((c) => c.id)
    })

    await db.deletedAccount.create({
      data: {
        userId: staff.userId,
        name: staff.user.name || "Membre du Staff",
        email: staff.user.email || "",
        phone: staff.user.phone,
        roleTag: staff.user.role?.name || "STAFF",
        clubId: staff.clubId,
        originalData,
        deletedBy: session.user.name || session.user.email || "Gestionnaire"
      }
    })

    // Delete related User which cascades to delete Staff
    await db.user.delete({
      where: { id: staff.userId }
    })

    await logAccountAction({
      actionType: "DELETE",
      targetName: staff.user?.name || "Membre du Staff",
      targetRole: staff.user?.role?.name || "STAFF",
      operatorName: session.user.name || session.user.email || "Utilisateur",
      operatorRole: userRole || "ADMIN",
      clubId: staff.clubId
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

    const club = await db.club.findUnique({
      where: { id: staff.clubId }
    })
    if (!club) {
      throw new Error("Club introuvable")
    }

    const plan = club.subscriptionPlan || "Club"
    const isOneTeamPlan = plan === "1 Équipe" || plan === "1 equipe" || plan === "Standard"
    
    if (isOneTeamPlan && userRole !== "PRESIDENT" && userRole !== "DIRECTEUR_SPORTIF" && userRole !== "SECRETAIRE_GENERAL" && userRole !== "MANAGER_EVO_SPORTS") {
      const forbiddenRoles = ["ENTRAINEUR_ADJOINT", "SECRETAIRE_GENERAL", "ENTRAINEUR_GARDIENS", "PREPARATEUR_PHYSIQUE"]
      if (forbiddenRoles.includes(data.roleTag)) {
        throw new Error("Votre forfait '1 Équipe' ne permet pas d'avoir ce rôle dans le staff.")
      }

      if (data.roleTag === "ENTRAINEUR_PRINCIPAL") {
        const headCoachCount = await db.staff.count({
          where: {
            clubId: club.id,
            id: { not: staffId },
            user: {
              role: { name: "ENTRAINEUR_PRINCIPAL" }
            }
          }
        })
        if (headCoachCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet d'avoir qu'un seul Entraîneur Principal.")
        }
      }

      if (data.roleTag === "DIRECTEUR_SPORTIF") {
        const dirSportifCount = await db.staff.count({
          where: {
            clubId: club.id,
            id: { not: staffId },
            user: {
              role: { name: "DIRECTEUR_SPORTIF" }
            }
          }
        })
        if (dirSportifCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet d'avoir qu'un seul Directeur Sportif.")
        }
      }

      if (data.roleTag === "MEDECIN") {
        const medecinCount = await db.staff.count({
          where: {
            clubId: club.id,
            id: { not: staffId },
            user: {
              role: { name: "MEDECIN" }
            }
          }
        })
        if (medecinCount >= 1) {
          throw new Error("Votre forfait '1 Équipe' ne permet d'avoir qu'un seul Médecin du Club.")
        }
      }
    }

    if (userRole === "SECRETAIRE_GENERAL") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "SECRETAIRE_GENERAL" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à modifier ce rôle")
      }
      if (["PRESIDENT", "SECRETAIRE_GENERAL", "DIRECTEUR_SPORTIF"].includes(data.roleTag)) {
        throw new Error("Vous n'êtes pas autorisé à attribuer ce rôle")
      }
    }

    if (userRole === "DIRECTEUR_SPORTIF") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à modifier ce rôle")
      }
      if (["PRESIDENT", "DIRECTEUR_SPORTIF"].includes(data.roleTag)) {
        throw new Error("Vous n'êtes pas autorisé à attribuer ce rôle")
      }
    }

    if (data.roleTag === "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      throw new Error("Vous n'êtes pas autorisé à attribuer ce rôle")
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

    const emailNormalized = data.email.toLowerCase().trim()
    const existingUser = await db.user.findFirst({
      where: {
        email: emailNormalized,
        id: { not: staff.userId }
      }
    })
    if (existingUser) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }

    const existingDeleted = await db.deletedAccount.findFirst({
      where: { email: emailNormalized }
    })
    if (existingDeleted) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }

    const modifiedFieldsList: string[] = []
    if (staff.user?.name !== data.name) modifiedFieldsList.push("Nom")
    if (staff.user?.email !== emailNormalized) modifiedFieldsList.push("Email")
    if (staff.user?.phone !== data.phone) modifiedFieldsList.push("Téléphone")
    if (staff.user?.role?.name !== data.roleTag) modifiedFieldsList.push("Rôle")
    if (data.password) modifiedFieldsList.push("Mot de passe")
    const modifiedFieldsStr = modifiedFieldsList.join(", ") || "Informations du profil"

    const operatorNameWithRole = `${session.user.name || session.user.email || "Utilisateur"} (${userRole || "ADMIN"})`
    await db.user.update({
      where: { id: staff.userId },
      data: {
        name: data.name,
        email: emailNormalized,
        phone: data.phone,
        ...(data.password ? { password: data.password } : {}),
        roleId: staffRole?.id || null,
        modifiedBy: operatorNameWithRole,
        modifiedAt: new Date(),
        modifiedFields: modifiedFieldsStr
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

    await logAccountAction({
      actionType: "MODIFY",
      targetName: data.name,
      targetRole: data.roleTag,
      operatorName: session.user.name || session.user.email || "Utilisateur",
      operatorRole: userRole || "ADMIN",
      clubId: staff.clubId
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

    if (userRole === "DIRECTEUR_SPORTIF") {
      const targetRole = staff.user?.role?.name
      if (targetRole === "PRESIDENT" || targetRole === "DIRECTEUR_SPORTIF") {
        throw new Error("Vous n'êtes pas autorisé à bloquer ce rôle")
      }
    }

    const isBlockedNow = !staff.user.blocked
    const operatorNameWithRole = `${session.user.name || session.user.email || "Utilisateur"} (${userRole || "ADMIN"})`

    await db.user.update({
      where: { id: staff.userId },
      data: {
        blocked: isBlockedNow,
        blockedBy: isBlockedNow ? operatorNameWithRole : null,
        blockedAt: isBlockedNow ? new Date() : null
      }
    })

    await logAccountAction({
      actionType: isBlockedNow ? "BLOCK" : "UNBLOCK",
      targetName: staff.user?.name || "Membre du Staff",
      targetRole: staff.user?.role?.name || "STAFF",
      operatorName: session.user.name || session.user.email || "Utilisateur",
      operatorRole: userRole || "ADMIN",
      clubId: staff.clubId
    })

    revalidatePath("/dashboard/staff")
    return { success: true, blocked: isBlockedNow }
  } catch (e: any) {
    console.error("Error toggling block for staff member:", e)
    return { success: false, error: e.message || "Erreur lors du blocage" }
  }
}

export async function getAccountActionLogs() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    const ALLOWED_ROLES = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL"]
    if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
      throw new Error("Accès refusé")
    }

    // Find the club ID
    let club = await db.club.findUnique({
      where: { presidentId: userId }
    })

    if (!club) {
      const staffMember = await db.staff.findUnique({
        where: { userId },
        include: { club: true }
      })
      if (staffMember) {
        club = staffMember.club
      }
    }

    if (!club && userRole === "MANAGER_EVO_SPORTS") {
      club = await db.club.findFirst()
    }

    if (!club) {
      return { success: true, logs: [] }
    }

    const logs = await db.accountActionLog.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return { success: true, logs }
  } catch (err: any) {
    console.error("Error fetching logs:", err)
    return { success: false, error: err.message || "Erreur de chargement des journaux" }
  }
}


