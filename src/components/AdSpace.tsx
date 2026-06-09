"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface MediaItem {
  type: "image" | "video"
  url: string
}

const SLIDES: MediaItem[] = [
  {
    type: "video",
    url: "https://player.vimeo.com/external/409224368.sd.mp4?s=d4f2bc181e18d6e326c7104b2bcf1b15c7e193fb&profile_id=165&oauth2_token_id=57447761",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    type: "video",
    url: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f73b4d538e1bde334d588523558a&profile_id=139&oauth2_token_id=57447761",
  },
  {
    type: "image",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
  },
]

export default function AdSpace() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-7xl px-4 py-2 mt-2">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 bg-zinc-950 px-8 py-8 md:py-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 min-h-[130px]">
        {/* Background Slideshow Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {SLIDES.map((slide, index) => {
            const isActive = index === currentIndex
            return (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              >
                {slide.type === "video" ? (
                  <video
                    src={slide.url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            )
          })}
          {/* Dark Glassy Overlay to guarantee high text contrast and legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/85 backdrop-blur-[2px] z-10" />
        </div>

        {/* Content Wrapper */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-20 max-w-4xl">
          <span className="inline-flex shrink-0 items-center rounded-md bg-blue-500/20 border border-blue-500/35 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.25)]">
            Sponsorisé
          </span>
          <p className="text-sm font-bold text-white leading-relaxed">
            ⚡️ <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-extrabold">EVO PREMIUM</span>{" : Optimisez la performance de votre club avec l'accès médecin pro et GPS en temps réel."}
          </p>
        </div>

        <Link
          href="/pricing"
          className="shrink-0 relative z-20 rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-5 py-3 text-xs font-black uppercase tracking-widest shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all active:scale-95"
        >
          Découvrir les Offres
        </Link>
      </div>
    </div>
  )
}
