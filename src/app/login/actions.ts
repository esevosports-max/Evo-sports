"use server"

import { db } from "@/lib/db"

export async function checkUserLoginStatus(email: string) {
  try {
    if (!email) return { status: "OK" }
    const emailNormalized = email.toLowerCase().trim()

    // 1. Check if the user is in the DeletedAccount table (soft-deleted)
    const deletedRecord = await db.deletedAccount.findFirst({
      where: { email: emailNormalized }
    })

    if (deletedRecord) {
      return {
        status: "DELETED",
        deletedBy: deletedRecord.deletedBy || "Un gestionnaire",
        deletedAt: deletedRecord.deletedAt ? deletedRecord.deletedAt.toISOString() : null,
      }
    }

    // 2. Check if the user is blocked in the active User table
    const activeUser = await db.user.findUnique({
      where: { email: emailNormalized },
      select: {
        blocked: true,
        blockedBy: true,
        blockedAt: true,
      }
    })

    if (activeUser && activeUser.blocked) {
      return {
        status: "BLOCKED",
        blockedBy: activeUser.blockedBy || "Un gestionnaire",
        blockedAt: activeUser.blockedAt ? activeUser.blockedAt.toISOString() : null,
      }
    }

    return { status: "OK" }
  } catch (err: any) {
    console.error("Error in checkUserLoginStatus:", err)
    return { status: "ERROR" }
  }
}
