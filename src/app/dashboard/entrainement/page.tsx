import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
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

  return (
    <EntrainementClient
      roleName={roleName}
      userName={userName}
      coachCategories={coachCategories}
    />
  )
}
