import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPolls, getClubRecipientStructure } from "./actions"
import SondageClient from "@/components/SondageClient"

export default async function SondagePage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const pollsRes = await getPolls()
  const recRes = await getClubRecipientStructure()

  const initialPolls = pollsRes.success ? pollsRes.polls || [] : []
  const recipientStructure = recRes.success
    ? { teams: recRes.teams || [], staff: recRes.staff || [] }
    : { teams: [], staff: [] }

  const userSession = {
    id: session.user.id,
    name: session.user.name || "Utilisateur",
    role: session.user.role?.name || "JOUEUR"
  }

  return (
    <SondageClient
      initialPolls={initialPolls}
      recipientStructure={recipientStructure}
      userSession={userSession}
    />
  )
}
