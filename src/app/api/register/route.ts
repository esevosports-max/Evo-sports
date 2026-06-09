import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé." },
        { status: 400 }
      )
    }

    // Validate password complexity (at least one letter and at least one digit)
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasDigit = /[0-9]/.test(password)
    if (!hasLetter || !hasDigit) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins une lettre et au moins un chiffre." },
        { status: 400 }
      )
    }

    // Seed roles if database is empty
    const rolesCount = await db.role.count()
    if (rolesCount === 0) {
      const { seedRBAC } = await import("@/lib/rbac")
      await seedRBAC()
    }

    // Find PRESIDENT role
    let role = await db.role.findUnique({
      where: { name: "PRESIDENT" },
    })

    if (!role) {
      return NextResponse.json(
        { error: "Le rôle Président est introuvable." },
        { status: 500 }
      )
    }

    // Create the user (since registration is for presidents only)
    const user = await db.user.create({
      data: {
        name,
        email,
        password, // Using plain password like the demo accounts for simplicity/compatibility
        roleId: role.id,
      },
    })

    return NextResponse.json(
      { message: "Compte créé avec succès.", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du compte." },
      { status: 500 }
    )
  }
}
