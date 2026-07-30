import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt } from "../../lib/printReceipt"

// Page de validation, reservee au role "admin" (voir AdminLayout : ce n est
// PAS accessible a manager/staff/cuisine). Objectif : un responsable
// verifie et confirme les reservations et commandes livraison AVANT
// qu elles n apparaissent sur l ecran cuisine - ca filtre les demandes
// invalides (faux numero, doublon...) avant que la cuisine ne s active.
//
// Les commandes prises via le QR code a table (order_type = "dine_in")
// n ont PAS besoin de cette etape : le client est physiquement present au
// restaurant, elles apparaissent donc directement sur l ecran cuisine.
export default function OrderConfirmation() {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])

  const load = async () => {
    const [{ data: o }, { data: r }] = await Promise.all([
      supabase.from("orders").select("*").eq("status", "awaiting_confirmation").order("created_at"),
      supabase.from("reservations").select("*").eq("status", "pending").order("created_at")
    ])
    setOrders(o || [])
    setReservations(r || [])
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel("order-confirmation")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const confirmOrder = async (order) => {
    // Passe la commande a "new" : c est ce statut que l ecran cuisine
    // (Admin > Ecran cuisine) surveille, donc elle y apparait a l instant.
    await supabase.from("orders").update({ status: "new" }).eq("id", order.id)
  }
  const rejectOrder = async (order) => {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id)
  }
  const confirmReservation = async (id) => {
    await supabase.from("reservations").update({ status: "confirmed" }).eq("id", id)
  }
  const rejectReservation = async (id) => {
    await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id)
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Confirmation des commandes</h1>
      <p className="text-inkdim text-sm mb-8 max-w-2xl">
        Verifiez chaque demande avant qu elle ne parte en cuisine. Les commandes passees
        depuis une table (QR code) n apparaissent pas ici - elles vont directement en cuisine.
      </p>

      <h2 className="font-serif text-xl mb-4">Commandes livraison en attente ({orders.length})</h2>
      <div className="grid gap-3 mb-12">
        {orders.map((o) => (
          <div key={o.id} className="bg-bgsoft border border-line rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-sm">{o.phone} - {o.address}</p>
                <p className="text-inkdim text-xs mt-1">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <span className="font-mono text-gold">{o.total} MAD</span>
            </div>
            <ul className="text-sm text-inkdim mb-4">
              {(o.items || []).map((it, idx) => (
                <li key={idx}>{it.qty} x {it.name} - {it.qty * it.price} MAD</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => confirmOrder(o)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                Confirmer - envoyer en cuisine
              </button>
              <button onClick={() => rejectOrder(o)} className="px-4 py-2 rounded-full text-xs border border-line text-red-400">
                Refuser
              </button>
              <button onClick={() => printOrderReceipt(o)} className="px-4 py-2 rounded-full text-xs border border-line">
                Imprimer
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-inkdim text-sm">Aucune commande en attente.</p>}
      </div>

      <h2 className="font-serif text-xl mb-4">Reservations en attente ({reservations.length})</h2>
      <div className="grid gap-3">
        {reservations.map((r) => (
          <div key={r.id} className="bg-bgsoft border border-line rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">{r.name} - {r.guests} pers.</p>
              <p className="text-inkdim text-xs mt-1">{r.date} a {r.time} - {r.phone}</p>
              {r.notes && <p className="text-inkdim text-xs mt-1">{r.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => confirmReservation(r.id)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                Confirmer
              </button>
              <button onClick={() => rejectReservation(r.id)} className="px-4 py-2 rounded-full text-xs border border-line text-red-400">
                Refuser
              </button>
            </div>
          </div>
        ))}
        {reservations.length === 0 && <p className="text-inkdim text-sm">Aucune reservation en attente.</p>}
      </div>
    </div>
  )
}
