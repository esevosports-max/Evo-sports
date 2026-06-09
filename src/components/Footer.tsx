"use client"

import Link from "next/link"
import { useLanguage } from "./LanguageProvider"

export default function Footer() {
  const { t, language, setLanguage } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative w-full border-t border-white/10 bg-[#0B1528] text-white/70 overflow-hidden transition-all duration-300">
      {/* Background Image with opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15 pointer-events-none"
        style={{ backgroundImage: "url('/footer-bg.jpg')" }}
      />
      {/* Dark overlay gradient to blend with the deep blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1528]/70 via-[#0B1528]/90 to-[#0B1528] pointer-events-none" />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="EVO SPORTS" 
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]" 
              />
            </Link>
            <p className="text-xs text-white/60 max-w-xs leading-relaxed font-semibold">
              {t("footer_desc")}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-black tracking-widest text-white uppercase">{t("footer_product")}</h3>
            <ul className="mt-4 space-y-2 font-semibold">
              <li>
                <Link href="/" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_features")}</Link>
              </li>
              <li>
                <Link href="/pricing" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_pricing")}</Link>
              </li>
              <li>
                <Link href="/" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_security")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black tracking-widest text-white uppercase">{t("footer_company")}</h3>
            <ul className="mt-4 space-y-2 font-semibold">
              <li>
                <Link href="/about" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_about")}</Link>
              </li>
              <li>
                <Link href="/about" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_careers")}</Link>
              </li>
              <li>
                <Link href="/about" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_contact")}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-black tracking-widest text-white uppercase">{t("footer_legal")}</h3>
            <ul className="mt-4 space-y-2 font-semibold">
              <li>
                <a href="#" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_privacy")}</a>
              </li>
              <li>
                <a href="#" className="text-xs text-white/50 hover:text-emerald-400 transition-colors">{t("footer_terms")}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-white/40 font-semibold">
            &copy; {currentYear} EVO SPORTS. {t("footer_rights")}
          </p>
          <div className="flex space-x-6 text-white/40 font-bold">
            <button 
              onClick={() => setLanguage("EN")}
              className={`text-[10px] hover:text-emerald-400 cursor-pointer transition-colors uppercase tracking-wider ${language === "EN" ? "text-emerald-400 font-extrabold" : "text-white/50"}`}
            >
              English
            </button>
            <button 
              onClick={() => setLanguage("FR")}
              className={`text-[10px] hover:text-emerald-400 cursor-pointer transition-colors uppercase tracking-wider ${language === "FR" ? "text-emerald-400 font-extrabold" : "text-white/50"}`}
            >
              Français
            </button>
            <button 
              onClick={() => setLanguage("AR")}
              className={`text-[10px] hover:text-emerald-400 cursor-pointer transition-colors uppercase tracking-wider ${language === "AR" ? "text-emerald-400 font-extrabold" : "text-white/50"}`}
            >
              العربية
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
