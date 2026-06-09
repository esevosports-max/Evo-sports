"use client"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-300">
      <div className="relative flex items-center justify-center">
        {/* Animated Premium Dual Ring Spinner surrounding the logo */}
        <div className="absolute h-28 w-28 rounded-full border-4 border-zinc-100 border-t-emerald-600 animate-spin duration-1000" />
        <div className="absolute h-28 w-28 rounded-full border-4 border-transparent border-b-zinc-400 animate-spin duration-1000 reverse-spin" />

        {/* Brand standalone emblem logo in the middle */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-icon.png"
          alt="EVO SPORTS"
          className="h-14 w-auto object-contain animate-pulse"
        />
      </div>

      {/* Embedded reverse-spin CSS style for the secondary spinner ring */}
      <style jsx global>{`
        @keyframes reverse-spin {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .reverse-spin {
          animation: reverse-spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
