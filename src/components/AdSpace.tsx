"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface AnnouncementDB {
  id: string
  badgeText: string
  badgeStyle: string
  icon: string
  title: string
  titleStyle: string
  description: string
  linkText: string
  linkUrl: string
  mediaType: string
  mediaUrl: string
  type?: string
}

interface AdSpaceProps {
  announcements?: AnnouncementDB[]
}

export default function AdSpace({ announcements = [] }: AdSpaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [announcements.length])

  // Safeguard if announcements is empty
  if (!announcements || announcements.length === 0) return null

  // Ensure index is within range if list length changes
  const activeSlideIndex = currentIndex >= announcements.length ? 0 : currentIndex
  const activeSlide = announcements[activeSlideIndex]

  return (
    <div className="mx-auto w-[calc(100%-2rem)] max-w-7xl px-4 py-1 mt-6">
      <div className="relative overflow-hidden rounded-xl border border-white/10 dark:border-white/5 bg-[#0B1528]/45 backdrop-blur-lg px-6 py-3.5 md:py-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Background Slideshow Slider */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {announcements.map((slide, index) => {
            const isActive = index === activeSlideIndex
            return (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-50" : "opacity-0"
                }`}
              >
                {slide.mediaType === "video" ? (
                  <video
                    src={slide.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.mediaUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
            )
          })}
          {/* Dark Glassy Overlay to guarantee high text contrast and legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/55 backdrop-blur-[2px] z-10" />
        </div>

        {/* Dynamic Animated Content Wrapper */}
        <div key={activeSlideIndex} className="animate-slide-up-fade flex flex-col md:flex-row items-center justify-between w-full gap-4 relative z-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 max-w-4xl w-full">
            <span className={`inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide transition-all duration-300 ${activeSlide.badgeStyle}`}>
              {activeSlide.badgeText}
            </span>
            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
              {activeSlide.icon} <span className={`bg-gradient-to-r ${activeSlide.titleStyle} bg-clip-text text-transparent font-extrabold`}>{activeSlide.title}</span>{" : "}{activeSlide.description}
            </p>
          </div>

          <Link
            href={activeSlide.linkUrl}
            className="shrink-0 rounded-lg bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-4 py-2 text-[10px] font-black uppercase tracking-wider shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all active:scale-95"
          >
            {activeSlide.linkText}
          </Link>
        </div>
      </div>
    </div>
  )
}
