import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getPresenceDataAction } from "./actions"
import PresenceClient from "@/components/PresenceClient"

export const dynamic = "force-dynamic"

export default async function PresencePage() {
  const session = await auth()
  if (!session || !session.user) {
    redirect("/login")
  }

  const userRole = session.user.role?.name || "JOUEUR"

  const allowedRoles = [
    "PRESIDENT",
    "DIRECTEUR_SPORTIF",
    "ENTRAINEUR_PRINCIPAL",
    "ENTRAINEUR_ADJOINT",
    "PREPARATEUR_PHYSIQUE",
    "ENTRAINEUR_GARDIENS",
    "MEDECIN",
    "JOUEUR",
    "MANAGER_EVO_SPORTS"
  ]
  if (!allowedRoles.includes(userRole)) {
    redirect("/dashboard")
  }

  // Load presence data
  const dataRes = await getPresenceDataAction()
  if (!dataRes.success) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 font-bold dark:border-zinc-800 dark:bg-zinc-900">
        Une erreur est survenue lors du chargement des données. Veuillez réessayer.
      </div>
    )
  }

  return (
    <PresenceClient
      initialPlayers={dataRes.players || []}
      initialEvents={dataRes.events || []}
      initialPresences={dataRes.presences || []}
      initialTeamCategories={dataRes.teamCategories || []}
      roleName={userRole}
    />
  )
}
