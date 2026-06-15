"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getClubIdForUser } from "../planning/actions"

// Helper to seed default channels for a club
async function seedDefaultChannels(clubId: string) {
  const defaults = [
    {
      name: "# général",
      description: "Canal public pour tous les membres du club",
      isPrivate: false,
      isCustom: false,
      canReply: true,
      creatorId: "SYSTEM",
      creatorName: "Système"
    },
    {
      name: "# staff-technique",
      description: "Réservé aux dirigeants et au staff technique",
      isPrivate: true,
      isCustom: false,
      canReply: true,
      creatorId: "SYSTEM",
      creatorName: "Système",
      targetRoles: [
        "PRESIDENT",
        "MANAGER_EVO_SPORTS",
        "DIRECTEUR_SPORTIF",
        "SECRETAIRE_GENERAL",
        "ENTRAINEUR_PRINCIPAL",
        "ENTRAINEUR_ADJOINT",
        "PREPARATEUR_PHYSIQUE",
        "ENTRAINEUR_GARDIENS",
        "MEDECIN"
      ]
    },
    {
      name: "# joueurs",
      description: "Canal d'échange entre les entraîneurs et les joueurs",
      isPrivate: true,
      isCustom: false,
      canReply: true,
      creatorId: "SYSTEM",
      creatorName: "Système",
      targetRoles: [
        "PRESIDENT",
        "MANAGER_EVO_SPORTS",
        "DIRECTEUR_SPORTIF",
        "ENTRAINEUR_PRINCIPAL",
        "ENTRAINEUR_ADJOINT",
        "JOUEUR"
      ]
    }
  ]

  for (const def of defaults) {
    await db.chatChannel.create({
      data: {
        clubId,
        name: def.name,
        description: def.description,
        isPrivate: def.isPrivate,
        isCustom: def.isCustom,
        canReply: def.canReply,
        creatorId: def.creatorId,
        creatorName: def.creatorName,
        targetRoles: def.targetRoles ? def.targetRoles : undefined
      }
    })
  }
}

