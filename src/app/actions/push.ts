"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"

/**
 * Saves a user's FCM push token to the database.
 * If the token already exists, it is associated with the current user.
 */
export async function savePushToken(token: string, deviceType: string = "android") {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Non autorisé" }
    }

    const userId = session.user.id

    // Upsert the token to link it to this user
    await db.pushToken.upsert({
      where: { token },
      update: {
        userId,
        deviceType,
      },
      create: {
        token,
        userId,
        deviceType,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error in savePushToken:", error)
    return { success: false, error: error.message || "Erreur lors de l'enregistrement du jeton" }
  }
}

/**
 * Deletes a push token when the user logs out.
 */
export async function deletePushToken(token: string) {
  try {
    const session = await auth()
    if (!session || !session.user || !session.user.id) {
      return { success: false, error: "Non autorisé" }
    }

    await db.pushToken.deleteMany({
      where: {
        token,
        userId: session.user.id,
      },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Error in deletePushToken:", error)
    return { success: false, error: error.message }
  }
}
