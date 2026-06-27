import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import ManagerDeletedAccountsClient from "@/components/ManagerDeletedAccountsClient"

export const dynamic = "force-dynamic"

export default async function ComptesSupprimesPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  // Automatically purge accounts deleted more than 30 days ago
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  try {
    await db.deletedAccount.deleteMany({
      where: {
        deletedAt: {
          lt: thirtyDaysAgo
        }
      }
    })
  } catch (error) {
    console.error("Failed to auto-purge accounts older than 30 days:", error)
  }

  // Fetch deleted accounts
  const deletedAccounts = await db.deletedAccount.findMany({
    orderBy: { deletedAt: "desc" }
  })

  // Fetch all clubs to map clubId -> clubName
  const clubs = await db.club.findMany({
    select: { id: true, name: true }
  })

  const clubMap = new Map(clubs.map((c) => [c.id, c.name]))

  const formattedAccounts = deletedAccounts.map((account) => ({
    id: account.id,
    userId: account.userId,
    name: account.name,
    email: account.email,
    phone: account.phone,
    roleTag: account.roleTag,
    clubId: account.clubId,
    clubName: clubMap.get(account.clubId) || "Club Inconnu",
    deletedBy: account.deletedBy,
    deletedAt: account.deletedAt.toISOString(),
  }))

  return (
    <ManagerDeletedAccountsClient accounts={formattedAccounts} />
  )
}
