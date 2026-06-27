import { db } from "@/lib/db"

export async function logAccountAction(params: {
  actionType: "BLOCK" | "UNBLOCK" | "DELETE" | "MODIFY" | "CREATE"
  targetName: string
  targetRole: string
  operatorName: string
  operatorRole: string
  clubId: string
}) {
  try {
    await db.accountActionLog.create({
      data: {
        actionType: params.actionType,
        targetName: params.targetName,
        targetRole: params.targetRole,
        operatorName: params.operatorName,
        operatorRole: params.operatorRole,
        clubId: params.clubId,
      }
    })
  } catch (err) {
    console.error("Failed to log account action:", err)
  }
}
