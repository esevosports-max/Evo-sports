"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getClubSubscriptionFeatures } from "@/lib/subscription"

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

    // Check subscription plan limits dynamically from snapshotted features or fallback
    const subPlan = await getClubSubscriptionFeatures(club)

    if (subPlan) {
      const existingCategoriesCount = await db.teamCategory.count({
        where: { clubId: club.id }
      })
      if (subPlan.maxTeams !== -1 && existingCategoriesCount >= subPlan.maxTeams) {
        throw new Error(`Votre forfait '${club.subscriptionPlan || "Club"}' ne vous permet de créer que ${subPlan.maxTeams} équipe(s).`)
      }
      if (subPlan.maxTeams === 1 && data.maxPlayers > 30) {
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