// Get all accessible channels for the user
export async function getChannels() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || ""
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, channels: [] }
    }

    // Check if channels exist, if not, seed defaults
    const count = await db.chatChannel.count({ where: { clubId } })
    if (count === 0) {
      await seedDefaultChannels(clubId)
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

    // Fetch all channels
    const allChannels = await db.chatChannel.findMany({
      where: { clubId },
      include: {
        messages: {
          select: {
            id: true,
            createdAt: true,
            views: {
              where: { userId }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    const isPresidentOrManager = roleName === "PRESIDENT" || roleName === "MANAGER_EVO_SPORTS"

    // Filter accessible channels in JS
    const accessible = allChannels.filter(channel => {
      // Creator sees their own
      if (channel.creatorId === userId) return true
      // President and SuperAdmin see everything
      if (isPresidentOrManager) return true

      // If standard public channel
      if (!channel.isPrivate && !channel.isCustom) return true

      // If custom target list
      if (channel.isCustom) {
        const targetUserIds = channel.targetUserIds as string[] | null
        if (targetUserIds && targetUserIds.includes(userId)) return true

        const targetRoles = channel.targetRoles as string[] | null
        const targetTeams = channel.targetTeams as string[] | null

        let roleMatch = true
        if (targetRoles && targetRoles.length > 0) {
          roleMatch = targetRoles.includes(roleName)
        }

        let teamMatch = true
        if (targetTeams && targetTeams.length > 0) {
          teamMatch = userTeamIds.some(tid => targetTeams.includes(tid))
        }

        if (targetRoles || targetTeams) {
          return roleMatch && teamMatch
        }

        return false
      }

      // If private standard channel
      if (channel.isPrivate) {
        const targetRoles = channel.targetRoles as string[] | null
        if (targetRoles && targetRoles.includes(roleName)) return true
      }

      return false
    })

    // Format output
    const formatted = accessible.map(c => {
      const unreadCount = c.messages.filter(m => m.senderId !== userId && !m.views.some(v => v.userId === userId)).length

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        isPrivate: c.isPrivate,
        isCustom: c.isCustom,
        canReply: c.canReply,
        creatorId: c.creatorId,
        creatorName: c.creatorName,
        totalMessages,
        unreadCount
      }
    })

    return { success: true, channels: formatted }
  } catch (error: any) {
    console.error("Error in getChannels:", error)
    return { success: false, error: error.message || "Erreur de chargement des canaux" }
  }
}

// Get messages for a channel
export async function getChannelMessages(channelId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userName = session.user.name || "Utilisateur"
    const userRole = session.user.role?.name || "JOUEUR"

    // Fetch messages
    const messages = await db.chatMessage.findMany({
      where: { channelId },
      include: {
        views: {
          select: {
            userId: true,
            userName: true,
            userRole: true,
            viewedAt: true
          }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    // Automatically mark all messages as read for this user
    const unreadMessages = messages.filter(m => m.senderId !== userId && !m.views.some(v => v.userId === userId))
    for (const msg of unreadMessages) {
      try {
        await db.chatMessageView.create({
          data: {
            messageId: msg.id,
            userId,
            userName,
            userRole
          }
        })
      } catch (err) {
        // Skip duplicate unique constraint error if it occurs concurrently
      }
    }

    const formatted = messages.map(m => {
      const hasVoted = m.views.some(v => v.userId === userId)
      return {
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole,
        senderClubName: m.senderClubName,
        senderClubLogo: m.senderClubLogo,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        views: m.views.map(v => ({
          userId: v.userId,
          userName: v.userName,
          userRole: v.userRole,
          viewedAt: v.viewedAt.toISOString()
        }))
      }
    })

    return { success: true, messages: formatted }
  } catch (error: any) {
    console.error("Error in getChannelMessages:", error)
    return { success: false, error: error.message || "Erreur de chargement des messages" }
  }
}

// Send a message
export async function sendMessage(channelId: string, content: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userName = session.user.name || "Utilisateur"
    const roleName = session.user.role?.name || "JOUEUR"
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      throw new Error("Club introuvable")
    }

    const channel = await db.chatChannel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      throw new Error("Canal introuvable")
    }

    // Check if channel is read-only for recipients
    if (!channel.canReply && channel.creatorId !== userId) {
      throw new Error("Ce canal n'autorise pas les réponses des destinataires")
    }

    // Get club name & logo
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { name: true, logo: true }
    })

    const senderClubName = club?.name || "EVO SPORTS"
    const senderClubLogo = club?.logo || null

    // Create message
    const message = await db.chatMessage.create({
      data: {
        channelId,
        senderId: userId,
        senderName: userName,
        senderRole: roleName,
        senderClubName,
        senderClubLogo,
        content
      }
    })



    revalidatePath("/dashboard/messagerie")
    return { success: true }
  } catch (error: any) {
    console.error("Error in sendMessage:", error)
    return { success: false, error: error.message || "Erreur d'envoi du message" }
  }
}

// Create a custom broadcast/chat channel
export async function createCustomChannel(data: {
  name: string
  description?: string
  canReply: boolean
  targetTeams?: string[] | null
  targetRoles?: string[] | null
  targetUserIds?: string[] | null
  initialMessage?: string
}) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const userName = session.user.name || "Administrateur"
    const roleName = session.user.role?.name || "JOUEUR"
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      throw new Error("Club introuvable")
    }

    // Only allowed for PRESIDENT, DIRECTEUR_SPORTIF, SECRETAIRE_GENERAL, ENTRAINEUR_PRINCIPAL
    const allowedRoles = ["PRESIDENT", "MANAGER_EVO_SPORTS", "DIRECTEUR_SPORTIF", "SECRETAIRE_GENERAL", "ENTRAINEUR_PRINCIPAL", "ENTRAINEUR_ADJOINT"]
    if (!allowedRoles.includes(roleName)) {
      throw new Error("Vous n'avez pas l'autorisation de créer une diffusion")
    }

    const newChannel = await db.chatChannel.create({
      data: {
        clubId,
        name: data.name.startsWith("#") ? data.name : `# ${data.name}`,
        description: data.description,
        isPrivate: true,
        isCustom: true,
        canReply: data.canReply,
        creatorId: userId,
        creatorName: userName,
        targetTeams: data.targetTeams ? data.targetTeams : undefined,
        targetRoles: data.targetRoles ? data.targetRoles : undefined,
        targetUserIds: data.targetUserIds ? data.targetUserIds : undefined
      }
    })

    // Send initial message if provided
    if (data.initialMessage && data.initialMessage.trim()) {
      const club = await db.club.findUnique({
        where: { id: clubId },
        select: { name: true, logo: true }
      })

      const msg = await db.chatMessage.create({
        data: {
          channelId: newChannel.id,
          senderId: userId,
          senderName: userName,
          senderRole: roleName,
          senderClubName: club?.name || "EVO SPORTS",
          senderClubLogo: club?.logo || null,
          content: data.initialMessage
        }
      })


    }

    revalidatePath("/dashboard/messagerie")
    return { success: true, channelId: newChannel.id }
  } catch (error: any) {
    console.error("Error in createCustomChannel:", error)
    return { success: false, error: error.message || "Erreur de création du canal" }
  }
}

