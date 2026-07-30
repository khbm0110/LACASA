import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt } from "../../lib/printReceipt"

// Ecran cuisine (KDS - Kitchen Display System) : pense pour une tablette
// ou un ecran fixe en cuisine. Gros boutons, mise a jour en direct via
// Supabase Realtime, colonnes par etape de preparation.
const COLUMNS = [
  { key: "new", label: "Nouvelles", next: "preparing", nextLabel: "Commencer" },
  { key: "preparing", label: "En preparation", next: "ready", nextLabel: "Pret" },
  { key: "ready", label: "Prêtes", next: null, nextLabel: null }
]

export default function Kitchen() {
  const [orders, setOrders] = useState([])

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["new", "preparing", "ready"])
      .order("created_at", { ascending: true })
    setOrders(data || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const advance = async (order, nextStatus) => {
    const finalStatus = nextStatus === "ready" && order.order_type !== "dine_in" ? "ready" : nextStatus
    await supabase.from("orders").update({ status: finalStatus }).eq("id", order.id)
  }

  // Pour une commande a livrer, l etape "Prete" doit ensuite passer en
  // livraison depuis Admin > Livraisons (le livreur part avec). Pour une
  // commande sur place, "Prete" = a servir, geree ici jusqu au bout.
  const markServedOrSend = async (order) => {
    const next = order.order_type === "dine_in" ? "delivered" : "out_for_delivery"
    await supabase.from("orders").update({ status: next }).eq("id", order.id)
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Ecran cuisine</h1>
      <div className="grid md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => (
          <div key={col.key}>
            <p className="font-mono text-xs uppercase tracking-widest text-gold mb-3">
              {col.label} ({orders.filter((o) => o.status === col.key).length})
            </p>
            <div className="grid gap-3">
              {orders.filter((o) => o.status === col.key).map((o) => (
                <div key={o.id} className="bg-bgsoft border border-line rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded-full ${
                      o.order_type === "dine_in" ? "bg-basil/20 text-basil" : "bg-gold/20 text-gold"
                    }`}>
                      {o.order_type === "dine_in" ? "Sur place" : "Livraison"}
                    </span>
                    <span className="text-xs text-inkdim">{new Date(o.created_at).toLocaleTimeString().slice(0, 5)}</span>
                  </div>
                  <ul className="text-sm mb-3">
                    {(o.items || []).map((it, idx) => (
                      <li key={idx}>{it.qty} x {it.name}</li>
                    ))}
                  </ul>
                  <p className="font-mono text-gold text-sm mb-3">{o.total} MAD</p>
                  {col.key === "ready" ? (
                    <button onClick={() => markServedOrSend(o)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                      {o.order_type === "dine_in" ? "Marquer servie" : "Envoyer en livraison"}
                    </button>
                  ) : (
                    <button onClick={() => advance(o, col.next)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold border border-line hover:bg-white/5">
                      {col.nextLabel}
                    </button>
                  )}
                  <button onClick={() => printOrderReceipt(o)}
                    className="w-full mt-2 px-3 py-2 rounded-xl text-xs border border-line text-inkdim hover:bg-white/5">
                    Imprimer le ticket
                  </button>
                </div>
              ))}
              {orders.filter((o) => o.status === col.key).length === 0 && (
                <p className="text-inkdim text-sm">Rien pour le moment.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
