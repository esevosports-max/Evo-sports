import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getClubIdForUser } from "../planning/actions"
import { getMatches } from "./actions"
import MatchClient from "@/components/MatchClient"

export const dynamic = "force-dynamic"

export default async function MatchPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const roleName = session.user.role?.name || "No Role"

  // Fetch Club details to get the custom club name
  let clubName = "EVO FC"
  try {
    const clubId = await getClubIdForUser(userId, roleName)
    if (clubId) {
      const club = await db.club.findUnique({
        where: { id: clubId }
      })
      if (club) {
        clubName = club.name
      } else {
        // Fallback: check if they have an active registration request
        const request = await db.clubRegistrationRequest.findUnique({
          where: { userId }
        })
        if (request) {
          clubName = request.clubName
        }
      }
    }
  } catch (error) {
    console.error("Error fetching club details in MatchPage:", error)
  }

  // Fetch matches from the database (also runs the 120-minute expiration check)
  const matchesResult = await getMatches()
  const initialMatches = matchesResult.success && matchesResult.matches ? matchesResult.matches : []

  // Fetch all compositions and players for the club's team categories
  let initialCompositions: any[] = []
  let clubPlayers: any[] = []
  try {
    const clubId = await getClubIdForUser(userId, roleName)
    if (clubId) {
      initialCompositions = await db.composition.findMany({
        where: {
          teamCategory: { clubId }
        },
        include: {
          teamCategory: true
        }
      })
      clubPlayers = await db.player.findMany({
        where: { clubId },
        include: {
          user: {
            select: { name: true }
          },
          teamCategory: true
        }
      })
    }
  } catch (error) {
    console.error("Error fetching compositions/players in MatchPage:", error)
  }

  return (
    <MatchClient
      initialMatches={initialMatches as any[]}
      roleName={roleName}
      clubName={clubName}
      initialCompositions={initialCompositions}
      clubPlayers={clubPlayers}
    />
  )
}
