import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import ManagerRequestsList from "@/components/ManagerRequestsList"

export const dynamic = "force-dynamic"

export default async function ManagerDemandesPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  // Fetch all club registration requests
  const requests = await db.clubRegistrationRequest.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl border border-zinc-200/50 bg-white p-8 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
        <ManagerRequestsList initialRequests={JSON.parse(JSON.stringify(requests))} />
      </div>
    </div>
  )
}
