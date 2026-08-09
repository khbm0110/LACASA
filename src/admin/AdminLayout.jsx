import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useLiveAlerts } from "./hooks/useLiveAlerts"
import { useNavCounts } from "./hooks/useNavCounts"
import ConnectionStatus from "../components/ConnectionStatus.jsx"
import { ToastProvider } from "./ui/Toast.jsx"
import { ConfirmProvider } from "./ui/ConfirmDialog.jsx"
import { BranchProvider, useBranch } from "./BranchContext.jsx"
import {
  IconGrid, IconClipboard, IconMonitor, IconUtensils, IconCalendar, IconBox, IconQr,
  IconUser, IconUsers, IconChart, IconMessage, IconReceipt, IconTag, IconImage,
  IconMegaphone, IconNews, IconLayout, IconGlobe, IconPower, IconBell, IconMenuLines, IconCoins,
  IconWarehouse, IconTruck, IconClipboardList, IconStar, IconSliders, IconStore, IconArchive
} from "./icons.jsx"

const LANGS = ["fr", "ar", "es", "en"]

// Chaque lien precise quels roles peuvent le voir. "cuisine" ne voit que
// l ecran cuisine ; les autres roles voient tout sauf "Equipe" qui est
// reservee a "admin". countKey relie le lien a une pastille chiffree
// (voir useNavCounts) ; icon est le composant SVG affiche dans le menu.
const NAV = [
  { to: "/admin", label: "Tableau de bord", end: true, roles: ["admin", "manager", "staff"], icon: IconGrid },
  { to: "/admin/confirmation", label: "Commandes", roles: ["admin"], icon: IconClipboard, countKey: "confirmation" },
  { to: "/admin/cuisine", label: "Ecran cuisine", roles: ["admin", "manager", "staff", "cuisine"], icon: IconMonitor, countKey: "kitchen" },
  { to: "/admin/pos", label: "Point de vente", roles: ["admin", "manager", "staff"], icon: IconCoins },
  { to: "/admin/ventes", label: "Ventes & remboursements", roles: ["admin", "manager"], icon: IconReceipt },
  { to: "/admin/caisses", label: "Caisses (historique)", roles: ["admin", "manager"], icon: IconArchive },
  { to: "/admin/rapports", label: "Rapports", roles: ["admin", "manager"], icon: IconChart },
  { to: "/admin/menu", label: "Menu", roles: ["admin", "manager", "staff"], icon: IconUtensils },
  { to: "/admin/reservations", label: "Reservations", roles: ["admin", "manager", "staff"], icon: IconCalendar, countKey: "reservations" },
  { to: "/admin/commandes", label: "Livraisons", roles: ["admin", "manager", "staff"], icon: IconBox, countKey: "deliveries" },
  { to: "/admin/tables", label: "Tables & QR codes", roles: ["admin", "manager", "staff"], icon: IconQr },
  { to: "/admin/inventaire", label: "Inventaire (stock)", roles: ["admin", "manager"], icon: IconWarehouse },
  { to: "/admin/fournisseurs", label: "Fournisseurs", roles: ["admin", "manager"], icon: IconTruck },
  { to: "/admin/achats", label: "Achats", roles: ["admin", "manager"], icon: IconClipboardList },
  { to: "/admin/recettes", label: "Recettes", roles: ["admin", "manager"], icon: IconUtensils },
  { to: "/admin/modificateurs", label: "Modificateurs", roles: ["admin", "manager"], icon: IconSliders },
  { to: "/admin/formules", label: "Formules (combos)", roles: ["admin", "manager", "staff"], icon: IconStar },
  { to: "/admin/etablissements", label: "Etablissements", roles: ["admin"], icon: IconStore },
  { to: "/admin/clients", label: "Clients (CRM)", roles: ["admin", "manager"], icon: IconUser },
  { to: "/admin/analytics", label: "Analytics", roles: ["admin", "manager"], icon: IconChart },
  { to: "/admin/messages", label: "Messages", roles: ["admin", "manager", "staff"], icon: IconMessage, countKey: "messages" },
  { to: "/admin/comptabilite", label: "Comptabilite", roles: ["admin", "manager"], icon: IconReceipt },
  { to: "/admin/codes-promo", label: "Codes promo", roles: ["admin", "manager"], icon: IconTag },
  { to: "/admin/galerie", label: "Galerie photo", roles: ["admin", "manager"], icon: IconImage },
  { to: "/admin/evenements", label: "Evenements & Offres", roles: ["admin", "manager"], icon: IconMegaphone },
  { to: "/admin/blog", label: "Blog & Actualites", roles: ["admin", "manager"], icon: IconNews },
  { to: "/admin/contenu", label: "Contenu du site", roles: ["admin", "manager"], icon: IconLayout },
  { to: "/admin/traductions", label: "Traductions", roles: ["admin", "manager"], icon: IconGlobe },
  { to: "/admin/equipe", label: "Equipe & permissions", roles: ["admin"], icon: IconUsers }
]

