import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate, useLocation, Navigate } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useLiveAlerts } from "./hooks/useLiveAlerts"
import ConnectionStatus from "../components/ConnectionStatus.jsx"

// Chaque lien precise quels roles peuvent le voir. "cuisine" ne voit que
// l ecran cuisine ; les autres roles voient tout sauf "Equipe" qui est
// reservee a "admin".
const NAV = [
  { to: "/admin", label: "Tableau de bord", end: true, roles: ["admin", "manager", "staff"] },
  { to: "/admin/cuisine", label: "Ecran cuisine", roles: ["admin", "manager", "staff", "cuisine"] },
  { to: "/admin/menu", label: "Menu", roles: ["admin", "manager", "staff"] },
  { to: "/admin/reservations", label: "Reservations", roles: ["admin", "manager", "staff"] },
  { to: "/admin/commandes", label: "Livraisons", roles: ["admin", "manager", "staff"] },
  { to: "/admin/tables", label: "Tables & QR codes", roles: ["admin", "manager", "staff"] },
  { to: "/admin/clients", label: "Clients (CRM)", roles: ["admin", "manager"] },
  { to: "/admin/analytics", label: "Analytics", roles: ["admin", "manager"] },
  { to: "/admin/messages", label: "Messages", roles: ["admin", "manager", "staff"] },
  { to: "/admin/comptabilite", label: "Comptabilite", roles: ["admin", "manager"] },
  { to: "/admin/codes-promo", label: "Codes promo", roles: ["admin", "manager"] },
  { to: "/admin/galerie", label: "Galerie photo", roles: ["admin", "manager"] },
  { to: "/admin/evenements", label: "Evenements & Offres", roles: ["admin", "manager"] },
  { to: "/admin/blog", label: "Blog & Actualites", roles: ["admin", "manager"] },
  { to: "/admin/contenu", label: "Contenu du site", roles: ["admin", "manager"] },
  { to: "/admin/traductions", label: "Traductions", roles: ["admin", "manager"] },
  { to: "/admin/equipe", label: "Equipe & permissions", roles: ["admin"] }
]

export default function AdminLayout() {
  const [session, setSession] = useState(undefined)
  const [role, setRole] = useState(undefined) // undefined = chargement, null = pas dans staff
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { alerts, dismiss, dismissAll } = useLiveAlerts()

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

  if (session === undefined || (session && role === undefined)) {
    return <div className="min-h-screen bg-bg text-ink flex items-center justify-center">Chargement...</div>
  }
  if (!session) return null

  if (role === null) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-serif text-2xl mb-2">Acces non autorise</p>
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
  // Un compte "cuisine" arrivant sur une page qu il ne peut pas voir est
  // renvoye directement vers l ecran cuisine.
  const currentAllowed = NAV.find((item) => item.to === location.pathname)
  if (currentAllowed && !currentAllowed.roles.includes(role)) {
    return <Navigate to="/admin/cuisine" replace />
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col md:flex-row">
      <ConnectionStatus />
      {/* Barre superieure mobile (le menu lateral etait cache sous md, sans
          aucun moyen de naviguer - on ajoute une barre + un menu deroulant) */}
      <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-line">
        <p className="font-serif text-lg">Casa Di Carta</p>
        <button onClick={() => setMobileNavOpen((v) => !v)} className="text-sm text-inkdim border border-line rounded-lg px-3 py-1.5">
          Menu
        </button>
      </div>
      {mobileNavOpen && (
        <nav className="md:hidden border-b border-line p-4 flex flex-col gap-1 bg-bgsoft">
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm flex items-center justify-between ${
                location.pathname === item.to ? "bg-tomato text-paper" : "text-inkdim hover:bg-white/5"
              }`}
            >
              {item.label}
              {(item.to === "/admin/reservations" || item.to === "/admin/commandes") && alerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-tomatoglow" />
              )}
            </Link>
          ))}
          <button onClick={logout} className="mt-2 text-sm text-inkdim hover:text-ink text-left px-3">
            Se deconnecter
          </button>
        </nav>
      )}

      <aside className="w-64 border-r border-line p-6 hidden md:flex flex-col">
        <p className="font-serif text-lg mb-1">Casa Di Carta</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gold mb-8">{role}</p>
        <nav className="flex flex-col gap-1">
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`px-3 py-2.5 rounded-lg text-sm flex items-center justify-between ${
                location.pathname === item.to ? "bg-tomato text-paper" : "text-inkdim hover:bg-white/5"
              }`}
            >
              {item.label}
              {(item.to === "/admin/reservations" || item.to === "/admin/commandes") && alerts.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-tomatoglow" />
              )}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mt-auto text-sm text-inkdim hover:text-ink text-left">
          Se deconnecter
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Outlet />
      </main>

      <div className="fixed bottom-5 right-5 flex flex-col gap-2 z-50 max-w-xs">
        {alerts.length > 1 && (
          <button onClick={dismissAll} className="self-end text-xs text-inkdim underline mb-1">
            Tout marquer comme vu ({alerts.length})
          </button>
        )}
        {alerts.slice(0, 4).map((a) => (
          <div key={a.id} className="bg-bgsoft border border-tomato rounded-xl px-4 py-3 text-sm shadow-2xl flex items-start justify-between gap-3">
            <span>{a.message}</span>
            <button onClick={() => dismiss(a.id)} className="text-inkdim hover:text-ink shrink-0">x</button>
          </div>
        ))}
      </div>
    </div>
  )
}
