"use server"

import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function createPlayer(data: {
  name: string
  number: number
  position: string
  age: number
  height: string
  weight: string
  foot: string
  teamCategoryId: string
  email: string
  password: string
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    const ALLOWED_PLAYER_MANAGERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL"]
    if (!userRole || !ALLOWED_PLAYER_MANAGERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires autorisés")
    }

    // Find the club ID
    let club = await db.club.findUnique({
      where: { presidentId: userId }
    })

    if (!club && userRole === "MANAGER_EVO_SPORTS") {
      club = await db.club.findFirst()
    }

    if (!club) {
      throw new Error("Club introuvable")
    }

    if (!data.teamCategoryId) {
      throw new Error("La sélection d'une équipe est obligatoire.")
    }

    // Enforce limits
    const category = await db.teamCategory.findUnique({
      where: { id: data.teamCategoryId }
    })

    if (!category) {
      throw new Error("Équipe introuvable")
    }

    // Check current squad size
    const currentCount = await db.player.count({
      where: { teamCategoryId: data.teamCategoryId }
    })

    if (currentCount >= category.maxPlayers) {
      throw new Error(
        `Limite d'effectif atteinte pour cette équipe. Le forfait limite cette équipe à ${category.maxPlayers} joueurs maximum.`
      )
    }

    // Check if Jersey number is already taken in this team category
    const duplicateNumber = await db.player.findFirst({
      where: {
        teamCategoryId: data.teamCategoryId,
        number: data.number
      },
      include: {
        user: true
      }
    })

    if (duplicateNumber) {
      throw new Error(
        "Ce numéro est déjà choisi, veuillez le modifier."
      )
    }

    // Create a User record for the player
    let playerRole = await db.role.findUnique({
      where: { name: "JOUEUR" }
    })

    // Fallback if role is named differently or doesn't exist
    if (!playerRole) {
      playerRole = await db.role.findFirst({
        where: { name: { contains: "JOUEUR" } }
      })
    }

    if (!data.email || !data.password) {
      throw new Error("L'email et le mot de passe sont obligatoires.")
    }

    const emailNormalized = data.email.toLowerCase().trim()
    const existingUser = await db.user.findUnique({
      where: { email: emailNormalized }
    })

    if (existingUser) {
      throw new Error("Cette adresse email est déjà utilisée.")
    }

    const playerUser = await db.user.create({
      data: {
        name: data.name,
        email: emailNormalized,
        password: data.password,
        roleId: playerRole?.id || null
      }
    })

    // Create Player record
    await db.player.create({
      data: {
        userId: playerUser.id,
        clubId: club.id,
        position: data.position,
        number: data.number,
        teamCategoryId: data.teamCategoryId,
        age: data.age,
        height: data.height,
        weight: data.weight,
        foot: data.foot
      }
    })

    // Also seed some physical indices for stats
    // We will do this if needed, but just the player is fine for now

    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error creating player:", e)
    return { success: false, error: e.message || "Erreur de création du joueur" }
  }
}

export async function deletePlayer(playerId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }
    const userRole = session.user.role?.name
    const ALLOWED_PLAYER_MANAGERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL"]
    if (!userRole || !ALLOWED_PLAYER_MANAGERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires autorisés")
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { user: true }
    })

    if (!player) {
      throw new Error("Joueur introuvable")
    }

    // Delete the Player (Cascade will handle some, but let's delete User directly which cascades to Player)
    await db.user.delete({
      where: { id: player.userId }
    })

    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error deleting player:", e)
    return { success: false, error: e.message || "Erreur lors de la suppression" }
  }
}

export async function updatePlayer(data: {
  id: string
  name: string
  number: number
  position: string
  age: number
  height: string
  weight: string
  foot: string
  teamCategoryId: string
  email: string
  password?: string
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    const ALLOWED_PLAYER_MANAGERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL"]
    if (!userRole || !ALLOWED_PLAYER_MANAGERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires autorisés")
    }

    const player = await db.player.findUnique({
      where: { id: data.id },
      include: { user: true }
    })

    if (!player) {
      throw new Error("Joueur introuvable")
    }

    if (!data.teamCategoryId) {
      throw new Error("La sélection d'une équipe est obligatoire.")
    }

    // Check if Jersey number is already taken in this team category by someone else
    const duplicateNumber = await db.player.findFirst({
      where: {
        teamCategoryId: data.teamCategoryId,
        number: data.number,
        id: { not: data.id }
      }
    })

    if (duplicateNumber) {
      throw new Error("Ce numéro est déjà choisi par un autre joueur de cette équipe.")
    }

    // Check if email is already taken by someone else
    const emailNormalized = data.email.toLowerCase().trim()
    const existingUser = await db.user.findFirst({
      where: {
        email: emailNormalized,
        id: { not: player.userId }
      }
    })

    if (existingUser) {
      throw new Error("Cette adresse email est déjà utilisée par un autre compte.")
    }

    // Update User record
    const userUpdateData: any = {
      name: data.name,
      email: emailNormalized,
    }
    if (data.password && data.password.trim() !== "") {
      userUpdateData.password = data.password
    }

    await db.user.update({
      where: { id: player.userId },
      data: userUpdateData
    })

    // Update Player record
    await db.player.update({
      where: { id: data.id },
      data: {
        position: data.position,
        number: data.number,
        teamCategoryId: data.teamCategoryId,
        age: data.age,
        height: data.height,
        weight: data.weight,
        foot: data.foot
      }
    })

    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error updating player:", e)
    return { success: false, error: e.message || "Erreur lors de la mise à jour" }
  }
}

export async function toggleBlockPlayer(playerId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userRole = session.user.role?.name
    const ALLOWED_PLAYER_MANAGERS = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL"]
    if (!userRole || !ALLOWED_PLAYER_MANAGERS.includes(userRole)) {
      throw new Error("Action réservée aux gestionnaires autorisés")
    }

    const player = await db.player.findUnique({
      where: { id: playerId },
      include: { user: true }
    })

    if (!player || !player.user) {
      throw new Error("Joueur ou compte utilisateur introuvable")
    }

    // Toggle blocked status
    await db.user.update({
      where: { id: player.userId },
      data: {
        blocked: !player.user.blocked
      }
    })

    revalidatePath("/dashboard/effectifs")
    return { success: true }
  } catch (e: any) {
    console.error("Error toggling player block status:", e)
    return { success: false, error: e.message || "Erreur de changement de statut" }
  }
}
