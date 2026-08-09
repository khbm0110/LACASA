import { useEffect, useState } from "react"
import { Link, useOutletContext } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"
import SalesChart from "../SalesChart.jsx"
import {
  IconCalendar, IconBag, IconUtensils, IconStar, IconChevronDown, IconArrowRight,
  IconPlusCircle, IconQr, IconChart, IconSend, IconClipboard
} from "../icons.jsx"

const QUICK_ACTIONS = [
  { label: "Nouvelle commande", icon: IconBag, to: "/admin/commandes", roles: ["admin", "manager", "staff"] },
  { label: "Nouvelle reservation", icon: IconCalendar, to: "/admin/reservations", roles: ["admin", "manager", "staff"] },
  { label: "Voir le menu", icon: IconUtensils, to: "/admin/menu", roles: ["admin", "manager", "staff"] },
  { label: "QR menu", icon: IconQr, to: "/admin/tables", roles: ["admin", "manager", "staff"] },
  { label: "Ajouter un plat", icon: IconPlusCircle, to: "/admin/menu", roles: ["admin", "manager", "staff"] },
  { label: "Rapports des ventes", icon: IconChart, to: "/admin/analytics", roles: ["admin", "manager"] },
  { label: "Envoyer un message", icon: IconSend, to: "/admin/messages", roles: ["admin", "manager", "staff"] }
]

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function pctChange(today, yesterday) {
  if (yesterday === 0) return today > 0 ? 100 : 0
  return Math.round(((today - yesterday) / yesterday) * 100)
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const min = Math.round(diffMs / 60000)
  if (min < 1) return "a l instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  return `il y a ${d} j`
}

