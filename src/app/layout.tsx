import type { Metadata } from "next"
import { Geist, Geist_Mono, Oswald } from "next/font/google"
import "./globals.css"
import { auth } from "@/auth"
import SessionTimeoutListener from "@/components/SessionTimeoutListener"
import { LanguageProvider } from "@/components/LanguageProvider"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "EVO SPORTS • Football Performance Portal",
  description: "Système premium de gestion de performance et de rôles RBAC pour clubs de football.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const isAuthenticated = !!session

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 transition-colors duration-200">
        <LanguageProvider>
          <SessionTimeoutListener isAuthenticated={isAuthenticated} />
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
