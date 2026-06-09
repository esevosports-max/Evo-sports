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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as { name: string; permissions: string[] }
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
