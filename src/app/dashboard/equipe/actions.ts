"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateClubSettings(data: {
  name: string
  stadiumName: string
  stadiumCapacity: string
  address: string
  phone: string
  logo?: string | null
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF") {
      throw new Error("Action réservée au Président et au Directeur Sportif du club")
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

    if (!club) {
      throw new Error("Club introuvable")
    }

    // Update the ClubRegistrationRequest (linked to the president of the club)
    if (club.presidentId) {
      const request = await db.clubRegistrationRequest.findUnique({
        where: { userId: club.presidentId }
      })

      if (request) {
        await db.clubRegistrationRequest.update({
          where: { userId: club.presidentId },
          data: {
            clubName: data.name,
            stadiumName: data.stadiumName,
            address: data.address,
            phone: data.phone,
            ...(data.logo !== undefined ? { clubLogo: data.logo } : {})
          }
        })
      }
    }

    // Update the Club model
    await db.club.update({
      where: { id: club.id },
      data: {
        name: data.name,
        stadiumName: data.stadiumName,
        stadiumCapacity: data.stadiumCapacity,
        address: data.address,
        phone: data.phone,
        ...(data.logo !== undefined ? { logo: data.logo } : {})
      }
    })

    revalidatePath("/dashboard/equipe")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateClubSettings action:", error)
    return { success: false, error: error.message || "Une erreur est survenue" }
  }
}

function updatedRequestApproved(status?: string): boolean {
  return status === "APPROVED"
}

export async function createTeamCategory(data: {
  name: string
  league: string
  coach: string
  maxPlayers: number
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }
    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF") {
      throw new Error("Action réservée au Président et au Directeur Sportif du club")
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
    if (isOneTeamPlan) {
      const existingCategoriesCount = await db.teamCategory.count({
        where: { clubId: club.id }
      })
      if (existingCategoriesCount >= 1) {
        throw new Error("Votre forfait '1 Équipe' ne vous permet de créer qu'une seule équipe.")
      }
      if (data.maxPlayers > 30) {
        throw new Error("Le nombre maximum de joueurs par équipe est limité à 30 pour votre forfait.")
      }
    }

    await db.teamCategory.create({
      data: {
        clubId: club.id,
        name: data.name,
        league: data.league,
        coach: data.coach,
        maxPlayers: data.maxPlayers
      }
    })

    revalidatePath("/dashboard/equipe")
    return { success: true }
  } catch (e: any) {
    console.error("Error creating team category:", e)
    return { success: false, error: e.message || "Erreur de création" }
  }
}

export async function deleteTeamCategory(id: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }
    const userId = session.user.id
    const userRole = session.user.role?.name

    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS" && userRole !== "DIRECTEUR_SPORTIF") {
      throw new Error("Action réservée au Président et au Directeur Sportif du club")
    }

    await db.teamCategory.delete({
      where: { id }
    })

    revalidatePath("/dashboard/equipe")
    return { success: true }
  } catch (e: any) {
    console.error("Error deleting team category:", e)
    return { success: false, error: e.message || "Erreur de suppression" }
  }
}

