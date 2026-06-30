import { initializeApp, getApps, cert } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"

const initFirebaseAdmin = () => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  
  let credential
  if (serviceAccountKey) {
    try {
      const parsed = JSON.parse(serviceAccountKey)
      credential = cert(parsed)
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string:", e)
    }
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    })
  }

  if (credential) {
    return initializeApp({
      credential,
    })
  }
  
  return null
}

const apps = getApps()
const app = apps.length > 0 ? apps[0] : initFirebaseAdmin()

export const messaging = app ? getMessaging(app) : null
