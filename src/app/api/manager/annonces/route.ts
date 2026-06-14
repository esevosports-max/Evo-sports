import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = session.user.role?.name
    if (userRole !== "MANAGER_EVO_SPORTS") {
      return NextResponse.json({ error: "Non autorisé : Manager requis" }, { status: 403 })
    }

    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ success: true, data: announcements })
  } catch (error: any) {
    console.error("API Fetch Announcements error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
