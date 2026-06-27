"use client"

import { useState, useTransition } from "react"
import { saveAnnouncement, deleteAnnouncement, toggleVisibility } from "@/app/dashboard/manager/annonces/actions"

interface Announcement {
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
  active: boolean
  type: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

interface ManagerAnnouncementsClientProps {
  initialAnnouncements: Announcement[]
  initialVisibility: boolean
}

const BADGE_PRESETS = [
  { label: "Bleu (Sponsorisé)", value: "bg-blue-500/20 border-blue-500/35 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.25)]" },
  { label: "Vert (Nouveauté)", value: "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]" },
  { label: "Orange (Info / Promo)", value: "bg-amber-500/20 border-amber-500/35 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]" },
  { label: "Rouge (Alerte / Urgent)", value: "bg-rose-500/20 border-rose-500/35 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.25)]" },
  { label: "Violet (Note)", value: "bg-purple-500/20 border-purple-500/35 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]" }
]

const TITLE_PRESETS = [
  { label: "Émeraude à Teal (Premium)", value: "from-emerald-400 to-teal-400" },
  { label: "Émeraude Pur", value: "from-emerald-400 to-emerald-300" },
  { label: "Ambre à Orange", value: "from-amber-400 to-orange-400" },
  { label: "Bleu à Indigo", value: "from-blue-400 to-indigo-400" },
  { label: "Or Brillant", value: "from-yellow-300 to-amber-500" }
]

export default function ManagerAnnouncementsClient({
  initialAnnouncements,
  initialVisibility
}: ManagerAnnouncementsClientProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements)
  const [isVisible, setIsVisible] = useState(initialVisibility)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [type, setType] = useState("NEWS")
  const [activeTab, setActiveTab] = useState<"ALL" | "SPONSOR" | "PROMOTION" | "NEWS" | "NOTE">("ALL")
  const [badgeText, setBadgeText] = useState("Sponsorisé")
  const [badgeStyle, setBadgeStyle] = useState(BADGE_PRESETS[0].value)
  const [icon, setIcon] = useState("⚡️")
  const [title, setTitle] = useState("")
  const [titleStyle, setTitleStyle] = useState(TITLE_PRESETS[0].value)
  const [description, setDescription] = useState("")
  const [linkText, setLinkText] = useState("Découvrir")
  const [linkUrl, setLinkUrl] = useState("/")
  const [mediaSourceType, setMediaSourceType] = useState<"file" | "url">("file")
  const [mediaType, setMediaType] = useState("image")
  const [mediaUrl, setMediaUrl] = useState("")
  const [active, setActive] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [formError, setFormError] = useState("")

