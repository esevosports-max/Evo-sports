"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getClubIdForUser } from "../planning/actions"

// Retrieve recipient structures (teams/players and staff)
export async function getClubRecipientStructure() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, teams: [], staff: [] }
    }

    // Fetch team categories with players
    const dbCategories = await db.teamCategory.findMany({
      where: { clubId },
      orderBy: { name: "asc" },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Fetch staff
    const dbStaff = await db.staff.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: {
              select: {
                description: true
              }
            }
          }
        }
      }
    })

    const teams = dbCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      players: cat.players
        .filter(p => p.user)
        .map(p => ({
          userId: p.user.id,
          name: p.user.name || "Joueur"
        }))
    }))

    const staff = dbStaff
      .filter(s => s.user)
      .map(s => ({
        userId: s.user.id,
        name: s.user.name || "Membre Staff",
        role: s.title || s.user.role?.description || "Staff"
      }))

    return { success: true, teams, staff }
  } catch (error: any) {
    console.error("Error in getClubRecipientStructure:", error)
    return { success: false, error: error.message || "Erreur de chargement des structures" }
  }
}

// Get all polls targeting the user
export async function getPolls() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, polls: [] }
    }

    // Get user's category IDs
    let userTeamIds: string[] = []
    if (roleName === "JOUEUR") {
      const playerProfile = await db.player.findUnique({
        where: { userId },
        select: { teamCategoryId: true }
      })
      if (playerProfile?.teamCategoryId) {
        userTeamIds.push(playerProfile.teamCategoryId)
      }
    } else if (roleName !== "PRESIDENT" && roleName !== "MANAGER_EVO_SPORTS") {
      // Staff
      const staffProfile = await db.staff.findUnique({
        where: { userId },
        include: { categories: true }
      })
      if (staffProfile) {
        userTeamIds = staffProfile.categories.map(c => c.id)
      }
    }

    // Fetch all polls for this club
    const allPolls = await db.poll.findMany({
      where: { clubId },
      include: {
        options: {
          orderBy: { text: "asc" }
        },
        votes: true
      },
      orderBy: { createdAt: "desc" }
    })

    // Filter polls in JS based on role and target parameters
    const isPresidentOrManager = roleName === "PRESIDENT" || roleName === "MANAGER_EVO_SPORTS"

    const filteredPolls = allPolls.filter(poll => {
      // Presidents & Managers see everything (including SCHEDULED)
      if (isPresidentOrManager) return true

      // Non-presidents only see active or finished polls
      if (poll.status !== "ACTIVE" && poll.status !== "FINISHED") return false

      // Check specific user target first
      const targetUserIds = poll.targetUserIds as string[] | null
      if (targetUserIds && targetUserIds.length > 0) {
        return targetUserIds.includes(userId)
      }

      // Check role/team targeting
      const targetRoles = poll.targetRoles as string[] | null
      const targetTeams = poll.targetTeams as string[] | null

      let roleMatch = true
      if (targetRoles && targetRoles.length > 0) {
        roleMatch = targetRoles.includes(roleName)
      }

      let teamMatch = true
      if (targetTeams && targetTeams.length > 0) {
        teamMatch = userTeamIds.some(tid => targetTeams.includes(tid))
      }

      return roleMatch && teamMatch
    })

    // Format output with vote statistics and user vote status
    const formatted = filteredPolls.map(poll => {
      const userVote = poll.votes.find(v => v.userId === userId)
      const optionsWithVotes = poll.options.map(opt => {
        const optionVotes = poll.votes.filter(v => v.optionId === opt.id)
        return {
          id: opt.id,
          text: opt.text,
          votesCount: optionVotes.length,
          voters: optionVotes.map(v => ({
            userId: v.userId,
            userName: v.userName
          }))
        }
      })

      const totalVotesCount = poll.votes.length

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        status: poll.status,
        expiresAt: poll.expiresAt.toISOString(),
        createdAt: poll.createdAt.toISOString(),
        scheduledFor: poll.scheduledFor ? poll.scheduledFor.toISOString() : null,
        creatorId: poll.creatorId,
        creatorName: poll.creatorName,
        creatorRole: poll.creatorRole,
        voted: !!userVote,
        userVoteOptionId: userVote ? userVote.optionId : null,
        totalVotes: totalVotesCount,
        options: optionsWithVotes,
        allVotesList: poll.votes.map(v => ({
          userId: v.userId,
          userName: v.userName,
          choiceText: v.choiceText,
          createdAt: v.createdAt.toISOString()
        }))
      }
    })

    return { success: true, polls: formatted }
  } catch (error: any) {
    console.error("Error fetching polls:", error)
    return { success: false, error: error.message || "Erreur de chargement" }
  }
}

