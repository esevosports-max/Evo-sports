import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  "1 Équipe": { monthly: 10000, yearly: 100000 },
  "Club": { monthly: 15000, yearly: 144000 },
  "Professionnel": { monthly: 20000, yearly: 192000 },
  "Elite": { monthly: 25000, yearly: 240000 },
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || !session.user || session.user.role?.name !== "PRESIDENT") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  try {
    const club = await db.club.findUnique({
      where: { presidentId: session.user.id }
    })

    if (!club) {
      return NextResponse.json({ error: "Club non trouvé. Veuillez d'abord compléter l'inscription." }, { status: 404 })
    }

    const body = await req.json()
    const { method } = body

    if (method === "SERIAL") {
      const { code, identifier } = body
      if (!code || !identifier) {
        return NextResponse.json({ error: "Veuillez fournir le code de 16 chiffres et l'identifiant de 6 caractères." }, { status: 400 })
      }

      // Format validation
      if (code.length !== 16 || identifier.length !== 6) {
        return NextResponse.json({ error: "Format invalide. Le code doit faire 16 chiffres et l'identifiant 6 caractères." }, { status: 400 })
      }

      // Check serial code in DB
      const serial = await db.serialCode.findFirst({
        where: {
          code,
          identifier,
          used: false
        }
      })

      if (!serial) {
        return NextResponse.json({ error: "Code d'activation invalide ou déjà utilisé." }, { status: 400 })
      }

      // Activate immediately
      const now = new Date()
      let expiresDate = new Date()
      if (serial.duration === "YEARLY") {
        expiresDate.setFullYear(now.getFullYear() + 1)
      } else {
        expiresDate.setMonth(now.getMonth() + 1)
      }

      // Start transaction to update both
      await db.$transaction([
        db.serialCode.update({
          where: { id: serial.id },
          data: {
            used: true,
            usedByClubId: club.id
          }
        }),
        db.club.update({
          where: { id: club.id },
          data: {
            subscriptionPlan: serial.plan,
            subscriptionStatus: "Actif",
            subscriptionPaid: true,
            subscriptionExpires: expiresDate,
            subscriptionMethod: "SERIAL"
          }
        })
      ])

      return NextResponse.json({ success: true, message: `Abonnement '${serial.plan}' activé avec succès !` })
    }

    if (method === "BARIDIMOB" || method === "CHEQUE") {
      const { plan, duration, amount, attachment } = body
      if (!plan || !duration || !amount || !attachment) {
        return NextResponse.json({ error: "Tous les champs requis pour le paiement sont obligatoires." }, { status: 400 })
      }

      // Create a payment submission
      const submission = await db.paymentSubmission.create({
        data: {
          clubId: club.id,
          clubName: club.name,
          plan,
          duration,
          amount: parseFloat(amount),
          method,
          attachment,
          status: "PENDING"
        }
      })

      // Put the club subscription status as EnAttente
      await db.club.update({
        where: { id: club.id },
        data: {
          subscriptionPlan: plan,
          subscriptionStatus: "EnAttente", // pending validation
        }
      })

      return NextResponse.json({ success: true, submission })
    }

    return NextResponse.json({ error: "Méthode de paiement non prise en charge." }, { status: 400 })
  } catch (error: any) {
    console.error("Payment API Error:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}

// GET method to retrieve the user's club payment status and details
export async function GET() {
  const session = await auth()
  if (!session || !session.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 })
  }

  const roleName = session.user.role?.name

  try {
    let club = null
    if (roleName === "PRESIDENT") {
      club = await db.club.findUnique({
        where: { presidentId: session.user.id }
      })
    } else if (roleName === "MANAGER_EVO_SPORTS") {
      return NextResponse.json({ error: "Le manager n'a pas d'abonnement propre." }, { status: 400 })
    } else {
      // Staff or player
      const staffMember = await db.staff.findUnique({
        where: { userId: session.user.id },
        include: { club: true }
      })
      if (staffMember && staffMember.club) {
        club = staffMember.club
      } else {
        const playerMember = await db.player.findUnique({
          where: { userId: session.user.id },
          include: { club: true }
        })
        if (playerMember && playerMember.club) {
          club = playerMember.club
        }
      }
    }

    if (!club) {
      return NextResponse.json({ error: "Club non trouvé." }, { status: 404 })
    }

    // Get the latest payment submission for this club
    const latestSubmission = await db.paymentSubmission.findFirst({
      where: { clubId: club.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      clubId: club.id,
      clubName: club.name,
      subscriptionPlan: club.subscriptionPlan,
      subscriptionStatus: club.subscriptionStatus,
      subscriptionExpires: club.subscriptionExpires,
      subscriptionPaid: club.subscriptionPaid,
      latestSubmission,
      userRole: roleName
    })
  } catch (error: any) {
    console.error("GET Payment API Error:", error)
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 })
  }
}
