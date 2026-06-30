"use client"

import { useEffect } from "react"
import { savePushToken } from "@/app/actions/push"

export default function PushNotificationRegister() {
  useEffect(() => {
    // Only execute on client side
    if (typeof window === "undefined") return

    // Check if running inside Capacitor WebView
    const cap = (window as any).Capacitor
    if (!cap) {
      console.log("Push notifications skipped: Not running in a native app container.")
      return
    }

    const initPush = async () => {
      try {
        // Dynamically import Capacitor push-notifications to avoid Next.js SSR build errors
        const { PushNotifications } = await import("@capacitor/push-notifications")

        // 1. Check current permissions
        let permStatus = await PushNotifications.checkPermissions()
        console.log("Initial push notification permission status:", permStatus.receive)
        
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions()
        }

        if (permStatus.receive !== "granted") {
          console.warn("Push notification permission was not granted.")
          return
        }

        // 2. Register with FCM / APNS
        await PushNotifications.register()

        // 3. Listen for token registration success
        const registrationListener = await PushNotifications.addListener(
          "registration",
          async (token) => {
            console.log("FCM registration token successfully received:", token.value)
            const result = await savePushToken(token.value, cap.getPlatform())
            if (result.success) {
              console.log("FCM token registered in our database.")
            } else {
              console.error("Failed to save FCM token to database:", result.error)
            }
          }
        )

        // 4. Listen for token registration errors
        const errorListener = await PushNotifications.addListener(
          "registrationError",
          (error) => {
            console.error("FCM registration error:", error)
          }
        )

        // 5. Listen for incoming notifications when app is in the foreground
        const receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Push notification received in foreground:", notification)
            // You can implement custom in-app notifications/toasts here if desired
          }
        )

        // 6. Listen for tap/action performed on notification
        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("Push notification tapped by user:", action)
            const data = action.notification.data
            
            if (data && data.type === "chat" && data.channelId) {
              // Redirect the user directly to the message channel inside the webview
              window.location.href = `/dashboard/messagerie?channelId=${data.channelId}`
            }
          }
        )

        // Cleanup function for listeners
        return () => {
          registrationListener.remove()
          errorListener.remove()
          receivedListener.remove()
          actionListener.remove()
        }

      } catch (err) {
        console.error("Error setting up native push notifications:", err)
      }
    }

    initPush()
  }, [])

  return null
}
