import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt } from "../../lib/printReceipt"

const STATUS_LABELS = {
  awaiting_confirmation: "En attente de confirmation",
  new: "Confirmee",
  preparing: "En preparation",
  ready: "Prete",
  out_for_delivery: "En livraison",
  delivered: "Livree",
  cancelled: "Annulee"
}

const ACTIVE_STATUSES = ["awaiting_confirmation", "new", "preparing", "ready", "out_for_delivery"]

// Deux onglets : "En cours" (commandes pas encore terminees) et
// "Historique" (livrees ou annulees, lecture seule - plus de boutons
// d action pour eviter de "livrer" ou "annuler" une commande deja close).
export default function Orders() {
  const [rows, setRows] = useState([])
  const [tab, setTab] = useState("active")

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
    setRows(data || [])
  }
  useEffect(() => {
    load()
    const channel = supabase
      .channel("admin-orders-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const setStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id)
    load()
  }

  const active = rows.filter((o) => ACTIVE_STATUSES.includes(o.status))
  const history = rows.filter((o) => !ACTIVE_STATUSES.includes(o.status))
  const list = tab === "active" ? active : history

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Commandes livraison</h1>
      <p className="text-inkdim text-sm mb-6">
        Les nouvelles commandes passent d abord par Admin &gt; Confirmation des commandes
        avant d apparaitre ici avec le statut "Confirmee".
      </p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("active")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono border ${tab === "active" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          En cours ({active.length})
        </button>
        <button onClick={() => setTab("history")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono border ${tab === "history" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          Historique ({history.length})
        </button>
      </div>

      <div className="grid gap-3">
        {list.map((o) => (
          <div key={o.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <p className="font-medium">{o.phone} - {o.address}</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                o.status === "delivered" ? "bg-basil/20 text-basil"
                  : o.status === "cancelled" ? "bg-red-500/20 text-red-400"
                  : o.status === "awaiting_confirmation" ? "bg-inkdim/20 text-inkdim"
                  : "bg-gold/20 text-gold"
              }`}>{STATUS_LABELS[o.status] || o.status}</span>
            </div>
            <ul className="text-inkdim text-xs mb-2">
              {(o.items || []).map((it, idx) => (
                <li key={idx}>{it.qty} x {it.name} - {it.price * it.qty} MAD</li>
              ))}
            </ul>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="font-mono text-gold">{o.total} MAD</p>
              <div className="flex gap-2 flex-wrap">
                {tab === "active" && o.status !== "awaiting_confirmation" && (
                  <>
                    <button onClick={() => setStatus(o.id, "out_for_delivery")} className="text-xs text-inkdim">En livraison</button>
                    <button onClick={() => setStatus(o.id, "delivered")} className="text-xs text-basil">Livree</button>
                    <button onClick={() => setStatus(o.id, "cancelled")} className="text-xs text-red-400">Annuler</button>
                  </>
                )}
                <button onClick={() => printOrderReceipt(o)} className="text-xs text-gold">Imprimer</button>
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-inkdim text-sm">
            {tab === "active" ? "Aucune commande en cours." : "Aucun historique pour le moment."}
          </p>
        )}
      </div>
    </div>
  )
}
