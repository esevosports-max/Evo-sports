"use server"

import { db } from "@/lib/db"

export async function checkAccountStatusBeforeLogin(email: string) {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) return { status: "OK" }

    // 1. Check if email is in DeletedAccount (Trash Bin)
    const deletedRecord = await db.deletedAccount.findFirst({
      where: { email: trimmedEmail }
    })
    if (deletedRecord) {
      return {
        status: "DELETED",
        operatorName: deletedRecord.deletedBy,
        date: deletedRecord.deletedAt.toISOString()
      }
    }

    // 2. Check if the user is active but blocked
    const user = await db.user.findUnique({
      where: { email: trimmedEmail }
    })
    if (user && user.blocked) {
      return {
        status: "BLOCKED",
        operatorName: user.blockedBy || "Administrateur",
        date: user.blockedAt ? user.blockedAt.toISOString() : new Date().toISOString()
      }
    }

    return { status: "OK" }
  } catch (err) {
    console.error("Error in checkAccountStatusBeforeLogin:", err)
    return { status: "OK" }
  }
}
