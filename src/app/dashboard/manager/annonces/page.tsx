import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAnnouncements, getVisibilitySetting } from "./actions"
import ManagerAnnouncementsClient from "@/components/ManagerAnnouncementsClient"

export const dynamic = "force-dynamic"

export default async function ManagerAnnoncesPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  const announcementsResult = await getAnnouncements()
  const visibilityResult = await getVisibilitySetting()

  const initialAnnouncements = announcementsResult.success ? announcementsResult.data || [] : []
  const initialVisibility = visibilityResult.success ? visibilityResult.visible ?? true : true

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-zinc-200/50 bg-white p-6 md:p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
        <ManagerAnnouncementsClient
          initialAnnouncements={initialAnnouncements}
          initialVisibility={initialVisibility}
        />
      </div>
    </div>
  )
}
