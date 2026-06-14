"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Helper to assert Manager access
async function assertManager() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error("Non autorisé : Session manquante")
  }
  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    throw new Error("Non autorisé : Rôle MANAGER_EVO_SPORTS requis")
  }
  return session.user
}

export async function getAnnouncements() {
  try {
    // If not authenticated, we don't throw error but return empty list to protect route if needed,
    // or let it check inside dashboard. Let's assert manager since this action is dashboard specific.
    await assertManager()

    let announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" }
    })

    // Seed default announcements if none exist
    if (announcements.length === 0) {
      const defaults = [
        {
          badgeText: "Sponsorisé",
          badgeStyle: "bg-blue-500/20 border-blue-500/35 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.25)]",
          icon: "⚡️",
          title: "EVO PREMIUM",
          titleStyle: "from-emerald-400 to-teal-400",
          description: "Optimisez la performance de votre club avec l'accès médecin pro et GPS en temps réel.",
          linkText: "Découvrir les Offres",
          linkUrl: "/pricing",
          mediaType: "video",
          mediaUrl: "https://player.vimeo.com/external/409224368.sd.mp4?s=d4f2bc181e18d6e326c7104b2bcf1b15c7e193fb&profile_id=165&oauth2_token_id=57447761",
          active: true
        },
        {
          badgeText: "Nouveauté",
          badgeStyle: "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]",
          icon: "📢",
          title: "DOSSIER MÉDICAL",
          titleStyle: "from-emerald-400 to-emerald-300",
          description: "Découvrez notre nouveau module de suivi médical et gardez vos joueurs au sommet de leur forme.",
          linkText: "Accéder au Dashboard",
          linkUrl: "/dashboard",
          mediaType: "image",
          mediaUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
          active: true
        },
        {
          badgeText: "Info Système",
          badgeStyle: "bg-amber-500/20 border-amber-500/35 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]",
          icon: "💬",
          title: "SUPPORT 24/7",
          titleStyle: "from-amber-400 to-orange-400",
          description: "Une question ou besoin d'assistance ? Notre support technique est disponible en continu pour votre club.",
          linkText: "Nous Contacter",
          linkUrl: "/contact",
          mediaType: "video",
          mediaUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f73b4d538e1bde334d588523558a&profile_id=139&oauth2_token_id=57447761",
          active: true
        }
      ]

      for (const item of defaults) {
        await db.announcement.create({ data: item })
      }

      announcements = await db.announcement.findMany({
        orderBy: { createdAt: "desc" }
      })
    }

    return { success: true, data: JSON.parse(JSON.stringify(announcements)) }
  } catch (error: any) {
    console.error("Error in getAnnouncements:", error)
    return { success: false, error: error.message || "Erreur inconnue" }
  }
}

export async function getVisibilitySetting() {
  try {
    let setting = await db.systemSetting.findUnique({
      where: { key: "HOMEPAGE_ANNOUNCEMENTS_VISIBLE" }
    })

    if (!setting) {
      setting = await db.systemSetting.create({
        data: { key: "HOMEPAGE_ANNOUNCEMENTS_VISIBLE", value: "true" }
      })
    }

    return { success: true, visible: setting.value === "true" }
  } catch (error: any) {
    console.error("Error in getVisibilitySetting:", error)
    return { success: false, error: error.message || "Erreur de configuration" }
  }
}

export async function toggleVisibility(visible: boolean) {
  try {
    await assertManager()

    await db.systemSetting.upsert({
      where: { key: "HOMEPAGE_ANNOUNCEMENTS_VISIBLE" },
      update: { value: visible ? "true" : "false" },
      create: { key: "HOMEPAGE_ANNOUNCEMENTS_VISIBLE", value: visible ? "true" : "false" }
    })

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("Error in toggleVisibility:", error)
    return { success: false, error: error.message || "Erreur de mise à jour" }
  }
}

export async function saveAnnouncement(data: {
  id?: string
  badgeText: string
  badgeStyle: string
  icon: string
  title: string
  titleStyle: string
  description: string
  linkText: string
  linkUrl: string
  mediaType: string
  mediaUrl: string
  active: boolean
  startDate?: string | null
  endDate?: string | null
}) {
  try {
    await assertManager()

    const announcementData = {
      badgeText: data.badgeText,
      badgeStyle: data.badgeStyle,
      icon: data.icon,
      title: data.title,
      titleStyle: data.titleStyle,
      description: data.description,
      linkText: data.linkText,
      linkUrl: data.linkUrl,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      active: data.active,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null
    }

    if (data.id) {
      await db.announcement.update({
        where: { id: data.id },
        data: announcementData
      })
    } else {
      await db.announcement.create({
        data: announcementData
      })
    }

    revalidatePath("/")
    revalidatePath("/dashboard/manager/annonces")
    return { success: true }
  } catch (error: any) {
    console.error("Error in saveAnnouncement:", error)
    return { success: false, error: error.message || "Erreur d'enregistrement" }
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await assertManager()

    await db.announcement.delete({
      where: { id }
    })

    revalidatePath("/")
    revalidatePath("/dashboard/manager/annonces")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteAnnouncement:", error)
    return { success: false, error: error.message || "Erreur de suppression" }
  }
}
