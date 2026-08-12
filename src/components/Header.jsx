import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"

const NAV_LINKS = [
  { to: "/menu", labelKey: "nav.menu" },
  { to: "/a-propos", labelKey: "nav.visit" },
  { to: "/avis", labelKey: "nav.reviews" },
  { to: "/galerie", label: "Galerie" },
  { to: "/contact", label: "Contact" },
]

const LANGS = ["fr", "ar", "es", "en"]

export default function Header() {
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur-lg border-b border-border/50">
      <div className="w-full max-w-[80rem] mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="w-9 h-9 rounded-full bg-terracotta flex items-center justify-center text-white font-serif font-bold text-sm shadow-warm transition-transform duration-300 group-hover:scale-110">
              C
            </span>
            <span className="font-serif text-lg font-semibold text-bark tracking-tight">
              La Casa <span className="text-terracotta">Di Carta</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-barklight hover:text-terracotta hover:bg-terracotta/5 transition-all duration-200"
              >
                {t(link.labelKey) || link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Lang Switcher */}
            <div className="hidden md:flex items-center gap-0.5 bg-white/60 rounded-full p-0.5 border border-border/50">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`px-2 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                    i18n.language === l
                      ? "bg-terracotta text-white shadow-sm"
                      : "text-barklight hover:text-bark"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* CTA */}
            <Link to="/reserver" className="btn-primary hidden md:inline-flex">
              {t("nav.book")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white/60 border border-border/50 flex items-center justify-center cursor-pointer"
              aria-label="Menu"
            >
              <motion.div className="w-5 flex flex-col gap-1.5 items-center">
                <motion.span
                  className="block h-[2px] w-5 bg-bark rounded-full origin-center"
                  animate={mobileOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.span
                  className="block h-[2px] w-4 bg-bark rounded-full"
                  animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="block h-[2px] w-5 bg-bark rounded-full origin-center"
                  animate={mobileOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </motion.div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden bg-cream border-t border-border/50"
          >
            <div className="px-4 py-6 flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-organic text-barklight hover:text-terracotta hover:bg-terracotta/5 font-medium transition-all duration-200"
                  >
                    {t(link.labelKey) || link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 pt-4 mt-3 border-t border-border/50"
              >
                <Link to="/reserver" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 justify-center">
                  {t("nav.book")}
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex justify-center gap-1.5 pt-4"
              >
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                      i18n.language === l
                        ? "bg-terracotta text-white shadow-sm"
                        : "bg-white text-barklight border border-border/50"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
