import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"

const NAV = [
  { to: "/menu", key: "nav.menu" },
  { to: "/a-propos", key: "nav.visit" },
  { to: "/avis", key: "nav.reviews" },
  { to: "/galerie", label: "Galerie" },
  { to: "/contact", label: "Contact" },
]
const LANGS = ["fr", "ar", "es", "en"]

export default function Header() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-sm">
      <div className="ed-divider-full" />
      <div className="max-w-wide mx-auto px-5 md:px-10 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="font-display text-xl tracking-tight text-ink">
          La Casa <span className="italic text-gold">Di Carta</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((l) => (
            <Link key={l.to} to={l.to} className="ed-nav-link">
              {t(l.key) || l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-5">
          {/* Lang */}
          <div className="hidden md:flex items-center gap-1.5">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`text-[10px] font-medium tracking-wider cursor-pointer transition-colors duration-200 ${
                  i18n.language === l ? "text-ink" : "text-inkFaint hover:text-inkMuted"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Link to="/reserver" className="ed-cta hidden md:inline-flex">
            {t("nav.book")}
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            aria-label="Menu"
          >
            <motion.span
              className="block w-6 h-px bg-ink origin-center"
              animate={open ? { rotate: 45, y: 3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
            <motion.span
              className="block w-4 h-px bg-ink"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="block w-6 h-px bg-ink origin-center"
              animate={open ? { rotate: -45, y: -3.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.25 }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden bg-bg border-t border-border"
          >
            <div className="px-5 py-8 flex flex-col gap-5">
              {NAV.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-2xl text-ink hover:text-gold transition-colors"
                  >
                    {t(l.key) || l.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-3 pt-5 mt-3 border-t border-border">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`text-xs font-medium tracking-wider cursor-pointer ${
                      i18n.language === l ? "text-ink" : "text-inkFaint"
                    }`}
                  >{l.toUpperCase()}</button>
                ))}
              </div>
              <Link to="/reserver" onClick={() => setOpen(false)} className="ed-cta justify-center mt-2">
                {t("nav.book")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="ed-divider-full" />
    </header>
  )
}
