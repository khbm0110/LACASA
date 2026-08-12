import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
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
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isHome = location.pathname === "/"

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  const navBg = !isHome || scrolled
    ? "bg-void/80 backdrop-blur-xl border-b border-white/[0.04]"
    : "bg-transparent border-b border-transparent"

  const textColor = !isHome || scrolled ? "text-ivory" : "text-white"

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="max-w-wide mx-auto px-5 md:px-10 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link to="/" className={`font-display text-lg md:text-xl tracking-tight ${textColor} transition-colors duration-500`}>
          La Casa <span className="italic text-goldBright">Di Carta</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((l) => (
            <Link key={l.to} to={l.to} className="nav-link">
              {t(l.key) || l.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-5">
          {/* Lang Switcher */}
          <div className="hidden md:flex items-center gap-1">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`text-[10px] font-mono font-medium tracking-widest cursor-pointer transition-all duration-300 px-1.5 py-0.5 rounded ${
                  i18n.language === l
                    ? "text-goldBright"
                    : "text-smoke/50 hover:text-ivory/60"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Link to="/reserver" className="btn-gold hidden md:inline-flex text-[11px] px-6 py-3">
            {t("nav.book")}
          </Link>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 cursor-pointer relative z-50"
            aria-label="Menu"
          >
            <motion.span
              className="block w-6 h-px bg-ivory origin-center"
              animate={open ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className="block w-4 h-px bg-ivory"
              animate={open ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-6 h-px bg-ivory origin-center"
              animate={open ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu — Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-void/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="flex flex-col justify-center items-center h-full gap-8">
              {NAV.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className="font-display text-3xl text-ivory hover:text-goldBright transition-colors duration-300"
                  >
                    {t(l.key) || l.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex gap-4 mt-6"
              >
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={`text-xs font-mono tracking-widest cursor-pointer transition-colors ${
                      i18n.language === l ? "text-goldBright" : "text-smoke/40"
                    }`}
                  >{l.toUpperCase()}</button>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link to="/reserver" onClick={() => setOpen(false)} className="btn-gold mt-4">
                  {t("nav.book")}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