  const handleTypeChange = (newType: string) => {
    setType(newType)
    if (newType === "SPONSOR") {
      setBadgeText("Sponsorisé")
      setBadgeStyle(BADGE_PRESETS[0].value)
      setIcon("⚡️")
    } else if (newType === "PROMOTION") {
      setBadgeText("Promo")
      setBadgeStyle(BADGE_PRESETS[2].value) // Orange/Amber
      setIcon("🏷️")
    } else if (newType === "NEWS") {
      setBadgeText("Nouveauté")
      setBadgeStyle(BADGE_PRESETS[1].value) // Emerald
      setIcon("✨")
    } else if (newType === "NOTE") {
      setBadgeText("Note")
      setBadgeStyle(BADGE_PRESETS[4].value) // Violet
      setIcon("📝")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    
    if (!isImage && !isVideo) {
      setFormError("Veuillez sélectionner un fichier image ou vidéo.")
      return
    }

    const maxImageSize = 5 * 1024 * 1024 // 5MB
    const maxVideoSize = 15 * 1024 * 1024 // 15MB
    const limit = isImage ? maxImageSize : maxVideoSize
    
    if (file.size > limit) {
      setFormError(
        `Le fichier est trop volumineux. Taille maximale : ${isImage ? "5 Mo" : "15 Mo"}.`
      )
      return
    }

    setFormError("")
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMediaUrl(reader.result)
        setMediaType(isImage ? "image" : "video")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleToggleVisibility = () => {
    const nextVal = !isVisible
    setIsVisible(nextVal)
    startTransition(async () => {
      const res = await toggleVisibility(nextVal)
      if (!res.success) {
        setIsVisible(!nextVal) // Revert on failure
        alert("Erreur: " + res.error)
      }
    })
  }

  const openCreateForm = () => {
    setEditingId(null)
    setType("NEWS")
    setBadgeText("Nouveauté")
    setBadgeStyle(BADGE_PRESETS[1].value)
    setIcon("✨")
    setTitle("")
    setTitleStyle(TITLE_PRESETS[0].value)
    setDescription("")
    setLinkText("Découvrir les Offres")
    setLinkUrl("/pricing")
    setMediaSourceType("file")
    setMediaType("image")
    setMediaUrl("")
    setActive(true)
    setStartDate("")
    setEndDate("")
    setFormError("")
    setIsFormOpen(true)
  }

  const openEditForm = (ann: Announcement) => {
    setEditingId(ann.id)
    const normalizedType = (ann.type === "HOMEPAGE" ? "NEWS" : ann.type) || "NEWS"
    setType(normalizedType)
    setBadgeText(ann.badgeText)
    setBadgeStyle(ann.badgeStyle)
    setIcon(ann.icon)
    setTitle(ann.title)
    setTitleStyle(ann.titleStyle)
    setDescription(ann.description)
    setLinkText(ann.linkText)
    setLinkUrl(ann.linkUrl)
    setMediaType(ann.mediaType)
    setMediaUrl(ann.mediaUrl)
    const isBase64 = ann.mediaUrl.startsWith("data:")
    setMediaSourceType(isBase64 ? "file" : "url")
    setActive(ann.active)
    setStartDate(ann.startDate ? new Date(ann.startDate).toISOString().slice(0, 16) : "")
    setEndDate(ann.endDate ? new Date(ann.endDate).toISOString().slice(0, 16) : "")
    setFormError("")
    setIsFormOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !mediaUrl.trim()) {
      setFormError("Veuillez remplir le titre, la description, et ajouter un média (photo ou vidéo).")
      return
    }

    startTransition(async () => {
      const res = await saveAnnouncement({
        id: editingId || undefined,
        badgeText,
        badgeStyle,
        icon,
        title,
        titleStyle,
        description,
        linkText,
        linkUrl,
        mediaType,
        mediaUrl,
        active,
        type,
        startDate: startDate || null,
        endDate: endDate || null
      })

      if (res.success) {
        setIsFormOpen(false)
        // Refresh local list
        const updated = await fetch("/api/manager/annonces").then(r => r.json())
        if (updated.success) {
          setAnnouncements(updated.data)
        } else {
          window.location.reload()
        }
      } else {
        setFormError(res.error || "Une erreur est survenue")
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return

    startTransition(async () => {
      const res = await deleteAnnouncement(id)
      if (res.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id))
      } else {
        alert("Erreur de suppression: " + res.error)
      }
    })
  }

  // Check if announcement is within scheduling dates
  const isScheduledActive = (ann: Announcement) => {
    if (!ann.active) return false
    const now = new Date()
    if (ann.startDate && new Date(ann.startDate) > now) return false
    if (ann.endDate && new Date(ann.endDate) < now) return false
    return true
  }

  const filteredAnnouncements = announcements.filter(ann => {
    if (activeTab === "ALL") return true
    const t = ann.type || "HOMEPAGE"
    const normalized = t === "HOMEPAGE" ? "NEWS" : t
    return normalized === activeTab
  })

  return (
    <div className="space-y-8 text-zinc-800 dark:text-zinc-100">
      
      {/* Header and Global Settings Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-wider text-zinc-900 dark:text-white">
            Gestion des Annonces Système
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Programmez, créez et pilotez la diffusion des annonces sur l'espace d'accueil public de la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/80">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Affichage Espace Annonces
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
              Toggle global sur la page d'accueil
            </span>
          </div>

          <button
            onClick={handleToggleVisibility}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isVisible ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
            } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isVisible ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Panel Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-wider text-zinc-950 dark:text-white">
          Gestion des Annonces
        </h2>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[11px] px-4 py-2.5 shadow-md shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer"
        >
          ➕ Créer une annonce
        </button>
      </div>

      {/* Tabs for separating Announcement Categories */}
      <div className="flex gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-3 overflow-x-auto select-none">
        {(["ALL", "SPONSOR", "PROMOTION", "NEWS", "NOTE"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
              activeTab === tab
                ? "bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-transparent shadow-sm shadow-emerald-500/10"
                : "text-zinc-550 hover:text-zinc-850 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80"
            }`}
          >
            {tab === "ALL" && "📁 Toutes"}
            {tab === "SPONSOR" && "⚡ Sponsorisés"}
            {tab === "PROMOTION" && "🏷️ Promotions"}
            {tab === "NEWS" && "✨ Nouveautés"}
            {tab === "NOTE" && "📝 Notes"}
          </button>
        ))}
      </div>

      {/* Modal / Inline Form */}
      {isFormOpen && (
        <div className="rounded-xl border border-emerald-500/20 bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6 animate-slide-up-fade">
          <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="font-black uppercase tracking-wider text-sm text-emerald-500">
              {editingId ? "✏️ Modifier l'annonce" : "✨ Nouvelle Annonce"}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-xs font-black text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
            >
              Fermer ✕
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg font-semibold">
              ⚠️ {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category / Type Selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500 font-bold">
                Type d'Annonce *
              </label>
              <select
                value={type}
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none font-bold"
              >
                <option value="NEWS">✨ Nouveautés</option>
                <option value="PROMOTION">🏷️ Promotion</option>
                <option value="SPONSOR">⚡ Sponsorisé</option>
                <option value="NOTE">📝 Note</option>
              </select>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Titre de l'Annonce *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: EVO PREMIUM"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Gradient Preset Title Style */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Style du Titre (Dégradé)
              </label>
              <select
                value={titleStyle}
                onChange={e => setTitleStyle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              >
                {TITLE_PRESETS.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Badge Text */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Texte du Badge
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={e => setBadgeText(e.target.value)}
                placeholder="Ex: Sponsorisé, Nouveauté"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Badge Preset Style */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Couleur du Badge
              </label>
              <select
                value={badgeStyle}
                onChange={e => setBadgeStyle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              >
                {BADGE_PRESETS.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Icon (Emoji) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Icône (Emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={e => setIcon(e.target.value)}
                placeholder="Ex: ⚡️, 📢, 💬"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            {/* Media Source Selector */}
            <div className="grid grid-cols-1 col-span-2 space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Source du Média *
              </label>
              
              <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg w-fit select-none">
                <button
                  type="button"
                  onClick={() => {
                    setMediaSourceType("file")
                    setMediaUrl("")
                  }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    mediaSourceType === "file"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-850 dark:hover:text-white"
                  }`}
                >
                  📁 Fichier Local (Stockage Interne)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMediaSourceType("url")
                    setMediaUrl("")
                  }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    mediaSourceType === "url"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-850 dark:hover:text-white"
                  }`}
                >
                  🔗 URL Web Externe
                </button>
              </div>

              {mediaSourceType === "file" ? (
                <div className="space-y-3">
                  <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center justify-center transition-all bg-white dark:bg-zinc-900/50">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <span className="text-xl">📥</span>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-2">
                      Glissez ou cliquez pour choisir un fichier
                    </span>
                    <span className="text-[9px] text-zinc-400 mt-1">
                      Images (max 5 Mo) • Vidéos MP4 (max 15 Mo)
                    </span>
                  </div>

                  {mediaUrl && (
                    <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0 w-16 h-12 rounded overflow-hidden bg-black flex items-center justify-center">
                          {mediaType === "video" ? (
                            <span className="text-white text-[9px] font-black">📹 VIDÉO</span>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mediaUrl}
                              alt="Aperçu"
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase text-emerald-500">
                            Fichier sélectionné avec succès
                          </p>
                          <p className="text-[9px] text-zinc-400 truncate">
                            Type : {mediaType === "video" ? "Vidéo MP4" : "Image"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMediaUrl("")}
                        className="text-xs font-bold text-red-400 hover:text-red-500 px-3 py-1 rounded bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                      >
                        Supprimer ✕
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Type de Média externe
                    </label>
                    <select
                      value={mediaType}
                      onChange={e => setMediaType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
                    >
                      <option value="image">Image</option>
                      <option value="video">Vidéo (.mp4)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Lien direct (URL) du Média *
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="Ex: https://images.unsplash.com/... ou URL vidéo .mp4"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 col-span-2 space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Description de l'Annonce *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Optimisez la performance de votre club avec l'accès médecin pro et GPS en temps réel..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-20"
                required
              />
            </div>

            {/* CTA Button Text */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Texte du Bouton (Appel à l'Action)
              </label>
              <input
                type="text"
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                placeholder="Ex: Découvrir les Offres"
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            {/* CTA Button Link */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                Lien de redirection (URL)
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Ex: /pricing, https://..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            {/* Scheduling Start Date */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                📅 Date & Heure de début de diffusion (Optionnel)
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            {/* Scheduling End Date */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-500">
                📅 Date & Heure de fin de diffusion (Optionnel)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            {/* Active Switch Toggle */}
            <div className="flex items-center gap-3 col-span-2 bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-150 dark:border-zinc-800/80">
              <input
                type="checkbox"
                id="activeToggle"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="h-4 w-4 text-emerald-500 rounded focus:ring-emerald-500 border-zinc-300"
              />
              <label htmlFor="activeToggle" className="text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300 select-none cursor-pointer">
                Activer immédiatement cette annonce
              </label>
            </div>

            {/* Save Controls */}
            <div className="flex justify-end gap-3 col-span-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-semibold text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-[11px] transition-colors shadow-md shadow-emerald-500/10"
              >
                {isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Grid of Announcements */}
      <div className="grid grid-cols-1 gap-6">
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-2xl">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-semibold text-zinc-500 mt-2">Aucune annonce trouvée dans cette catégorie.</p>
          </div>
        ) : (
          filteredAnnouncements.map(ann => {
            const isLive = isScheduledActive(ann)
            return (
              <div
                key={ann.id}
                className="relative overflow-hidden rounded-xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:shadow-md transition-all"
              >
                {/* Visual Preview Badge & Content */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  
                  {/* Media Miniature preview */}
                  <div className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 flex items-center justify-center">
                    {ann.mediaType === "video" ? (
                      <div className="text-white font-extrabold text-[9px] flex flex-col items-center">
                        <span>📹 VIDÉO</span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ann.mediaUrl}
                        alt=""
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>

                  {/* Announcement details */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${ann.badgeStyle}`}>
                        {ann.badgeText}
                      </span>
                      
                      {/* Type Badge */}
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        (ann.type || "HOMEPAGE") === "SPONSOR"
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : (ann.type || "HOMEPAGE") === "PROMOTION"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : (ann.type || "HOMEPAGE") === "NOTE"
                          ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}>
                        {(ann.type || "HOMEPAGE") === "SPONSOR"
                          ? "⚡ Sponsorisé"
                          : (ann.type || "HOMEPAGE") === "PROMOTION"
                          ? "🏷️ Promotion"
                          : (ann.type || "HOMEPAGE") === "NOTE"
                          ? "📝 Note"
                          : "✨ Nouveauté"}
                      </span>

