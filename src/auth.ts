import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        try {
          // Dynamic DB configuration & seeding if table is empty
          const rolesCount = await db.role.count()
          if (rolesCount === 0) {
            const { seedRBAC } = await import("@/lib/rbac")
            await seedRBAC()
          }

          // Create standard football club demo users if they don't exist yet
          const demoUsers = [
            { name: "Manager EVO Sports", email: "manager@example.com", roleName: "MANAGER_EVO_SPORTS" },
            { name: "Président de Club", email: "president@example.com", roleName: "PRESIDENT" },
            { name: "Directeur Sportif", email: "directeur@example.com", roleName: "DIRECTEUR_SPORTIF" },
            { name: "Secrétaire Général", email: "secretaire@example.com", roleName: "SECRETAIRE_GENERAL" },
            { name: "Entraîneur Principal", email: "entraineur@example.com", roleName: "ENTRAINEUR_PRINCIPAL" },
            { name: "Entraîneur Adjoint", email: "adjoint@example.com", roleName: "ENTRAINEUR_ADJOINT" },
            { name: "Préparateur Physique", email: "preparateur@example.com", roleName: "PREPARATEUR_PHYSIQUE" },
            { name: "Entraîneur Gardiens", email: "gardiens@example.com", roleName: "ENTRAINEUR_GARDIENS" },
            { name: "Médecin du Club", email: "medecin@example.com", roleName: "MEDECIN" },
            { name: "Joueur de Foot", email: "joueur@example.com", roleName: "JOUEUR" },
          ]

          for (const demo of demoUsers) {
            const exists = await db.user.findUnique({ where: { email: demo.email } })
            if (!exists) {
              const role = await db.role.findUnique({ where: { name: demo.roleName } })
              if (role) {
                await db.user.create({
                  data: {
                    name: demo.name,
                    email: demo.email,
                    password: "password", // Simple plain password for demo purposes
                    roleId: role.id,
                  }
                })
              }
            }
          }

          // Fetch the user from the database and include role and permissions
          const user = await db.user.findUnique({
            where: { email },
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          })

          if (user && user.password === password) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role
                ? {
                    name: user.role.name,
                    permissions: user.role.permissions.map((p) => p.action),
                  }
                : undefined,
            }
          }
        } catch (error) {
          console.error("Auth authorization error:", error)
        }

        return null
      }
    })
  ]
})
