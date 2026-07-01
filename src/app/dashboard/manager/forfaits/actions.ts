"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ensurePlansSeeded } from "@/lib/seedPlans"
import { revalidatePath } from "next/cache"

async function assertManager() {
  const session = await auth()
  if (!session || !session.user) {
    throw new Error("Non autorisé : Session manquante")
  }
  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    throw new Error("Non autorisé : Rôle MANAGER_EVO_SPORTS requis")
  }
  return session.user
}

export async function getPlansAction() {
  try {
    await assertManager()
    await ensurePlansSeeded()

    const plans = await db.subscriptionPlan.findMany({
      orderBy: { createdAt: "asc" }
    })

    return { success: true, data: JSON.parse(JSON.stringify(plans)) }
  } catch (error: any) {
    console.error("Error in getPlansAction:", error)
    return { success: false, error: error.message || "Erreur lors de la récupération" }
  }
}

export async function savePlanAction(data: {
  id?: string
  name: string
  description?: string | null
  type: string
  durationYears: number
  durationMonths: number
  durationDays: number
  durationHours: number
  durationMinutes: number
  durationSeconds: number
  billingPeriodType: string
  priceMonthly: number
  priceYearly: number
  paymentMethods: string
  maxTeams: number
  staffLimits: Record<string, number>
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
  featuresList: string[]
  popular: boolean
  colorTheme: string
}) {
  try {
    await assertManager()

    const planData = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      type: data.type,
      durationYears: Number(data.durationYears) || 0,
      durationMonths: Number(data.durationMonths) || 0,
      durationDays: Number(data.durationDays) || 0,
      durationHours: Number(data.durationHours) || 0,
      durationMinutes: Number(data.durationMinutes) || 0,
      durationSeconds: Number(data.durationSeconds) || 0,
      billingPeriodType: data.billingPeriodType,
      priceMonthly: Number(data.priceMonthly) || 0,
      priceYearly: Number(data.priceYearly) || 0,
      paymentMethods: data.paymentMethods.trim(),
      maxTeams: Number(data.maxTeams),
      staffLimits: data.staffLimits,
      hasDashboard: data.hasDashboard,
      hasPayment: data.hasPayment,
      hasPlanning: data.hasPlanning,
      hasMessaging: data.hasMessaging,
      hasPolls: data.hasPolls,
      hasStructure: data.hasStructure,
      hasStaff: data.hasStaff,
      hasPlayers: data.hasPlayers,
      hasTactical: data.hasTactical,
      hasTrainings: data.hasTrainings,
      hasMatches: data.hasMatches,
      hasInjuries: data.hasInjuries,
      hasMedical: data.hasMedical,
      hasTests: data.hasTests,
      hasWelfare: data.hasWelfare,
      hasGPS: data.hasGPS,
      hasRbac: data.hasRbac,
      hasSupport: data.hasSupport,
      featuresList: data.featuresList,
      popular: data.popular,
      colorTheme: data.colorTheme,
    }

    if (!planData.name) {
      throw new Error("Le nom du forfait est requis.")
    }

    if (data.id) {
      await db.subscriptionPlan.update({
        where: { id: data.id },
        data: planData,
      })
    } else {
      await db.subscriptionPlan.create({
        data: planData,
      })
    }

    revalidatePath("/pricing")
    revalidatePath("/dashboard/manager/forfaits")
    return { success: true }
  } catch (error: any) {
    console.error("Error in savePlanAction:", error)
    return { success: false, error: error.message || "Erreur d'enregistrement" }
  }
}

export async function deletePlanAction(id: string) {
  try {
    await assertManager()

    await db.subscriptionPlan.delete({
      where: { id },
    })

    revalidatePath("/pricing")
    revalidatePath("/dashboard/manager/forfaits")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deletePlanAction:", error)
    return { success: false, error: error.message || "Erreur de suppression" }
  }
}
