import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

const LANGS = ["fr", "ar", "es", "en"]
const MORE_LINKS = [
  { to: "/galerie", label: "Galerie" },
  { to: "/evenements", label: "Evenements" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" }
]

export default function Header() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-bg/70 border-b border-line">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 md:px-8 py-4">
        <div className="flex items-center">
          <button className="md:hidden text-ink" onClick={() => setOpen(!open)} aria-label="Menu">
            Menu
          </button>
        </div>

        <Link to="/" className="flex items-center gap-2 font-serif font-semibold text-lg whitespace-nowrap">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-tomatoglow to-tomato flex items-center justify-center text-sm font-bold text-[#1a0d05]">
            C
          </span>
          La Casa Di Carta
        </Link>

        <nav className="hidden md:flex items-center gap-7 justify-self-end">
          <Link to="/menu" className="text-sm text-inkdim hover:text-ink transition">{t("nav.menu")}</Link>
          <Link to="/avis" className="text-sm text-inkdim hover:text-ink transition">{t("nav.reviews")}</Link>
          <Link to="/a-propos" className="text-sm text-inkdim hover:text-ink transition">{t("nav.visit")}</Link>

          <div className="relative" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
            <button className="text-sm text-inkdim hover:text-ink transition">Plus</button>
            {moreOpen && (
              <div className="absolute top-full left-0 pt-3">
                <div className="bg-bgsoft border border-line rounded-xl p-2 flex flex-col min-w-[140px]">
                  {MORE_LINKS.map((l) => (
                    <Link key={l.to} to={l.to} className="px-3 py-2 rounded-lg text-sm text-inkdim hover:bg-white/5 hover:text-ink">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-1 font-mono text-[11px]">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={"px-2 py-1 rounded-md border " + (i18n.language === l ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim")}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <Link
            to="/reserver"
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] shadow-lg shadow-tomato/30 hover:-translate-y-0.5 transition"
          >
            {t("nav.book")}
          </Link>
          <Link to="/compte" className="text-sm text-inkdim hover:text-ink transition">
            Mon compte
          </Link>
        </nav>

        {/* Espace reserve pour equilibrer la grille et garder le logo au centre sur mobile */}
        <div className="md:hidden" aria-hidden="true" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-bgsoft border-b border-line md:hidden flex flex-col p-4 gap-3">
          <Link to="/menu" onClick={() => setOpen(false)}>{t("nav.menu")}</Link>
          <Link to="/reserver" onClick={() => setOpen(false)}>{t("nav.book")}</Link>
          <Link to="/livraison" onClick={() => setOpen(false)}>{t("dock.delivery")}</Link>
          <Link to="/avis" onClick={() => setOpen(false)}>{t("nav.reviews")}</Link>
          <Link to="/a-propos" onClick={() => setOpen(false)}>{t("nav.visit")}</Link>
          {MORE_LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link to="/compte" onClick={() => setOpen(false)}>Mon compte</Link>
          <div className="flex gap-1.5 font-mono text-[11px] pt-2 border-t border-line">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={"px-2.5 py-1.5 rounded-md border " + (i18n.language === l ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim")}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
