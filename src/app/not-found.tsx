import Link from "next/link"
import { auth } from "@/auth"
import DynamicNavbar from "@/components/DynamicNavbar"
import AdSpace from "@/components/AdSpace"
import Footer from "@/components/Footer"

export default async function NotFound() {
  const session = await auth()
  const isAuthenticated = !!session

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-200">
      {/* Navbar Layout */}
      <DynamicNavbar isAuthenticated={isAuthenticated} user={session?.user} />

      {/* Sponsored Ad Banner */}
      <AdSpace />

      {/* Main Content Area */}
      <main className="flex-1 w-full flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-8">
          
          {/* Logo brand in the middle */}
          <div className="flex justify-center animate-bounce">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="EVO SPORTS Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-2xs font-extrabold uppercase tracking-widest text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              🚧 Section Privée
            </span>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Page sous développement
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
              Cette fonctionnalité ou section de la plateforme premium **EVO SPORTS** est actuellement en cours de développement par nos ingénieurs techniques. 
            </p>
          </div>

          {/* Silver button with Green text */}
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-6 py-3 text-sm font-black uppercase tracking-wider shadow-sm hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 active:scale-95"
            >
              Retourner à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>

      {/* Global Footer Layout */}
      <Footer />
    </div>
  )
}
