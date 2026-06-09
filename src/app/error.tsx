"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an analytics service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      {/* Background blur effects */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-8 bg-white/80 dark:bg-zinc-900/80 p-8 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl backdrop-blur-md">
        
        {/* Brand logo in the middle */}
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="EVO SPORTS Logo"
            className="h-14 w-auto object-contain"
          />
        </div>

        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-2xs font-extrabold uppercase tracking-widest text-red-800 dark:bg-red-950/30 dark:text-red-400">
            ⚠️ Une erreur est survenue
          </span>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            Dysfonctionnement temporaire
          </h1>
          <p className="text-xs text-zinc-500 leading-relaxed dark:text-zinc-400">
            Nous nous excusons pour le désagrément. Nos équipes techniques de terrain ont été notifiées pour corriger ce problème.
          </p>
        </div>

        {/* Silver CTA button with Green text */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-6 py-3 text-xs font-black uppercase tracking-wider shadow-sm hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 active:scale-95"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-xl border border-zinc-200 bg-white/80 px-6 py-3 text-xs font-bold text-zinc-700 backdrop-blur-sm hover:bg-zinc-50 shadow-sm transition-all duration-200 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Retourner à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
