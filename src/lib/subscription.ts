import { db } from "@/lib/db"

export interface ClubSubscriptionFeatures {
  maxTeams: number
  staffLimits: Record<string, number> | null
  hasDashboard: boolean
  hasPayment: boolean
  hasPlanning: boolean
  hasMessaging: boolean
  hasPolls: boolean
  hasStructure: boolean
  hasStaff: boolean
  hasPlayers: boolean
  hasTactical: boolean
  hasTrainings: boolean
  hasMatches: boolean
  hasInjuries: boolean
  hasMedical: boolean
  hasTests: boolean
  hasWelfare: boolean
  hasGPS: boolean
  hasRbac: boolean
  hasSupport: boolean
}

export async function getClubSubscriptionFeatures(club: {
  id: string
  subscriptionPlan: string | null
  subscriptionFeatures: any
}): Promise<ClubSubscriptionFeatures> {
  // If the club has snapshotted features, use them
  if (club.subscriptionFeatures && typeof club.subscriptionFeatures === "object") {
    const f = club.subscriptionFeatures as any
    return {
      maxTeams: typeof f.maxTeams === "number" ? f.maxTeams : -1,
      staffLimits: f.staffLimits || null,
      hasDashboard: f.hasDashboard ?? true,
      hasPayment: f.hasPayment ?? true,
      hasPlanning: f.hasPlanning ?? true,
      hasMessaging: f.hasMessaging ?? true,
      hasPolls: f.hasPolls ?? true,
      hasStructure: f.hasStructure ?? true,
      hasStaff: f.hasStaff ?? true,
      hasPlayers: f.hasPlayers ?? true,
      hasTactical: f.hasTactical ?? true,
      hasTrainings: f.hasTrainings ?? true,
      hasMatches: f.hasMatches ?? true,
      hasInjuries: f.hasInjuries ?? true,
      hasMedical: f.hasMedical ?? true,
      hasTests: f.hasTests ?? true,
      hasWelfare: f.hasWelfare ?? true,
      hasGPS: f.hasGPS ?? false,
      hasRbac: f.hasRbac ?? true,
      hasSupport: f.hasSupport ?? true,
    }
  }

  // Fallback: Query the database for the active plan
  const planName = club.subscriptionPlan || "Club"
  const plan = await db.subscriptionPlan.findFirst({
    where: { name: planName }
  })

  if (plan) {
    const features: ClubSubscriptionFeatures = {
      maxTeams: plan.maxTeams,
      staffLimits: plan.staffLimits as Record<string, number> | null,
      hasDashboard: plan.hasDashboard,
      hasPayment: plan.hasPayment,
      hasPlanning: plan.hasPlanning,
      hasMessaging: plan.hasMessaging,
      hasPolls: plan.hasPolls,
      hasStructure: plan.hasStructure,
      hasStaff: plan.hasStaff,
      hasPlayers: plan.hasPlayers,
      hasTactical: plan.hasTactical,
      hasTrainings: plan.hasTrainings,
      hasMatches: plan.hasMatches,
      hasInjuries: plan.hasInjuries,
      hasMedical: plan.hasMedical,
      hasTests: plan.hasTests,
      hasWelfare: plan.hasWelfare,
      hasGPS: plan.hasGPS,
      hasRbac: plan.hasRbac,
      hasSupport: plan.hasSupport,
    }

    // Save the snapshot back to the database for this club on-the-fly, so subsequent checks are instant
    try {
      await db.club.update({
        where: { id: club.id },
        data: { subscriptionFeatures: features as any }
      })
    } catch (e) {
      console.error("Failed to snapshot subscription features on the fly:", e)
    }

    return features
  }

  // Final fallback (default unlimited/basic features)
  return {
    maxTeams: -1,
    staffLimits: null,
    hasDashboard: true,
    hasPayment: true,
    hasPlanning: true,
    hasMessaging: true,
    hasPolls: true,
    hasStructure: true,
    hasStaff: true,
    hasPlayers: true,
    hasTactical: true,
    hasTrainings: true,
    hasMatches: true,
    hasInjuries: true,
    hasMedical: true,
    hasTests: true,
    hasWelfare: true,
    hasGPS: false,
    hasRbac: true,
    hasSupport: true,
  }
}

export function createPlanFeaturesSnapshot(plan: {
  maxTeams: number
  staffLimits: any
  hasDashboard: boolean
  hasPayment: boolean
  hasPlanning: boolean
  hasMessaging: boolean
  hasPolls: boolean
  hasStructure: boolean
  hasStaff: boolean
  hasPlayers: boolean
  hasTactical: boolean
  hasTrainings: boolean
  hasMatches: boolean
  hasInjuries: boolean
  hasMedical: boolean
  hasTests: boolean
  hasWelfare: boolean
  hasGPS: boolean
  hasRbac: boolean
  hasSupport: boolean
}): ClubSubscriptionFeatures {
  return {
    maxTeams: plan.maxTeams,
    staffLimits: plan.staffLimits,
    hasDashboard: plan.hasDashboard,
    hasPayment: plan.hasPayment,
    hasPlanning: plan.hasPlanning,
    hasMessaging: plan.hasMessaging,
    hasPolls: plan.hasPolls,
    hasStructure: plan.hasStructure,
    hasStaff: plan.hasStaff,
    hasPlayers: plan.hasPlayers,
    hasTactical: plan.hasTactical,
    hasTrainings: plan.hasTrainings,
    hasMatches: plan.hasMatches,
    hasInjuries: plan.hasInjuries,
    hasMedical: plan.hasMedical,
    hasTests: plan.hasTests,
    hasWelfare: plan.hasWelfare,
    hasGPS: plan.hasGPS,
    hasRbac: plan.hasRbac,
    hasSupport: plan.hasSupport,
  }
}
