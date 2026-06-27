import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour soumettre une demande." },
        { status: 401 }
      )
    }

    const userRole = session.user.role?.name
    if (userRole !== "PRESIDENT" && userRole !== "MANAGER_EVO_SPORTS") {
      return NextResponse.json(
        { error: "Seuls les présidents de club peuvent soumettre une demande d'inscription." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { clubName, clubLogo, creationDate, address, stadiumName, pdfFilename, phone, chosenPlan, trialSelected } = body

    if (!clubName || !creationDate || !address || !stadiumName) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis." },
        { status: 400 }
      )
    }

    const requestStatus = trialSelected ? "PENDING" : "APPROVED"
    const finalPlan = trialSelected ? "1 Équipe" : (chosenPlan || "Club")

    // Upsert the club request (create or update)
    const request = await db.clubRegistrationRequest.upsert({
      where: { userId: session.user.id },
      update: {
        clubName,
        clubLogo: clubLogo || null,
        creationDate: new Date(creationDate),
        address,
        stadiumName,
        pdfFilename: pdfFilename || null,
        phone: phone || null,
        status: requestStatus, // reset status to pending or auto-approved
        rejectionReason: null,
        chosenPlan: finalPlan,
        trialSelected: trialSelected !== undefined ? trialSelected : false,
      },
      create: {
        userId: session.user.id,
        clubName,
        clubLogo: clubLogo || null,
        creationDate: new Date(creationDate),
        address,
        stadiumName,
        pdfFilename: pdfFilename || null,
        phone: phone || null,
        status: requestStatus,
        chosenPlan: finalPlan,
        trialSelected: trialSelected !== undefined ? trialSelected : false,
      },
    })

    // If "Payer l'offre" was selected (trialSelected === false), register/create the Club in the DB immediately.
    if (!trialSelected) {
      const existingClub = await db.club.findUnique({
        where: { presidentId: session.user.id }
      })

      if (!existingClub) {
        const now = new Date()
        await db.club.create({
          data: {
            name: clubName,
            logo: clubLogo || null,
            creationDate: new Date(creationDate),
            address,
            stadiumName,
            phone: phone || null,
            presidentId: session.user.id,
            stadiumCapacity: "5 000 places",
            subscriptionPlan: chosenPlan || "Club",
            subscriptionStatus: "Bloqué",
            subscriptionExpires: now,
            subscriptionPaid: false,
            subscriptionMethod: "En attente",
          }
        })
      } else {
        await db.club.update({
          where: { id: existingClub.id },
          data: {
            name: clubName,
            logo: clubLogo || null,
            creationDate: new Date(creationDate),
            address,
            stadiumName,
            phone: phone || null,
            subscriptionPlan: chosenPlan || "Club",
          }
        })
      }
    }

    return NextResponse.json(
      { message: "Demande soumise avec succès !", request },
      { status: 200 }
    )
  } catch (error) {
    console.error("Club request submission error:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la soumission de la demande." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = session.user.role?.name

    // Only allow PRESIDENT or MANAGER to get details
    if (userRole === "MANAGER_EVO_SPORTS") {
      // Return all requests for the admin
      const requests = await db.clubRegistrationRequest.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(requests)
    }

    // If it's a president, return their own request
    if (userRole === "PRESIDENT") {
      const request = await db.clubRegistrationRequest.findUnique({
        where: { userId: session.user.id },
      })
      return NextResponse.json(request)
    }

    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  } catch (error) {
    console.error("Fetch request error:", error)
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const userRole = session.user.role?.name
    if (userRole !== "MANAGER_EVO_SPORTS") {
      return NextResponse.json({ error: "Réservé au Manager EVO Sports" }, { status: 403 })
    }

    const { id, status, rejectionReason } = await req.json()
    if (!id || !status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const updatedRequest = await db.clubRegistrationRequest.update({
      where: { id },
      data: { 
        status,
        rejectionReason: status === "REJECTED" ? (rejectionReason || "Refusé par le manager") : null
      },
      include: { user: true }
    })

    // If approved, create or update the Club in the database
    if (status === "APPROVED") {
      const existingClub = await db.club.findUnique({
        where: { presidentId: updatedRequest.userId }
      })

      const now = new Date()
      let expiresDate: Date | null = null
      let subStatus = "Bloqué"
      let isPaid = false

      if (updatedRequest.trialSelected) {
        expiresDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        subStatus = "Essai"
      } else {
        expiresDate = now // already expired, must pay
        subStatus = "Bloqué"
      }

      if (!existingClub) {
        await db.club.create({
          data: {
            name: updatedRequest.clubName,
            logo: updatedRequest.clubLogo,
            creationDate: updatedRequest.creationDate,
            address: updatedRequest.address,
            stadiumName: updatedRequest.stadiumName,
            phone: updatedRequest.phone,
            presidentId: updatedRequest.userId,
            stadiumCapacity: "5 000 places", // default capacity
            subscriptionPlan: updatedRequest.chosenPlan,
            subscriptionStatus: subStatus,
            subscriptionExpires: expiresDate,
            subscriptionPaid: isPaid,
            subscriptionMethod: updatedRequest.trialSelected ? "Gratuit" : "En attente",
          }
        })
      } else {
        await db.club.update({
          where: { id: existingClub.id },
          data: {
            name: updatedRequest.clubName,
            logo: updatedRequest.clubLogo,
            creationDate: updatedRequest.creationDate,
            address: updatedRequest.address,
            stadiumName: updatedRequest.stadiumName,
            phone: updatedRequest.phone,
            subscriptionPlan: updatedRequest.chosenPlan,
            subscriptionStatus: subStatus,
            subscriptionExpires: expiresDate,
            subscriptionPaid: isPaid,
            subscriptionMethod: updatedRequest.trialSelected ? "Gratuit" : "En attente",
          }
        })
      }
    }

    return NextResponse.json({ message: `Statut mis à jour : ${status}`, request: updatedRequest })
  } catch (error) {
    console.error("PATCH request status error:", error)
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 })
  }
}
