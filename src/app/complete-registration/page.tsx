"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/LanguageProvider"

export default function CompleteRegistration() {
  const { t, language } = useLanguage()
  const [clubName, setClubName] = useState("")
  const [creationDate, setCreationDate] = useState("")
  const [address, setAddress] = useState("")
  const [stadiumName, setStadiumName] = useState("")
  const [phone, setPhone] = useState("")
  const [chosenPlan, setChosenPlan] = useState("Club")
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null)
  const [logoName, setLogoName] = useState("")
  
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  // Fetch session on load
  useEffect(() => {
    async function checkSession() {
      try {
        if (typeof window !== "undefined") {
          const storedPlan = sessionStorage.getItem("selectedPlan")
          if (storedPlan) {
            setChosenPlan(storedPlan)
          }
        }
        const res = await fetch("/api/club-request")
        if (res.status === 401) {
          setIsAuthenticated(false)
          window.location.href = "/login"
          return
        }
        if (res.ok) {
          setIsAuthenticated(true)
          const data = await res.json()
          // If a request already exists and it's pending, redirect to waiting
          if (data && data.status) {
            if (data.status === "APPROVED") {
              window.location.href = "/dashboard"
            } else if (data.status === "PENDING") {
              window.location.href = "/waiting-validation"
            } else if (data.status === "REJECTED") {
              setClubName(data.clubName || "")
              setCreationDate(data.creationDate ? data.creationDate.split('T')[0] : "")
              setAddress(data.address || "")
              setStadiumName(data.stadiumName || "")
              setPhone(data.phone || "")
              setChosenPlan(data.chosenPlan || "Club")
              setLogoBase64(data.clubLogo || null)
              setLogoName(data.clubLogo ? "logo_precedent.png" : "")
              setPdfBase64(data.pdfFilename || null)
              setPdfName(data.pdfFilename ? "declaration_precedente.pdf" : "")
              setRejectionReason(data.rejectionReason || "Aucun motif spécifié")
            }
          }
        }
      } catch (err) {
        console.error("Session check error:", err)
      }
    }
    checkSession()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "pdf") => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit file size to 2 MB (2 * 1024 * 1024 bytes)
    const maxSizeBytes = 2 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(
        language === "FR"
          ? "Le fichier est trop volumineux. Taille maximale : 2 Mo."
          : language === "EN"
          ? "The file is too large. Maximum size: 2 MB."
          : "الملف كبير جداً. الحجم الأقصى: 2 ميجابايت."
      )
      return
    }

    if (type === "pdf" && file.type !== "application/pdf") {
      setError(
        language === "FR"
          ? "Le document doit être un fichier au format PDF."
          : language === "EN"
          ? "The document must be a PDF file."
          : "يجب أن يكون المستند بصيغة PDF."
      )
      return
    }
    setError("")

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (type === "logo") {
          setLogoBase64(reader.result)
          setLogoName(file.name)
        } else {
          setPdfBase64(reader.result)
          setPdfName(file.name)
        }
      }
    }
    reader.onerror = () => {
      setError(
        language === "FR"
          ? "Erreur lors de la lecture du fichier."
          : language === "EN"
          ? "Error reading file."
          : "خطأ أثناء قراءة الملف."
      )
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitWithTrial = async (trial: boolean) => {
    if (!clubName || !creationDate || !address || !stadiumName || !phone) {
      setError(
        language === "FR"
          ? "Veuillez remplir tous les champs obligatoires."
          : language === "EN"
          ? "Please fill in all required fields."
          : "يرجى ملء جميع الحقول المطلوبة."
      )
      return
    }
    if (!pdfBase64) {
      setError(
        language === "FR"
          ? "Veuillez joindre la déclaration sur l'honneur signée et tamponnée en PDF."
          : language === "EN"
          ? "Please attach the signed and stamped declaration of honor in PDF."
          : "يرجى إرفاق التصريح الشرفي الموقع والمختوم بصيغة PDF."
      )
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/club-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName,
          clubLogo: logoBase64,
          creationDate,
          address,
          stadiumName,
          pdfFilename: pdfBase64,
          phone,
          chosenPlan,
          trialSelected: trial,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }

      setSuccess(true)
      setTimeout(() => {
        if (trial) {
          window.location.href = "/waiting-validation"
        } else {
          window.location.href = "/dashboard/paiement"
        }
      }, 1500)
    } catch (err: unknown) {
      const errorObject = err as Error
      setError(
        errorObject.message ||
          (language === "FR"
            ? "Une erreur est survenue lors de la soumission."
            : language === "EN"
            ? "An error occurred during submission."
            : "حدث خطأ أثناء إرسال الطلب.")
      )
      setLoading(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            {language === "FR"
              ? "Chargement de votre session..."
              : language === "EN"
              ? "Loading your session..."
              : "جاري تحميل الجلسة..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background blurs */}
      <div className="absolute top-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-3xl" />
      <div className="absolute bottom-12 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-3xl" />

      <div className="mx-auto w-full max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="EVO SPORTS Logo" className="h-12 w-auto object-contain" />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              PRESIDENT REGISTRATION
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {t("comp_title")}
          </h1>
          <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
            {t("comp_desc")}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70 p-6 sm:p-10 shadow-xl space-y-8">
          
          {rejectionReason && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-bold text-red-650 dark:text-red-400 space-y-1 animate-pulse">
              <span className="uppercase text-[9px] tracking-wider block font-black text-red-650 dark:text-red-300">
                {t("comp_refused_title")}
              </span>
              <p className="leading-relaxed font-semibold">{rejectionReason}</p>
              <p className="text-[10px] text-zinc-500 font-medium">
                {t("comp_refused_guide")}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs font-bold text-red-600 dark:text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-bounce">
              {t("comp_success")}
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Club Logo Upload */}
              <div className="md:col-span-2 flex flex-col items-center justify-center">
                <div className="w-48 h-48 aspect-square flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 hover:border-emerald-500/50 transition-all duration-200 group relative">
                  {logoBase64 ? (
                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoBase64} alt="Club Logo Preview" className="h-24 w-24 aspect-square object-cover rounded-xl border border-zinc-200/50 shadow-md animate-fade-in" />
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 max-w-[150px] truncate">{logoName}</span>
                      <button 
                        type="button" 
                        onClick={() => { setLogoBase64(null); setLogoName("") }}
                        className="text-[9px] uppercase font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        {language === "FR" ? "Supprimer" : language === "EN" ? "Delete" : "حذف"}
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-1.5 cursor-pointer w-full h-full text-center p-2">
                      <svg className="h-8 w-8 text-zinc-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{t("comp_logo")}</span>
                      <span className="text-[9px] text-zinc-400">{t("comp_logo_max")}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "logo")} />
                    </label>
                  )}
                </div>
              </div>

              {/* Club Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_name")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: EVO FC"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Creation Date */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_date")}
                </label>
                <input
                  type="date"
                  required
                  value={creationDate}
                  onChange={(e) => setCreationDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Club Address */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_address")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 15 Rue des Sports, Paris"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Stadium Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_stadium")}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Stade Municipal"
                  value={stadiumName}
                  onChange={(e) => setStadiumName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_phone")}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: +33 6 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              {/* Offer Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  {t("comp_offer")}
                </label>
                <select
                  value={chosenPlan}
                  onChange={(e) => setChosenPlan(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white font-bold"
                >
                  <option value="1 Équipe">
                    {language === "FR" ? "1 Équipe" : language === "EN" ? "1 Team" : "فريق واحد"}{" "}
                    (10 000 DA/{language === "FR" ? "mois" : language === "EN" ? "month" : "شهر"})
                  </option>
                  <option value="Club">
                    {language === "FR" ? "Club" : language === "EN" ? "Club" : "نادي"}{" "}
                    (15 000 DA/{language === "FR" ? "mois" : language === "EN" ? "month" : "شهر"})
                  </option>
                  <option value="Professionnel">
                    {language === "FR" ? "Professionnel" : language === "EN" ? "Professional" : "احترافي"}{" "}
                    (20 000 DA/{language === "FR" ? "mois" : language === "EN" ? "month" : "شهر"})
                  </option>
                  <option value="Elite">
                    Elite{" "}
                    (25 000 DA/{language === "FR" ? "mois" : language === "EN" ? "month" : "شهر"})
                  </option>
                </select>
              </div>

              {/* Declaration of Honor PDF Upload */}
              <div className="md:col-span-2 border border-emerald-500/20 rounded-xl bg-emerald-50/10 dark:bg-emerald-950/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1 md:max-w-md">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                    {t("comp_pdf")}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t("comp_pdf_desc")}
                  </p>
                </div>
                
                <div className="w-full md:w-auto">
                  {pdfBase64 ? (
                    <div className="flex flex-col items-center md:items-end gap-2">
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-lg">
                        <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 10.378 2H4.5Zm9 5a1 1 0 1 0-2 0v6a1 1 0 1 0 2 0V7Zm-5 2a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V9Zm-1 1a1 1 0 0 0-2 0v3a1 1 0 1 0 2 0v-3Z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 max-w-[150px] truncate">{pdfName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { setPdfBase64(null); setPdfName("") }}
                        className="text-[10px] uppercase font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        {t("comp_pdf_change")}
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-xl bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-300 border border-zinc-300/80 text-emerald-800 px-5 py-3 text-xs font-black uppercase tracking-wider shadow-md hover:from-white hover:via-zinc-100 hover:to-zinc-200 hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 duration-150">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      {t("comp_pdf_btn")}
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileChange(e, "pdf")} />
                    </label>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <Link 
                href="/login" 
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors self-start md:self-auto"
              >
                {t("nav_back_to_login")}
              </Link>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => handleSubmitWithTrial(true)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial flex justify-center items-center gap-2 rounded-xl bg-white border border-emerald-500/50 text-emerald-600 hover:bg-emerald-50/50 dark:bg-zinc-950 dark:border-emerald-500/30 px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 transition-all font-bold cursor-pointer"
                >
                  {t("comp_trial_btn")}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitWithTrial(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial flex justify-center items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white px-6 py-3.5 text-xs font-black uppercase tracking-wider shadow-md hover:from-emerald-400 hover:to-teal-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {language === "FR" ? "Envoi..." : language === "EN" ? "Sending..." : "جاري الإرسال..."}
                    </>
                  ) : (
                    t("comp_pay_btn")
                  )}
                </button>
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