                      {/* Active Status Badge */}
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        isLive 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                          : "bg-red-500/15 text-red-400 border border-red-500/25"
                      }`}>
                        {isLive ? "● En Diffusion" : "● Hors Ligne"}
                      </span>
                    </div>

                    <h3 className="text-sm font-black uppercase tracking-wider text-zinc-950 dark:text-white flex items-center gap-1.5">
                      <span>{ann.icon}</span>
                      <span className={`bg-gradient-to-r ${ann.titleStyle} bg-clip-text text-transparent`}>
                        {ann.title}
                      </span>
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {ann.description}
                    </p>

                    {/* Scheduling date details */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-zinc-400 font-semibold pt-1">
                      {ann.startDate && (
                        <span>Début : {new Date(ann.startDate).toLocaleString("fr-FR")}</span>
                      )}
                      {ann.endDate && (
                        <span>Fin : {new Date(ann.endDate).toLocaleString("fr-FR")}</span>
                      )}
                      {!ann.startDate && !ann.endDate && (
                        <span>Diffusion continue</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CRUD Controls */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 lg:pt-0">
                  <button
                    onClick={() => openEditForm(ann)}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-3 py-2 text-xs font-semibold transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-400 px-3 py-2 text-xs font-bold transition-colors"
                  >
                    🗑️ Supprimer
                  </button>
                </div>

              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
