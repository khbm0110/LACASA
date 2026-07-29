import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Tableau analytics sans dependance externe (barres CSS plutot qu une
// librairie de graphiques). Pour un vrai suivi du trafic (sources,
// appareils, taux de rebond), ajoutez plutot Google Analytics ou Plausible
// via un script dans index.html - ici on couvre le trafic de base (vues de
// page issues de page_views) et surtout des metriques utiles au restaurant :
// plats les plus vendus, nouveaux clients, usage des codes promo.
export default function Analytics() {
  const [range, setRange] = useState("7")
  const [views, setViews] = useState([])
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    async function load() {
      const since = new Date()
      since.setDate(since.getDate() - Number(range))
      const [{ data: v }, { data: o }, { data: c }] = await Promise.all([
        supabase.from("page_views").select("path, created_at").gte("created_at", since.toISOString()),
        supabase.from("orders").select("items, total, promo_code, created_at, status").gte("created_at", since.toISOString()),
        supabase.from("profiles").select("id, created_at").gte("created_at", since.toISOString())
      ])
      setViews(v || [])
      setOrders((o || []).filter((x) => x.status !== "cancelled"))
      setCustomers(c || [])
    }
    load()
  }, [range])

  // Pages les plus vues
  const viewsByPath = {}
  views.forEach((v) => { viewsByPath[v.path] = (viewsByPath[v.path] || 0) + 1 })
  const topPages = Object.entries(viewsByPath).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxViews = topPages[0]?.[1] || 1

  // Plats les plus vendus
  const itemCounts = {}
  orders.forEach((o) => (o.items || []).forEach((it) => {
    itemCounts[it.name] = (itemCounts[it.name] || 0) + it.qty
  }))
  const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxItem = topItems[0]?.[1] || 1

  // Usage des codes promo
  const promoCounts = {}
  orders.forEach((o) => { if (o.promo_code) promoCounts[o.promo_code] = (promoCounts[o.promo_code] || 0) + 1 })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl">Analytics</h1>
        <select value={range} onChange={(e) => setRange(e.target.value)}
          className="bg-bgsoft border border-line rounded-xl px-3 py-2 text-sm">
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Card label="Vues de page" value={views.length} />
        <Card label="Nouveaux clients" value={customers.length} />
        <Card label="Commandes" value={orders.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-serif text-xl mb-4">Pages les plus visitees</h2>
          <div className="grid gap-2">
            {topPages.map(([path, count]) => (
              <div key={path}>
                <div className="flex justify-between text-xs text-inkdim mb-1">
                  <span className="font-mono">{path}</span><span>{count}</span>
                </div>
                <div className="h-2 bg-bgsoft rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-tomatoglow to-tomato" style={{ width: `${(count / maxViews) * 100}%` }} />
                </div>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-inkdim text-sm">Pas encore de donnees.</p>}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl mb-4">Plats les plus vendus</h2>
          <div className="grid gap-2">
            {topItems.map(([name, qty]) => (
              <div key={name}>
                <div className="flex justify-between text-xs text-inkdim mb-1">
                  <span>{name}</span><span>{qty}</span>
                </div>
                <div className="h-2 bg-bgsoft rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold to-basil" style={{ width: `${(qty / maxItem) * 100}%` }} />
                </div>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-inkdim text-sm">Pas encore de donnees.</p>}
          </div>
        </div>
      </div>

      {Object.keys(promoCounts).length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-xl mb-4">Usage des codes promo</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(promoCounts).map(([code, count]) => (
              <div key={code} className="bg-bgsoft border border-line rounded-xl px-4 py-2 text-sm">
                <span className="font-mono">{code}</span> <span className="text-inkdim">x{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="bg-bgsoft border border-line rounded-2xl p-6">
      <p className="text-inkdim text-sm mb-2">{label}</p>
      <p className="font-serif text-4xl">{value}</p>
    </div>
  )
}
