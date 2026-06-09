import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getChannels, getRecipientStructure } from "./actions"
import MessagerieClient from "@/components/MessagerieClient"

export default async function MessageriePage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const channelsRes = await getChannels()
  const recRes = await getRecipientStructure()

  const initialChannels = channelsRes.success ? channelsRes.channels || [] : []
  const recipientStructure = recRes.success
    ? { teams: recRes.teams || [], staff: recRes.staff || [] }
    : { teams: [], staff: [] }

  const userSession = {
    id: session.user.id,
    name: session.user.name || "Utilisateur",
    role: session.user.role?.name || "JOUEUR"
  }

  return (
    <MessagerieClient
      initialChannels={initialChannels}
      recipientStructure={recipientStructure}
      userSession={userSession}
    />
  )
}
