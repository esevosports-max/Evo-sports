import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensurePlansSeeded } from "@/lib/seedPlans"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await ensurePlansSeeded()

    const plans = await db.subscriptionPlan.findMany({
      orderBy: { createdAt: "asc" }
    })

    const parsedPlans = plans.map((p) => {
      let featuresList: string[] = []
      if (p.featuresList) {
        if (typeof p.featuresList === "string") {
          try {
            const parsed = JSON.parse(p.featuresList)
            featuresList = Array.isArray(parsed) ? parsed : (typeof parsed === "string" ? JSON.parse(parsed) : [])
          } catch {
            featuresList = []
          }
        } else if (Array.isArray(p.featuresList)) {
          featuresList = p.featuresList as string[]
        }
      }

      let staffLimits: Record<string, number> = {}
      if (p.staffLimits) {
        if (typeof p.staffLimits === "string") {
          try {
            const parsed = JSON.parse(p.staffLimits)
            staffLimits = typeof parsed === "object" ? parsed : (typeof parsed === "string" ? JSON.parse(parsed) : {})
          } catch {
            staffLimits = {}
          }
        } else if (typeof p.staffLimits === "object" && p.staffLimits !== null) {
          staffLimits = p.staffLimits as Record<string, number>
        }
      }

      return {
        ...p,
        featuresList,
        staffLimits
      }
    })

    return NextResponse.json({ success: true, data: parsedPlans })
  } catch (error: any) {
    console.error("Error in GET /api/public/plans:", error)
    return NextResponse.json({ success: false, error: error.message || "Erreur interne" }, { status: 500 })
  }
}
