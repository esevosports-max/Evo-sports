import { db } from "@/lib/db"
import { messaging } from "./firebaseAdmin"

interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
}

/**
 * Sends a Firebase Cloud Messaging push notification to a list of users.
 * Automatically cleans up obsolete or invalid tokens.
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushPayload
) {
  if (!messaging) {
    console.warn("Skipping push notification: Firebase Admin SDK is not initialized.")
    return { success: false, error: "Firebase Admin not initialized" }
  }

  try {
    // Find all push tokens registered for the targeted users
    const tokenRecords = await db.pushToken.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        token: true,
        userId: true,
      },
    })

    const tokens = tokenRecords.map((r) => r.token)

    if (tokens.length === 0) {
      console.log("No registered push tokens found for users:", userIds)
      return { success: true, sentCount: 0 }
    }

    console.log(`Sending push notification to ${tokens.length} devices...`)

    // FCM multicast limit is 500 tokens per call
    const chunkSize = 500
    let successCount = 0
    let failureCount = 0
    const tokensToRemove: string[] = []

    for (let i = 0; i < tokens.length; i += chunkSize) {
      const chunk = tokens.slice(i, i + chunkSize)

      const response = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        android: {
          notification: {
            sound: "whistle",
            channelId: "whistle",
            clickAction: "FCM_PLUGIN_ACTIVITY", // Matches Capacitor native action
          },
        },
      })

      successCount += response.successCount
      failureCount += response.failureCount

      // Inspect responses to clean up expired/invalid tokens
      response.responses.forEach((res: any, idx: number) => {
        if (!res.success) {
          const error = res.error
          if (
            error?.code === "messaging/invalid-registration-token" ||
            error?.code === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(chunk[idx])
          }
        }
      })
    }

    // Clean up stale tokens from DB
    if (tokensToRemove.length > 0) {
      await db.pushToken.deleteMany({
        where: {
          token: { in: tokensToRemove },
        },
      })
      console.log(`Cleaned up ${tokensToRemove.length} inactive or invalid FCM tokens.`)
    }

    console.log(`Push notifications sent successfully. Success: ${successCount}, Failures: ${failureCount}`)
    return { success: true, sentCount: successCount, failedCount: failureCount }
  } catch (error: any) {
    console.error("Failed to send push notifications:", error)
    return { success: false, error: error.message }
  }
}
