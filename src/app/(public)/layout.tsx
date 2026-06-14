import { auth } from "@/auth"
import { db } from "@/lib/db"
import PublicLayoutClient from "@/components/PublicLayoutClient"

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  let announcements: any[] = []
  let visible = true

  try {
    const now = new Date()
    announcements = await db.announcement.findMany({
      where: {
        active: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    })

    const setting = await db.systemSetting.findUnique({
      where: { key: "HOMEPAGE_ANNOUNCEMENTS_VISIBLE" }
    })
    visible = setting ? setting.value === "true" : true
  } catch (error) {
    console.error("Failed to fetch announcements/settings from DB:", error)
  }

  // Fallback default announcements if DB is empty
  if (announcements.length === 0) {
    announcements = [
      {
        id: "default-1",
        badgeText: "Sponsorisé",
        badgeStyle: "bg-blue-500/20 border-blue-500/35 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.25)]",
        icon: "⚡️",
        title: "EVO PREMIUM",
        titleStyle: "from-emerald-400 to-teal-400",
        description: "Optimisez la performance de votre club avec l'accès médecin pro et GPS en temps réel.",
        linkText: "Découvrir les Offres",
        linkUrl: "/pricing",
        mediaType: "video",
        mediaUrl: "https://player.vimeo.com/external/409224368.sd.mp4?s=d4f2bc181e18d6e326c7104b2bcf1b15c7e193fb&profile_id=165&oauth2_token_id=57447761"
      },
      {
        id: "default-2",
        badgeText: "Nouveauté",
        badgeStyle: "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]",
        icon: "📢",
        title: "DOSSIER MÉDICAL",
        titleStyle: "from-emerald-400 to-emerald-300",
        description: "Découvrez notre nouveau module de suivi médical et gardez vos joueurs au sommet de leur forme.",
        linkText: "Accéder au Dashboard",
        linkUrl: "/dashboard",
        mediaType: "image",
        mediaUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"
      },
      {
        id: "default-3",
        badgeText: "Info Système",
        badgeStyle: "bg-amber-500/20 border-amber-500/35 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]",
        icon: "💬",
        title: "SUPPORT 24/7",
        titleStyle: "from-amber-400 to-orange-400",
        description: "Une question ou besoin d'assistance ? Notre support technique est disponible en continu pour votre club.",
        linkText: "Nous Contacter",
        linkUrl: "/contact",
        mediaType: "video",
        mediaUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c022f73b4d538e1bde334d588523558a&profile_id=139&oauth2_token_id=57447761"
      }
    ]
  }

  // Safely serialize database date values for client components
  const serializedAnnouncements = JSON.parse(JSON.stringify(announcements))

  return (
    <PublicLayoutClient
      session={session}
      announcements={serializedAnnouncements}
      visible={visible}
    >
      {children}
    </PublicLayoutClient>
  )
}
