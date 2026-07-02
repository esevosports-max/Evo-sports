import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getClubIdForUser } from "../planning/actions"
import WorkloadClient from "@/components/WorkloadClient"

export const dynamic = "force-dynamic"

export default async function WorkloadPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || "PRESIDENT"
  const userId = session.user.id

  // Access check: only President and Staff can access this page
  const allowedRoles = [
    "PRESIDENT", 
    "DIRECTEUR_SPORTIF", 
    "SECRETAIRE_GENERAL", 
    "ENTRAINEUR_PRINCIPAL", 
    "ENTRAINEUR_ADJOINT", 
    "PREPARATEUR_PHYSIQUE", 
    "ENTRAINEUR_GARDIENS", 
    "MEDECIN", 
    "MANAGER_EVO_SPORTS"
  ]
  
  if (!allowedRoles.includes(roleName)) {
    redirect("/dashboard")
  }

  let clubId = await getClubIdForUser(userId, roleName)
  if (!clubId) {
    redirect("/dashboard")
  }

  // Fetch all completed calendar events (MATCH and TRAINING)
  const completedEvents = await db.calendarEvent.findMany({
    where: {
      clubId,
      status: "TERMINE",
      type: { in: ["MATCH", "TRAINING"] }
    },
    orderBy: [
      { date: "desc" },
      { time: "desc" }
    ]
  })

  // Fetch all team categories for the club
  const teamCategories = await db.teamCategory.findMany({
    where: { clubId },
    orderBy: { name: "asc" }
  })

  return (
    <WorkloadClient
      initialEvents={JSON.parse(JSON.stringify(completedEvents))}
      teamCategories={JSON.parse(JSON.stringify(teamCategories))}
      roleName={roleName}
    />
  )
}
