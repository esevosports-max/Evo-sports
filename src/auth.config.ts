import type { NextAuthConfig } from "next-auth"

// Extend NextAuth typings for RBAC support
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: {
        name: string
        permissions: string[]
      }
    } & import("next-auth").DefaultSession["user"]
  }

  interface User {
    id?: string
    role?: {
      name: string
      permissions: string[]
    }
  }
}

export const authConfig = {
  providers: [], // Empty here, populated in auth.ts to keep it Edge-compatible
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as { name: string; permissions: string[] }
      }
      
      // If signed in via Google (OAuth), look up or create user in DB and assign default role
      if (account?.provider === "google" && token.email) {
        try {
          const { db } = await import("@/lib/db")
          let dbUser = await db.user.findUnique({
            where: { email: token.email },
            include: { role: { include: { permissions: true } } }
          })
          
          if (!dbUser) {
            let role = await db.role.findFirst({ where: { name: "PRESIDENT" } })
            if (!role) {
              const { seedRBAC } = await import("@/lib/rbac")
              await seedRBAC()
              role = await db.role.findFirst({ where: { name: "PRESIDENT" } })
            }
            
            dbUser = await db.user.create({
              data: {
                name: token.name,
                email: token.email,
                image: token.picture,
                roleId: role?.id,
              },
              include: { role: { include: { permissions: true } } }
            })
          }
          
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role ? {
              name: dbUser.role.name,
              permissions: dbUser.role.permissions.map((p) => p.action)
            } : undefined
          }
        } catch (err) {
          console.error("Google user sync error in JWT callback:", err)
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as { name: string; permissions: string[] }
      }
      return session
    }
  }
} satisfies NextAuthConfig
