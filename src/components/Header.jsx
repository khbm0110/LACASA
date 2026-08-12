import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "framer-motion"

const LANGS = ["fr", "ar", "es", "en"]
const MORE_LINKS = [
  { to: "/galerie", label: "Galerie" },
  { to: "/evenements", label: "Evenements" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" }
]

// Animation variants for mobile menu
const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0, y: -10 },
  visible: {
    opacity: 1, height: "auto", y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.04 }
  },
  exit: {
    opacity: 0, height: 0, y: -10,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
  }
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
}

// Dropdown animation
const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: {
    opacity: 0, y: -8, scale: 0.96,
    transition: { duration: 0.15 }
  }
}

export default function Header() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  // Hamburger icon animation
  const hamburgerLine = {
    closed: (rotate) => ({ rotate: 0, y: 0 }),
    open: (rotate) => ({ rotate: rotate || 0, y: rotate ? 8 : 0 })
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/80 border-b border-line">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8 py-4">
        <div className="flex items-center">
          <button className="md:hidden text-ink relative w-8 h-8 flex flex-col items-center justify-center gap-1.5" onClick={() => setOpen(!open)} aria-label="Menu">
            <motion.span
              className="block w-5 h-[1.5px] bg-ink origin-center"
              animate={open ? { rotate: 45, y: 4.75 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-[1.5px] bg-ink"
              animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block w-5 h-[1.5px] bg-ink origin-center"
              animate={open ? { rotate: -45, y: -4.75 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-2 font-serif font-semibold text-lg whitespace-nowrap">
            <motion.span
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-tomatoglow to-tomato flex items-center justify-center text-sm font-bold text-white"
              whileHover={{ rotate: 12, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              C
            </motion.span>
            La Casa Di Carta
          </Link>
        </motion.div>

        <nav className="hidden md:flex items-center gap-7 justify-self-end">
          {[
            { to: "/menu", label: t("nav.menu") },
            { to: "/avis", label: t("nav.reviews") },
            { to: "/a-propos", label: t("nav.visit") }
          ].map((link, i) => (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
            >
              <Link to={link.to} className="text-sm text-inkdim hover:text-ink transition relative group">
                {link.label}
                <motion.span
                  className="absolute -bottom-1 left-0 h-[1px] bg-tomato"
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </motion.div>
          ))}

          <div className="relative" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
            <motion.button
              className="text-sm text-inkdim hover:text-ink transition"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              Plus
            </motion.button>
            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full left-0 pt-3 origin-top-left"
                >
                  <div className="bg-bgsoft border border-line rounded-xl p-2 flex flex-col min-w-[140px]">
                    {MORE_LINKS.map((l, i) => (
                      <motion.div
                        key={l.to}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link to={l.to} className="px-3 py-2 rounded-lg text-sm text-inkdim hover:bg-black/5 hover:text-ink transition-colors">
                          {l.label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="flex gap-1 font-mono text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {LANGS.map((l) => (
              <motion.button
                key={l}
                onClick={() => changeLang(l)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={"px-2 py-1 rounded-md border transition-colors " + (i18n.language === l ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim")}
              >
                {l.toUpperCase()}
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link
              to="/reserver"
              className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-white shadow-lg shadow-tomato/20 inline-block"
            >
              <motion.span
                className="flex items-center"
                whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(198,123,92,0.4)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {t("nav.book")}
              </motion.span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/compte" className="text-sm text-inkdim hover:text-ink transition">
              Mon compte
            </Link>
          </motion.div>
        </nav>

        <div className="md:hidden" aria-hidden="true" />
      </div>

      {/* Mobile menu with AnimatePresence */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-full left-0 right-0 bg-bgsoft border-b border-line md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {[
                { to: "/menu", label: t("nav.menu") },
                { to: "/reserver", label: t("nav.book") },
                { to: "/livraison", label: t("dock.delivery") },
                { to: "/avis", label: t("nav.reviews") },
                { to: "/a-propos", label: t("nav.visit") },
                ...MORE_LINKS,
                { to: "/compte", label: "Mon compte" }
              ].map((link, i) => (
                <motion.div key={link.to} variants={menuItemVariants} transition={{ duration: 0.3 }}>
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 px-2 text-inkdim hover:text-ink hover:bg-black/5 rounded-lg transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div variants={menuItemVariants} className="flex gap-1.5 font-mono text-[11px] pt-3 mt-2 border-t border-line">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLang(l)}
                    className={"px-2.5 py-1.5 rounded-md border transition-colors " + (i18n.language === l ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim")}
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
