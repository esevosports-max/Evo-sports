"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getNotificationsAction() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id

    // Auto-delete notifications:
    // 1. Regular notifications (expiresAt is null) older than 24 hours.
    // 2. Convocation/custom notifications where the calculated expiresAt has passed.
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await db.notification.deleteMany({
      where: {
        OR: [
          {
            expiresAt: null,
            createdAt: { lt: cutoffTime }
          },
          {
            expiresAt: { lt: new Date() }
          }
        ]
      }
    })

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return { success: true, notifications }
  } catch (e: any) {
    console.error("Error fetching notifications:", e)
    return { success: false, error: e.message || "Erreur de chargement des notifications" }
  }
}

export async function markAsReadAction(notificationId: string) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    await db.notification.update({
      where: { id: notificationId, userId },
      data: { read: true }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (e: any) {
    console.error("Error marking notification as read:", e)
    return { success: false, error: e.message || "Erreur de mise à jour" }
  }
}

export async function markAllAsReadAction() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      throw new Error("Non autorisé")
    }

    const userId = session.user.id
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (e: any) {
    console.error("Error marking all notifications as read:", e)
    return { success: false, error: e.message || "Erreur de mise à jour" }
  }
}
