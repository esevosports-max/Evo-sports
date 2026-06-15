"use client"

import { usePathname } from "next/navigation"
import DynamicNavbar from "./DynamicNavbar"
import AdSpace from "./AdSpace"
import Footer from "./Footer"

interface MediaItem {
  type: "image" | "video"
  url: string
}

// Configurable media for the background ad space
const HERO_PUB_MEDIA: MediaItem[] = [
  {
    type: "image",
    url: "/stadium-run.png",
  },
]

export default function PublicLayoutClient({
  children,
  session,
  announcements = [],
  visible = true,
}: {
  children: React.ReactNode
  session: any
  announcements?: any[]
  visible?: boolean
}) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const isAuthenticated = !!session

  const activeMedia = HERO_PUB_MEDIA[0]

  return (
    <div className="relative z-0 min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200">
      {/* Top Advertising Banner Background Space on Homepage */}
      {isHome && activeMedia && (
        <div className="absolute inset-x-0 top-0 h-[450px] md:h-[520px] -z-10 overflow-hidden pointer-events-none">
          {activeMedia.type === "video" ? (
            <video
              src={activeMedia.url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeMedia.url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          )}
          
          {/* Visual gradient overlay matching brand midnight blue color */}
          <div className="absolute inset-0 bg-[#0B1528]/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1528]/85 via-[#0B1528]/10 to-white dark:to-zinc-950" />
        </div>
      )}

      {/* Dynamic Navbar */}
      <DynamicNavbar isAuthenticated={isAuthenticated} user={session?.user} />

      {/* Sponsored Ad Space */}
      {visible && announcements.length > 0 && <AdSpace announcements={announcements} />}

      {/* Main Page Content */}
      <main className={`flex-1 w-full transition-colors duration-200 ${isHome ? 'bg-transparent' : 'bg-white dark:bg-zinc-950'}`}>
        {children}
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>


  )
}
