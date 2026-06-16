import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getClubIdForUser } from "../planning/actions"
import EntrainementClient from "@/components/EntrainementClient"

export const dynamic = "force-dynamic"

export default async function EntrainementPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || "PRESIDENT"
  const userName = session.user.name || "madjid beghdadi"

  // Fetch coach's categories if they are a coach
  let coachCategories: string[] = []
  if (roleName === "ENTRAINEUR_PRINCIPAL" || roleName === "ENTRAINEUR_ADJOINT") {
    const staff = await db.staff.findUnique({
      where: { userId: session.user.id },
      include: { categories: true }
    })
    if (staff) {
      coachCategories = staff.categories.map(c => c.name)
    }
  }

  // Fetch real training events and category rosters
  let initialTrainings: any[] = []
  let clubRosters: Record<string, any[]> = {}
  let clubLogo: string | null = null
  let clubName: string = "EVO SPORTS"

  try {
    const clubId = await getClubIdForUser(session.user.id, roleName)
    if (clubId) {
      const club = await db.club.findUnique({
        where: { id: clubId },
        select: { logo: true, name: true }
      })
      if (club) {
        clubLogo = club.logo
        clubName = club.name
      }

      initialTrainings = await db.calendarEvent.findMany({
        where: {
          clubId,
          type: "TRAINING"
        },
        orderBy: [
          { date: "asc" },
          { time: "asc" }
        ]
      })

      // Fetch all team categories and their players
      const categories = await db.teamCategory.findMany({
        where: { clubId },
        include: {
          players: {
            include: {
              user: true
            }
          }
        }
      })

      for (const cat of categories) {
        clubRosters[cat.name] = cat.players.map(p => ({
          id: p.id,
          name: p.user.name || "Joueur sans nom",
          position: p.position || "Attaquant"
        }))
      }
    }
  } catch (error) {
    console.error("Error fetching training details:", error)
  }

  return (
    <EntrainementClient
      roleName={roleName}
      userName={userName}
      coachCategories={coachCategories}
      initialTrainings={JSON.parse(JSON.stringify(initialTrainings))}
      clubRosters={clubRosters}
      clubLogo={clubLogo}
      clubName={clubName}
    />
  )
}
