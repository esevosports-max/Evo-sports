import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import ManagerClubsClient from "@/components/ManagerClubsClient"
import { createPlanFeaturesSnapshot } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export default async function ManagerClubsPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  // Fetch all clubs with related teams, staff, and players
  const clubs = await db.club.findMany({
    include: {
      players: true,
      staff: true,
      categories: true,
    },
    orderBy: { name: "asc" },
  })

  // Format clubs with default values if subscription columns are empty
  const formattedClubs = clubs.map((c) => {
    const plan = c.subscriptionPlan || "Standard"
    const status = c.subscriptionStatus || "Actif"
    const expires = c.subscriptionExpires 
      ? c.subscriptionExpires.toISOString() 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const paid = c.subscriptionPaid !== null ? c.subscriptionPaid : true

    return {
      id: c.id,
      name: c.name,
      logo: c.logo,
      creationDate: c.creationDate.toISOString(),
      address: c.address,
      stadiumName: c.stadiumName,
      playersCount: c.players.length,
      staffCount: c.staff.length,
      teamsCount: c.categories.length,
      subscriptionPlan: plan,
      subscriptionStatus: status,
      subscriptionExpires: expires,
      subscriptionPaid: paid,
    }
  })

  // Server Action to update club details & subscription info
  async function updateClubDetailsAction(
    clubId: string, 
    name: string, 
    stadiumName: string, 
    address: string,
    subscriptionPlan: string,
    subscriptionStatus: string,
    subscriptionExpires: string,
    subscriptionPaid: boolean
  ) {
    "use server"
    const plan = await db.subscriptionPlan.findFirst({
      where: { name: subscriptionPlan }
    })
    const features = plan ? createPlanFeaturesSnapshot(plan) : null

    await db.club.update({
      where: { id: clubId },
      data: { 
        name, 
        stadiumName, 
        address,
        subscriptionPlan,
        subscriptionStatus,
        subscriptionExpires: new Date(subscriptionExpires),
        subscriptionPaid,
        subscriptionFeatures: (features as any) || undefined,
      },
    })
  }

  // Server Action to delete a club
  async function deleteClubAction(clubId: string) {
    "use server"
    await db.club.delete({
      where: { id: clubId },
    })
  }

  return (
    <ManagerClubsClient
      initialClubs={formattedClubs}
      updateClubDetailsAction={updateClubDetailsAction}
      deleteClubAction={deleteClubAction}
    />
  )
}