// Create a new poll
export async function createPoll(data: {
  title: string
  description?: string
  type: string
  options: string[]
  expiresAt: string // ISO date
  scheduledFor?: string | null // ISO date
  targetTeams?: string[] | null
  targetRoles?: string[] | null
  targetUserIds?: string[] | null
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userName = session.user.name || "Administrateur"
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      throw new Error("Club introuvable")
    }

    // Check permissions (PRESIDENT, DIRECTEUR_SPORTIF, ENTRAINEUR_PRINCIPAL)
    const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"]
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Vous n'avez pas la permission de créer un sondage")
    }

    const scheduledDate = data.scheduledFor ? new Date(data.scheduledFor) : null
    const isScheduled = scheduledDate && scheduledDate > new Date()
    const status = isScheduled ? "SCHEDULED" : "ACTIVE"

    const newPoll = await db.poll.create({
      data: {
        clubId,
        title: data.title,
        description: data.description,
        type: data.type,
        status,
        scheduledFor: scheduledDate,
        expiresAt: new Date(data.expiresAt),
        creatorId: userId,
        creatorName: userName,
        creatorRole: roleName,
        targetTeams: data.targetTeams ? data.targetTeams : undefined,
        targetRoles: data.targetRoles ? data.targetRoles : undefined,
        targetUserIds: data.targetUserIds ? data.targetUserIds : undefined,
        options: {
          create: data.options.map(text => ({ text }))
        }
      }
    })

    revalidatePath("/dashboard/sondage")
    return { success: true, pollId: newPoll.id }
  } catch (error: any) {
    console.error("Error creating poll:", error)
    return { success: false, error: error.message || "Erreur de création" }
  }
}

// Submit a vote
export async function submitVote(pollId: string, optionId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userName = session.user.name || "Anonyme"

    // Check if poll exists and is active
    const poll = await db.poll.findUnique({
      where: { id: pollId },
      include: { options: true }
    })

    if (!poll) {
      throw new Error("Sondage introuvable")
    }

    if (poll.status !== "ACTIVE") {
      throw new Error("Ce sondage n'est pas ouvert aux votes")
    }

    if (new Date() > new Date(poll.expiresAt)) {
      // Auto-expire
      await db.poll.update({
        where: { id: pollId },
        data: { status: "FINISHED" }
      })
      throw new Error("Ce sondage est expiré")
    }

    const option = poll.options.find(opt => opt.id === optionId)
    if (!option) {
      throw new Error("Option de vote introuvable")
    }

    // Register vote
    await db.pollVote.create({
      data: {
        pollId,
        optionId,
        userId,
        userName,
        choiceText: option.text
      }
    })

    revalidatePath("/dashboard/sondage")
    return { success: true }
  } catch (error: any) {
    console.error("Error submitting vote:", error)
    return { success: false, error: error.message || "Erreur de soumission du vote" }
  }
}

// Delete a poll
export async function deletePoll(pollId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""

    const poll = await db.poll.findUnique({
      where: { id: pollId }
    })

    if (!poll) {
      throw new Error("Sondage introuvable")
    }

    // Allow President, Manager or the creator to delete
    if (roleName !== "PRESIDENT" && roleName !== "MANAGER_EVO_SPORTS" && poll.creatorId !== userId) {
      throw new Error("Permission refusée")
    }

    await db.poll.delete({
      where: { id: pollId }
    })

    revalidatePath("/dashboard/sondage")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting poll:", error)
    return { success: false, error: error.message || "Erreur de suppression" }
  }
}
