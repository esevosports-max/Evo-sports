import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PlanningCalendarClient from "@/components/PlanningCalendarClient"

export const dynamic = "force-dynamic"

export default async function PlanningPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  const userName = session.user.name || "Utilisateur"

  return (
    <PlanningCalendarClient
      roleName={roleName}
      userName={userName}
    />
  )
}
