import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  // Edge-side Football Role-Based Access Control (RBAC) guarding
  if (isOnDashboard && isLoggedIn) {
    const role = req.auth?.user?.role?.name
    const pathname = req.nextUrl.pathname

    // Guard President-only dashboards
    if (pathname.startsWith("/dashboard/president") && role !== "PRESIDENT") {
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }

    // Guard Medical-only dashboards
    if (pathname.startsWith("/dashboard/medical") && role !== "PRESIDENT" && role !== "MEDECIN" && role !== "DIRECTEUR_SPORTIF" && role !== "SECRETAIRE_GENERAL" && role !== "ENTRAINEUR_PRINCIPAL" && role !== "ENTRAINEUR_ADJOINT") {
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }

    // Guard Tactical & Training Staff space (President, Directeur, Head Coach, Assistants, GK Coach, Fitness Coach)
    const isStaffRole = [
      "PRESIDENT",
      "DIRECTEUR_SPORTIF",
      "SECRETAIRE_GENERAL",
      "ENTRAINEUR_PRINCIPAL",
      "ENTRAINEUR_ADJOINT",
      "PREPARATEUR_PHYSIQUE",
      "ENTRAINEUR_GARDIENS"
    ].includes(role || "")

    if (pathname.startsWith("/dashboard/staff") && !isStaffRole) {
      return Response.redirect(new URL("/dashboard", req.nextUrl))
    }
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
