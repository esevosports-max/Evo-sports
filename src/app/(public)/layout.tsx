import { auth } from "@/auth"
import DynamicNavbar from "@/components/DynamicNavbar"
import AdSpace from "@/components/AdSpace"
import Footer from "@/components/Footer"

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  const isAuthenticated = !!session

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 transition-colors duration-200">
      {/* Dynamic Navbar */}
      <DynamicNavbar isAuthenticated={isAuthenticated} user={session?.user} />

      {/* Sponsored Ad Space */}
      <AdSpace />

      {/* Main Page Content */}
      <main className="flex-1 w-full bg-white">
        {children}
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>
  )
}
