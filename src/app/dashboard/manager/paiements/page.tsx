import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import ManagerPaymentsClient from "@/components/ManagerPaymentsClient"
import { createPlanFeaturesSnapshot } from "@/lib/subscription"

export const dynamic = "force-dynamic"

export default async function ManagerPaiementsPage() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const roleName = session.user.role?.name || ""
  if (roleName !== "MANAGER_EVO_SPORTS") {
    redirect("/dashboard")
  }

  // Fetch all clubs
  const clubs = await db.club.findMany({
    orderBy: { name: "asc" },
  })

  // Format clubs for billing component
  const formattedClubs = clubs.map((c) => ({
    id: c.id,
    name: c.name,
    creationDate: c.creationDate.toISOString(),
    subscriptionPlan: c.subscriptionPlan,
    subscriptionStatus: c.subscriptionStatus,
    subscriptionExpires: c.subscriptionExpires ? c.subscriptionExpires.toISOString() : null,
    subscriptionPaid: c.subscriptionPaid,
    subscriptionMethod: c.subscriptionMethod,
  }))

  // Fetch payment submissions
  const submissions = await db.paymentSubmission.findMany({
    orderBy: { createdAt: "desc" },
  })

  const formattedSubmissions = submissions.map((s) => ({
    id: s.id,
    clubId: s.clubId,
    clubName: s.clubName,
    plan: s.plan,
    duration: s.duration,
    amount: s.amount,
    method: s.method,
    attachment: s.attachment,
    status: s.status,
    rejectionReason: s.rejectionReason,
    createdAt: s.createdAt.toISOString(),
  }))

    // Server Action to update Billing status/plan/name/expiration/method
  async function updateClubBillingAction(
    clubId: string,
    data: {
      name: string
      subscriptionPlan: string
      subscriptionStatus: string
      subscriptionPaid: boolean
      subscriptionExpires: string | null
      subscriptionMethod: string | null
    }
  ) {
    "use server"
    const plan = await db.subscriptionPlan.findFirst({
      where: { name: data.subscriptionPlan }
    })
    const features = plan ? createPlanFeaturesSnapshot(plan) : null

    await db.club.update({
      where: { id: clubId },
      data: {
        name: data.name,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionPaid: data.subscriptionPaid,
        subscriptionExpires: data.subscriptionExpires ? new Date(data.subscriptionExpires) : null,
        subscriptionMethod: data.subscriptionMethod,
        subscriptionFeatures: (features as any) || undefined,
      }
    })
  }

  // Server Action to send notification to club president
  async function sendClubPresidentNotificationAction(
    clubId: string,
    title: string,
    message: string
  ) {
    "use server"
    const club = await db.club.findUnique({
      where: { id: clubId },
      select: { presidentId: true }
    })
    if (!club || !club.presidentId) {
      throw new Error("Président de club introuvable.")
    }
    await db.notification.create({
      data: {
        userId: club.presidentId,
        title,
        message,
        type: "SYSTEM",
      }
    })
  }

  // Server Action to block or unblock a club
  async function blockClubAction(clubId: string, block: boolean) {
    "use server"
    await db.club.update({
      where: { id: clubId },
      data: {
        subscriptionStatus: block ? "Bloqué" : "Actif",
      }
    })
  }

  // Server Action to delete a club
  async function deleteClubAction(clubId: string) {
    "use server"
    await db.club.delete({
      where: { id: clubId },
    })
  }

  // Server Action to approve a payment submission
  async function approvePaymentAction(submissionId: string) {
    "use server"
    const submission = await db.paymentSubmission.findUnique({
      where: { id: submissionId }
    })
    if (!submission || submission.status !== "PENDING") return

    const club = await db.club.findUnique({
      where: { id: submission.clubId }
    })

    const now = new Date()
    let baseDate = now
    if (club && club.subscriptionExpires && new Date(club.subscriptionExpires) > now) {
      baseDate = new Date(club.subscriptionExpires)
    }

    let expiresDate = new Date(baseDate)
    if (submission.duration === "YEARLY") {
      expiresDate.setFullYear(baseDate.getFullYear() + 1)
    } else {
      expiresDate.setMonth(baseDate.getMonth() + 1)
    }

    const plan = await db.subscriptionPlan.findFirst({
      where: { name: submission.plan }
    })
    const features = plan ? createPlanFeaturesSnapshot(plan) : null

    await db.$transaction([
      db.paymentSubmission.update({
        where: { id: submissionId },
        data: { status: "APPROVED" }
      }),
      db.club.update({
        where: { id: submission.clubId },
        data: {
          subscriptionPlan: submission.plan,
          subscriptionStatus: "Actif",
          subscriptionPaid: true,
          subscriptionExpires: expiresDate,
          subscriptionMethod: submission.method,
          subscriptionFeatures: (features as any) || undefined,
        }
      })
    ])
  }

  // Server Action to reject a payment submission with a reason
  async function rejectPaymentAction(submissionId: string, reason: string) {
    "use server"
    const submission = await db.paymentSubmission.findUnique({
      where: { id: submissionId }
    })
    if (!submission || submission.status !== "PENDING") return

    await db.$transaction([
      db.paymentSubmission.update({
        where: { id: submissionId },
        data: { 
          status: "REJECTED",
          rejectionReason: reason
        }
      }),
      db.club.update({
        where: { id: submission.clubId },
        data: {
          subscriptionStatus: "Bloqué",
          subscriptionPaid: false
        }
      })
    ])
  }

  return (
    <ManagerPaymentsClient
      initialClubs={formattedClubs}
      initialSubmissions={formattedSubmissions}
      updateClubBillingAction={updateClubBillingAction}
      blockClubAction={blockClubAction}
      deleteClubAction={deleteClubAction}
      approvePaymentAction={approvePaymentAction}
      rejectPaymentAction={rejectPaymentAction}
      sendClubPresidentNotificationAction={sendClubPresidentNotificationAction}
    />
  )
}