// Get the full recipients targeted by a channel
export async function getChannelRecipients(channelId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    const roleName = session.user.role?.name || "JOUEUR"
    const clubId = await getClubIdForUser(userId, roleName)

    if (!clubId) {
      return { success: true, recipients: [] }
    }

    const channel = await db.chatChannel.findUnique({
      where: { id: channelId }
    })

    if (!channel) {
      throw new Error("Canal introuvable")
    }

    // Resolve targeted users based on filters
    const targetUserIds = channel.targetUserIds as string[] | null
    const targetTeams = channel.targetTeams as string[] | null
    const targetRoles = channel.targetRoles as string[] | null

    let players: any[] = []
    let staff: any[] = []

    if (!channel.isCustom && !channel.isPrivate) {
      // Standard public: everyone
      players = await db.player.findMany({
        where: { clubId },
        include: { user: true }
      })
      staff = await db.staff.findMany({
        where: { clubId },
        include: { user: true }
      })
    } else {
      // Filtered
      if (targetUserIds && targetUserIds.length > 0) {
        const matchingPlayers = await db.player.findMany({
          where: { clubId, userId: { in: targetUserIds } },
          include: { user: true }
        })
        const matchingStaff = await db.staff.findMany({
          where: { clubId, userId: { in: targetUserIds } },
          include: { user: true }
        })
        players = matchingPlayers
        staff = matchingStaff
      } else {
        // Query by teams and roles
        let teamFilter = {}
        if (targetTeams && targetTeams.length > 0) {
          teamFilter = { teamCategoryId: { in: targetTeams } }
        }

        players = await db.player.findMany({
          where: { clubId, ...teamFilter },
          include: { user: true }
        })

        // Staff roles
        let staffFilter = {}
        if (targetRoles && targetRoles.length > 0) {
          // staff has title or user.role
        }
        
        staff = await db.staff.findMany({
          where: { clubId },
          include: { user: { include: { role: true } } }
        })

        if (targetRoles && targetRoles.length > 0) {
          staff = staff.filter(s => s.user?.role && targetRoles.includes(s.user.role.name))
        }
      }
    }

    const list = [
      ...players.filter(p => p.user).map(p => ({
        name: p.user.name || "Joueur",
        role: "Joueur"
      })),
      ...staff.filter(s => s.user).map(s => ({
        name: s.user.name || "Membre Staff",
        role: s.title || "Staff"
      }))
    ]

    // Append President
    const president = await db.user.findFirst({
      where: {
        club: { id: clubId },
        role: { name: "PRESIDENT" }
      }
    })
    if (president && !list.some(l => l.name === president.name)) {
      list.push({
        name: president.name || "Président",
        role: "Le Président de club"
      })
    }

    return { success: true, recipients: list }
  } catch (error: any) {
    console.error("Error in getChannelRecipients:", error)
    return { success: false, error: error.message || "Erreur de chargement des destinataires" }
  }
}

export async function getRecipientStructure() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }
    const userId = session.user.id
    const roleName = session.user.role?.name || "JOUEUR"
    const clubId = await getClubIdForUser(userId, roleName)
    if (!clubId) {
      return { success: true, teams: [], staff: [] }
    }

    // Fetch teams and their players
    const teams = await db.teamCategory.findMany({
      where: { clubId },
      include: {
        players: {
          include: {
            user: true
          }
        }
      }
    })

    // Fetch staff
    const staff = await db.staff.findMany({
      where: { clubId },
      include: {
        user: {
          include: {
            role: true
          }
        }
      }
    })

    // Format teams
    const formattedTeams = teams.map(t => ({
      id: t.id,
      name: t.name,
      players: t.players.filter(p => p.user).map(p => ({
        userId: p.userId,
        name: p.user.name || "Joueur"
      }))
    }))

    // Format staff
    const formattedStaff = staff.filter(s => s.user).map(s => ({
      userId: s.userId,
      name: s.user.name || "Membre Staff",
      role: s.title || s.user.role?.name || "Staff"
    }))

    // Fetch club's president
    const club = await db.club.findUnique({
      where: { id: clubId },
      include: {
        president: {
          include: {
            role: true
          }
        }
      }
    })

    if (club?.president) {
      formattedStaff.unshift({
        userId: club.president.id,
        name: club.president.name || "Le Président",
        role: "Président"
      })
    }

    return { success: true, teams: formattedTeams, staff: formattedStaff }
  } catch (e: any) {
    console.error("Error in getRecipientStructure:", e)
    return { success: false, error: e.message || "Erreur structure destinataires" }
  }
}
