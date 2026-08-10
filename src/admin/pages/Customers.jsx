import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// CRM simple : agrege les commandes par client pour retrouver rapidement
// vos habitues, leur depense totale et leur derniere visite.
export default function Customers() {
  const [profiles, setProfiles] = useState([])
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("orders").select("id, customer_id, total, created_at, status").not("customer_id", "is", null)
      ])
      setProfiles(p || [])
      setOrders(o || [])
    }
    load()
  }, [])

  const stats = useMemo(() => {
    return profiles.map((p) => {
      const own = orders.filter((o) => o.customer_id === p.id && o.status !== "cancelled")
      const totalSpent = own.reduce((s, o) => s + Number(o.total || 0), 0)
      const lastOrder = own.reduce((max, o) => (!max || o.created_at > max ? o.created_at : max), null)
      return { ...p, ordersCount: own.length, totalSpent, lastOrder }
    }).sort((a, b) => b.totalSpent - a.totalSpent)
  }, [profiles, orders])

  const filtered = stats.filter((c) => (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search))

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Clients (CRM)</h1>
      <p className="text-inkdim text-sm mb-6">Base uniquement sur les clients ayant cree un compte.</p>

      <input placeholder="Rechercher par nom ou telephone..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-6 bg-bgsoft border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-tomato" />

      <div className="grid gap-2">
        <div className="grid grid-cols-5 gap-3 px-4 text-xs text-inkdim font-mono uppercase tracking-wide">
          <span className="col-span-2">Client</span>
          <span>Commandes</span>
          <span>Depense</span>
          <span>Points</span>
        </div>
        {filtered.map((c) => (
          <button key={c.id} onClick={() => setSelected(c)}
            className="grid grid-cols-5 gap-3 bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm text-left hover:border-tomato transition">
            <span className="col-span-2 truncate">{c.name || "Sans nom"} <span className="text-inkdim text-xs">{c.phone}</span></span>
            <span>{c.ordersCount}</span>
            <span className="font-mono text-gold">{c.totalSpent} MAD</span>
            <span>{c.loyalty_points} pts</span>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-inkdim text-sm px-4">Aucun client trouve.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6" onClick={() => setSelected(null)}>
          <div className="bg-bgsoft border border-line rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <p className="font-serif text-xl mb-1">{selected.name || "Sans nom"}</p>
            <p className="text-inkdim text-sm mb-4">{selected.phone}</p>
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="bg-bg border border-line rounded-xl py-3">
                <p className="font-serif text-lg">{selected.ordersCount}</p>
                <p className="text-inkdim text-xs">Commandes</p>
              </div>
              <div className="bg-bg border border-line rounded-xl py-3">
                <p className="font-serif text-lg">{selected.totalSpent}</p>
                <p className="text-inkdim text-xs">MAD depenses</p>
              </div>
              <div className="bg-bg border border-line rounded-xl py-3">
                <p className="font-serif text-lg">{selected.loyalty_points}</p>
                <p className="text-inkdim text-xs">Points</p>
              </div>
            </div>
            <p className="text-inkdim text-xs mb-4">
              Derniere commande : {selected.lastOrder ? new Date(selected.lastOrder).toLocaleDateString() : "-"}
            </p>
            <button onClick={() => setSelected(null)} className="w-full px-4 py-2 rounded-full text-sm border border-line">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