export default function AdminLayout() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <BranchProvider>
          <AdminLayoutInner />
        </BranchProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

function AdminLayoutInner() {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined) // undefined = chargement, null = pas dans staff
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { i18n } = useTranslation()
  const { alerts, dismiss, dismissAll } = useLiveAlerts()
  const navCounts = useNavCounts()
  const { branches, activeBranchId, setActiveBranchId } = useBranch()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === null) { navigate("/admin/login"); return }
    if (!session) return
    async function loadRole() {
      const { data } = await supabase.from("staff").select("role").eq("id", session.user.id).single()
      setRole(data ? data.role : null)
    }
    loadRole()
  }, [session, navigate])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const changeLang = (lng) => {
    i18n.changeLanguage(lng)
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lng
  }

  if (session === undefined || (session && role === undefined)) {
    return <div className="min-h-screen bg-bg text-ink flex items-center justify-center">Chargement...</div>
  }
  if (!session) return null

  if (role === null) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-6 text-center">
        <div>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem" }} className="mb-2">Acces non autorise</p>
          <p className="text-inkdim text-sm max-w-sm">
            Votre compte n est pas encore rattache a l equipe. Demandez a un administrateur
            de vous ajouter depuis Admin &gt; Equipe &amp; permissions.
          </p>
          <button onClick={() => supabase.auth.signOut().then(() => navigate("/admin/login"))}
            className="mt-6 text-sm text-inkdim underline">Se deconnecter</button>
        </div>
      </div>
    )
  }

  const logout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login")
  }

  const visibleNav = NAV.filter((item) => item.roles.includes(role))
  // Un compte arrivant sur une page qu il ne peut pas voir est renvoye
  // directement vers l ecran cuisine.
  const currentAllowed = NAV.find((item) => item.to === location.pathname)
  if (currentAllowed && !currentAllowed.roles.includes(role)) {
    return <Navigate to="/admin/cuisine" replace />
  }

  const badgeAlertCount = alerts.length

  const NavLink = ({ item, onClick }) => {
    const active = location.pathname === item.to
    const Icon = item.icon
    const count = item.countKey ? navCounts[item.countKey] : 0
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={`px-3 py-2.5 text-sm flex items-center gap-3 transition ${
          active ? "bg-tomato text-black" : "text-inkdim hover:bg-white/5 hover:text-ink"
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {count > 0 && (
          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 min-w-[18px] text-center ${
            active ? "bg-black/20 text-black" : "bg-tomato/20 text-tomatoglow"
          }`}>
            {count}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <ConnectionStatus />

      {/* Barre superieure : logo, changement de langue, notifications, retour au site */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 md:px-6 h-16 border-b border-line bg-bgsoft">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setMobileNavOpen((v) => !v)} className="md:hidden text-inkdim hover:text-ink p-1.5 -ml-1.5" aria-label="Menu">
            <IconMenuLines size={22} />
          </button>
          <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 bg-tomato flex items-center justify-center text-sm font-bold text-black shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem" }}>
              C
            </span>
            <span className="min-w-0 hidden sm:block">
              <span className="block leading-tight truncate" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", letterSpacing: "0.03em" }}>La Casa Di Carta</span>
              <span className="block text-[10px] text-gold leading-tight truncate font-mono uppercase tracking-widest">Cuisine Italienne</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {branches.length > 1 && (
            <select
              value={activeBranchId || ""}
              onChange={(e) => setActiveBranchId(e.target.value)}
              className="hidden sm:block bg-bg border border-line px-2.5 py-1.5 text-xs outline-none focus:border-tomato max-w-[160px]"
            >
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <div className="hidden sm:flex gap-1 font-mono text-[11px]">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => changeLang(l)}
                className={`px-2.5 py-1.5 border ${i18n.language === l ? "bg-tomato border-tomato text-black" : "border-line text-inkdim hover:text-ink"}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="relative">
            <button onClick={() => setNotifOpen((v) => !v)} className="relative text-inkdim hover:text-ink p-2" aria-label="Notifications">
              <IconBell size={20} />
              {badgeAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-tomato text-black text-[9px] font-bold flex items-center justify-center">
                  {badgeAlertCount > 9 ? "9+" : badgeAlertCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 info-card notch-corner shadow-2xl p-2 z-50">
                {alerts.length === 0 ? (
                  <p className="text-inkdim text-xs p-3">Aucune alerte pour le moment.</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <span className="text-xs text-inkdim">{alerts.length} alerte(s)</span>
                      <button onClick={dismissAll} className="text-xs text-gold hover:underline">Tout marquer comme vu</button>
                    </div>
                    <div className="grid gap-1 max-h-72 overflow-y-auto">
                      {alerts.map((a) => (
                        <div key={a.id} className="flex items-start justify-between gap-2 px-2 py-2 hover:bg-white/5 text-xs">
                          <span className="text-ink">{a.message}</span>
                          <button onClick={() => dismiss(a.id)} className="text-inkdim hover:text-ink shrink-0">&times;</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border border-line hover:border-line-light transition"
          >
            Voir le site
            <span aria-hidden>&rarr;</span>
          </a>
        </div>
      </header>

      <div className="flex">
        {/* Menu lateral (desktop) */}
        <aside className="w-64 border-r border-line p-4 hidden md:flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)]">
          <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
            {visibleNav.map((item) => <NavLink key={item.to} item={item} />)}
          </nav>
          <div className="pt-3 mt-3 border-t border-line">
            <p className="font-mono text-[10px] uppercase tracking-widest text-inkdim px-3 mb-2">{role}</p>
            <button onClick={logout} className="w-full px-3 py-2.5 text-sm flex items-center gap-3 text-red-400 hover:bg-red-400/10 transition">
              <IconPower size={18} />
              Se deconnecter
            </button>
          </div>
        </aside>

        {/* Menu lateral (mobile, en tiroir) */}
        {mobileNavOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setMobileNavOpen(false)} />
            <aside className="fixed top-16 left-0 bottom-0 w-72 bg-bgsoft border-r border-line p-4 z-40 md:hidden flex flex-col overflow-y-auto">
              <nav className="flex flex-col gap-1 flex-1">
                {visibleNav.map((item) => <NavLink key={item.to} item={item} onClick={() => setMobileNavOpen(false)} />)}
              </nav>
              <div className="pt-3 mt-3 border-t border-line">
                <div className="flex gap-1 font-mono text-[11px] px-1 mb-3">
                  {LANGS.map((l) => (
                    <button key={l} onClick={() => changeLang(l)}
                      className={`px-2.5 py-1.5 border ${i18n.language === l ? "bg-tomato border-tomato text-black" : "border-line text-inkdim"}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-inkdim px-3 mb-2">{role}</p>
                <button onClick={logout} className="w-full px-3 py-2.5 text-sm flex items-center gap-3 text-red-400 hover:bg-red-400/10">
                  <IconPower size={18} />
                  Se deconnecter
                </button>
              </div>
            </aside>
          </>
        )}

        <main className="flex-1 min-w-0 p-5 md:p-10">
          <Outlet context={{ role }} />
        </main>
      </div>

      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 max-w-xs">
        {alerts.length > 1 && (
          <button onClick={dismissAll} className="self-end text-xs text-inkdim underline mb-1">
            Tout marquer comme vu ({alerts.length})
          </button>
        )}
        {alerts.slice(0, 4).map((a) => (
          <div key={a.id} className="info-card border-tomato px-4 py-3 text-sm shadow-2xl flex items-start justify-between gap-3">
            <span>{a.message}</span>
            <button onClick={() => dismiss(a.id)} className="text-inkdim hover:text-ink shrink-0">x</button>
          </div>
        ))}
      </div>
    </div>
  )
}
