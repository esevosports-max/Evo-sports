import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { ensurePlansSeeded } from "@/lib/seedPlans"
import ManagerForfaitsClient from "@/components/ManagerForfaitsClient"

export const dynamic = "force-dynamic"

export default async function ManagerForfaitsPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  // Ensure plans are seeded
  await ensurePlansSeeded()

  // Fetch plans
  const plans = await db.subscriptionPlan.findMany({
    orderBy: { createdAt: "asc" },
  })

  // Format plans (serializing Dates and JSON objects if necessary)
  const formattedPlans = plans.map((p) => {
    let parsedFeatures: string[] = []
    if (p.featuresList) {
      if (typeof p.featuresList === "string") {
        try {
          const parsed = JSON.parse(p.featuresList)
          parsedFeatures = Array.isArray(parsed) ? parsed : (typeof parsed === "string" ? JSON.parse(parsed) : [])
        } catch {
          parsedFeatures = []
        }
      } else if (Array.isArray(p.featuresList)) {
        parsedFeatures = p.featuresList as string[]
      }
    }

    let parsedStaffLimits: Record<string, number> = {}
    if (p.staffLimits) {
      if (typeof p.staffLimits === "string") {
        try {
          const parsed = JSON.parse(p.staffLimits)
          parsedStaffLimits = typeof parsed === "object" ? parsed : (typeof parsed === "string" ? JSON.parse(parsed) : {})
        } catch {
          parsedStaffLimits = {}
        }
      } else if (typeof p.staffLimits === "object" && p.staffLimits !== null) {
        parsedStaffLimits = p.staffLimits as Record<string, number>
      }
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      durationYears: p.durationYears,
      durationMonths: p.durationMonths,
      durationDays: p.durationDays,
      durationHours: p.durationHours,
      durationMinutes: p.durationMinutes,
      durationSeconds: p.durationSeconds,
      billingPeriodType: p.billingPeriodType,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      paymentMethods: p.paymentMethods,
      maxTeams: p.maxTeams,
      staffLimits: parsedStaffLimits,
      hasDashboard: p.hasDashboard,
      hasPayment: p.hasPayment,
      hasPlanning: p.hasPlanning,
      hasMessaging: p.hasMessaging,
      hasPolls: p.hasPolls,
      hasStructure: p.hasStructure,
      hasStaff: p.hasStaff,
      hasPlayers: p.hasPlayers,
      hasTactical: p.hasTactical,
      hasTrainings: p.hasTrainings,
      hasMatches: p.hasMatches,
      hasInjuries: p.hasInjuries,
      hasMedical: p.hasMedical,
      hasTests: p.hasTests,
      hasWelfare: p.hasWelfare,
      hasGPS: p.hasGPS,
      hasRbac: p.hasRbac,
      hasSupport: p.hasSupport,
      featuresList: parsedFeatures,
      popular: p.popular,
      colorTheme: p.colorTheme,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ManagerForfaitsClient initialPlans={formattedPlans} />
    </div>
  )
}
