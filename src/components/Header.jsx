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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/50 border-b border-white/5">
      <div className="max-w-container mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-accent flex items-center justify-center relative">
            <i className="fas fa-utensils text-black text-base"></i>
            <div className="absolute -inset-1 border border-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div>
            <div className="font-display text-2xl leading-none tracking-wider">LA CASA</div>
            <div className="font-mono text-[10px] text-muted tracking-[0.3em] mt-0.5">TRATTORIA · RABAT</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          <Link to="/menu" className="nav-link">{t("nav.menu")}</Link>
          <Link to="/avis" className="nav-link">{t("nav.reviews")}</Link>
          <Link to="/a-propos" className="nav-link">{t("nav.visit")}</Link>
          <div className="relative" onMouseEnter={() => setMoreOpen(true)} onMouseLeave={() => setMoreOpen(false)}>
            <button className="nav-link">Plus</button>
            {moreOpen && (
              <div className="absolute top-full left-0 pt-3">
                <div className="bg-bg-card border border-line p-2 flex flex-col min-w-[180px]">
                  {MORE_LINKS.map((l) => (
                    <Link key={l.to} to={l.to} className="px-4 py-2.5 text-sm text-fg-dim hover:text-fg hover:bg-bg-card-hover font-heading tracking-wider uppercase transition-colors">
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link to="/contact" className="nav-link">Contact</Link>
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden md:flex items-center gap-3">
            <div className="flex gap-1 font-mono text-[11px]">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={"px-2 py-1 border transition-colors " + (i18n.language === l ? "bg-accent border-accent text-black" : "border-line-light text-muted hover:border-silver-dim")}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <Link
            to="/reserver"
            className="hidden sm:inline-block font-heading text-xs tracking-[0.2em] uppercase text-black bg-silver px-5 py-2.5 hover:bg-white transition-colors"
          >
            {t("nav.book")}
          </Link>
          <button className="lg:hidden text-fg" onClick={() => setOpen(!open)} aria-label="Menu">
            <i className={`fas ${open ? "fa-xmark" : "fa-bars"} text-lg`}></i>
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-bg-darker border-b border-line lg:hidden flex flex-col p-6 gap-4">
          {[
            { to: "/menu", label: t("nav.menu") },
            { to: "/reserver", label: t("nav.book") },
            { to: "/livraison", label: t("dock.delivery") },
            { to: "/avis", label: t("nav.reviews") },
            { to: "/a-propos", label: t("nav.visit") },
            ...MORE_LINKS,
            { to: "/compte", label: "Mon compte" },
          ].map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="font-heading text-lg tracking-wider uppercase text-fg-dim hover:text-fg transition-colors py-2 border-b border-line">
              {l.label}
            </Link>
          ))}
          <div className="flex gap-1.5 font-mono text-[11px] pt-3 border-t border-line">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={"px-3 py-1.5 border " + (i18n.language === l ? "bg-accent border-accent text-black" : "border-line-light text-muted")}
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