export default function Dashboard() {
  const { role } = useOutletContext() || {}
  const [stats, setStats] = useState({
    reservationsToday: 0, reservationsYesterday: 0,
    ordersToday: 0, ordersYesterday: 0,
    menuItems: 0, categories: 0
  })
  const [activity, setActivity] = useState([])
  const [salesToday, setSalesToday] = useState(0)
  const [salesYesterday, setSalesYesterday] = useState(0)
  const [hourly, setHourly] = useState(Array(24).fill(0))
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const now = new Date()
      const todayStart = startOfDay(now)
      const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)

      const [
        resToday, resYesterday,
        ordToday, ordYesterday,
        menuCount, menuRows,
        recentRes, recentOrders, recentReviews,
        todayOrders, yesterdayOrders,
        activeEvents
      ] = await Promise.all([
        supabase.from("reservations").select("*", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase.from("reservations").select("*", { count: "exact", head: true }).gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("order_type", "delivery").gte("created_at", todayStart.toISOString()),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("order_type", "delivery").gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
        supabase.from("menu_items").select("*", { count: "exact", head: true }),
        supabase.from("menu_items").select("category"),
        supabase.from("reservations").select("id, name, guests, date, time, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("orders").select("id, order_type, total, created_at").order("created_at", { ascending: false }).limit(4),
        supabase.from("google_reviews").select("id, author_name, rating, time").order("time", { ascending: false }).limit(2),
        supabase.from("orders").select("total, created_at").gte("created_at", todayStart.toISOString()),
        supabase.from("orders").select("total, created_at").gte("created_at", yesterdayStart.toISOString()).lt("created_at", todayStart.toISOString()),
        supabase.from("events").select("*").eq("active", true).order("created_at", { ascending: false }).limit(2)
      ])

      setStats({
        reservationsToday: resToday.count || 0,
        reservationsYesterday: resYesterday.count || 0,
        ordersToday: ordToday.count || 0,
        ordersYesterday: ordYesterday.count || 0,
        menuItems: menuCount.count || 0,
        categories: new Set((menuRows.data || []).map((m) => m.category)).size
      })

      // Fusionne les 3 sources en un seul fil d activite, trie par date desc
      const feed = [
        ...(recentRes.data || []).map((r) => ({
          id: `res-${r.id}`, kind: "reservation", created_at: r.created_at,
          title: "Nouvelle reservation",
          subtitle: `Table - ${r.time || ""} - ${r.guests} personne${r.guests > 1 ? "s" : ""}`.trim()
        })),
        ...(recentOrders.data || []).map((o) => ({
          id: `ord-${o.id}`, kind: "order", created_at: o.created_at,
          title: "Nouvelle commande",
          subtitle: `${o.order_type === "dine_in" ? "Sur place" : "Livraison"} - ${o.total} MAD`
        })),
        ...(recentReviews.data || []).map((rv) => ({
          id: `rev-${rv.id}`, kind: "review", created_at: rv.time,
          title: "Avis client",
          subtitle: "\u2605".repeat(rv.rating)
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
      setActivity(feed)

      const sumToday = (todayOrders.data || []).reduce((s, o) => s + (o.total || 0), 0)
      const sumYesterday = (yesterdayOrders.data || []).reduce((s, o) => s + (o.total || 0), 0)
      setSalesToday(sumToday)
      setSalesYesterday(sumYesterday)

      const buckets = Array(24).fill(0)
      let running = 0
      const byHour = Array(24).fill(0)
      ;(todayOrders.data || []).forEach((o) => {
        const h = new Date(o.created_at).getHours()
        byHour[h] += o.total || 0
      })
      for (let h = 0; h < 24; h++) { running += byHour[h]; buckets[h] = running }
      setHourly(buckets)

      setEvents(activeEvents.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const resTrend = pctChange(stats.reservationsToday, stats.reservationsYesterday)
  const ordTrend = pctChange(stats.ordersToday, stats.ordersYesterday)
  const salesTrend = pctChange(salesToday, salesYesterday)

  const visibleActions = QUICK_ACTIONS.filter((a) => !role || a.roles.includes(role))
  const canManageEvents = role === "admin" || role === "manager"

  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="section-marker" style={{ marginBottom: "0.6rem" }}><span>Tableau de bord</span></div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.25rem", lineHeight: 1 }}>Bienvenue, La Casa Di Carta 👋</h1>
          <p className="text-inkdim text-sm mt-2">Voici un aper\u00e7u de votre activit\u00e9 aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border border-line text-sm text-inkdim">
          <IconCalendar size={16} />
          {today}
          <IconChevronDown size={16} />
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={IconCalendar}
          label="Reservations"
          value={stats.reservationsToday}
          trend={resTrend}
          trendLabel="vs hier"
        />
        <StatCard
          icon={IconBag}
          label="Commandes livraison"
          value={stats.ordersToday}
          trend={ordTrend}
          trendLabel="vs hier"
        />
        <StatCard
          icon={IconUtensils}
          label="Plats au menu"
          value={stats.menuItems}
          subtitle={`Cat\u00e9gories actives: ${stats.categories}`}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5 mb-6">
        {/* Activite recente */}
        <div className="info-card p-5">
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem" }} className="mb-4">Activit\u00e9 r\u00e9cente</p>
          <div className="grid gap-1">
            {loading && <p className="text-inkdim text-sm">Chargement...</p>}
            {!loading && activity.length === 0 && <p className="text-inkdim text-sm">Aucune activit\u00e9 pour le moment.</p>}
            {activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-line-light last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                    a.kind === "review" ? "bg-gold/15 text-gold" : "bg-tomato/15 text-tomatoglow"
                  }`}>
                    {a.kind === "reservation" && <IconCalendar size={16} />}
                    {a.kind === "order" && <IconBag size={16} />}
                    {a.kind === "review" && <IconStar size={16} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-inkdim truncate">{a.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-inkdim whitespace-nowrap">{timeAgo(a.created_at)}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-basil" />
                </div>
              </div>
            ))}
          </div>
          <Link to="/admin/commandes" className="link-underline mt-4 flex items-center gap-1.5 text-sm text-inkdim hover:text-ink w-fit">
            Voir toutes les activit\u00e9s <IconChevronDown size={14} />
          </Link>
        </div>

        {/* Apercu des ventes */}
        <div className="info-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem" }}>Aper\u00e7u des ventes</p>
            <span className="flex items-center gap-1 text-xs text-inkdim border border-line px-3 py-1.5">
              Aujourd'hui <IconChevronDown size={13} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-4">
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem" }}>{salesToday.toLocaleString("fr-FR")} MAD</span>
            <span className={`text-xs font-mono ${salesTrend >= 0 ? "text-basil" : "text-red-400"}`}>
              {salesTrend >= 0 ? "+" : ""}{salesTrend}% vs hier
            </span>
          </div>
          <SalesChart hourly={hourly} height={180} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* Acces rapides */}
        <div className="info-card p-5">
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem" }} className="mb-4">Acc\u00e8s rapides</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visibleActions.map((a) => (
              <Link key={a.label} to={a.to}
                className="flex flex-col items-center justify-center gap-2 text-center bg-bg border border-line px-3 py-5 hover:border-tomato hover:-translate-y-0.5 transition">
                <a.icon size={22} className="text-gold" />
                <span className="text-xs text-inkdim leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Evenements & Offres */}
        <div className="info-card p-5">
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem" }} className="mb-4">\u00c9v\u00e9nements & Offres</p>
          <div className="grid gap-3">
            {events.length === 0 && <p className="text-inkdim text-sm">Aucun \u00e9v\u00e9nement actif.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex gap-3 items-center bg-bg border border-line p-3">
                {e.image_url ? (
                  <img src={e.image_url} alt={e.title} className="w-14 h-14 object-cover shrink-0" />
                ) : (
                  <span className="w-14 h-14 bg-tomato/15 flex items-center justify-center shrink-0">
                    <IconClipboard size={20} className="text-tomatoglow" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.title}</p>
                  <p className="text-xs text-inkdim truncate">{e.description}</p>
                </div>
              </div>
            ))}
          </div>
          {canManageEvents && (
            <Link to="/admin/evenements" className="link-underline mt-4 inline-flex items-center gap-1.5 text-sm text-gold">
              Voir tous <IconArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, trend, trendLabel, subtitle }) {
  return (
    <div className="info-card p-5 flex items-start gap-4">
      <span className="w-12 h-12 bg-tomato/15 text-tomatoglow flex items-center justify-center shrink-0">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-inkdim mb-1">{label}</p>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", lineHeight: 1 }} className="mb-1.5">{value}</p>
        {typeof trend === "number" && (
          <p className={`text-xs font-mono ${trend >= 0 ? "text-basil" : "text-red-400"}`}>
            {trend >= 0 ? "+" : ""}{trend}% {trendLabel}
          </p>
        )}
        {subtitle && <p className="text-xs text-inkdim">{subtitle}</p>}
      </div>
    </div>
  )
}
