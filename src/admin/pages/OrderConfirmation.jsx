import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt } from "../../lib/printReceipt"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

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
  const [actionError, setActionError] = useState("")
  const confirm = useConfirm()
  const toast = useToast()

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
    if (order.payment_status !== "paid") {
      const proceed = await confirm({
        title: "Commande non payee",
        message: "Cette commande n est pas marquee comme payee. La confirmer quand meme et l envoyer en cuisine ?",
        confirmLabel: "Confirmer quand meme"
      })
      if (!proceed) return
    }
    setActionError("")
    // Passe la commande a "new" : c est ce statut que l ecran cuisine
    // (Admin > Ecran cuisine) surveille, donc elle y apparait a l instant.
    const { data, error } = await supabase.from("orders").update({ status: "new" }).eq("id", order.id).select()
    if (error) {
      setActionError(`Echec de la confirmation (${error.message}). Verifiez que votre compte a bien le role staff/admin.`)
      return
    }
    if (!data || data.length === 0) {
      setActionError("La commande n a pas ete mise a jour (acces refuse). Reconnectez-vous a l espace admin avec un compte staff.")
      return
    }
    // Mise a jour immediate de l affichage, sans attendre le temps reel
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
    toast.success("Commande confirmee et envoyee en cuisine.")
  }
  const rejectOrder = async (order) => {
    const ok = await confirm({ title: "Refuser cette commande ?", message: "Le client ne sera pas notifie automatiquement." })
    if (!ok) return
    setActionError("")
    const { data, error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id).select()
    if (error || !data || data.length === 0) {
      setActionError("Echec du refus de la commande. Reconnectez-vous a l espace admin avec un compte staff.")
      return
    }
    setOrders((prev) => prev.filter((o) => o.id !== order.id))
    toast.success("Commande refusee.")
  }
  const confirmReservation = async (id) => {
    setActionError("")
    const { error } = await supabase.from("reservations").update({ status: "confirmed" }).eq("id", id)
    if (error) { setActionError(`Echec de la confirmation (${error.message}).`); return }
    setReservations((prev) => prev.filter((r) => r.id !== id))
    toast.success("Reservation confirmee.")
  }
  const rejectReservation = async (id) => {
    const ok = await confirm({ title: "Refuser cette reservation ?" })
    if (!ok) return
    setActionError("")
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id)
    if (error) { setActionError(`Echec du refus (${error.message}).`); return }
    setReservations((prev) => prev.filter((r) => r.id !== id))
    toast.success("Reservation refusee.")
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <h1 className="font-serif text-3xl">Confirmation des commandes</h1>
        <button onClick={load} className="px-4 py-2 rounded-full text-xs border border-line hover:bg-white/5">
          Actualiser
        </button>
      </div>
      <p className="text-inkdim text-sm mb-4 max-w-2xl">
        Depuis la mise en place du paiement en ligne, une commande livraison payee part
        directement en cuisine (voir le paiement confirme par webhook). Ce qui reste ici
        n a donc pas encore ete paye, ou le paiement a echoue - verifiez avant de confirmer
        manuellement. Les commandes passees depuis une table (QR code) n apparaissent pas
        ici - elles vont directement en cuisine.
      </p>
      {actionError && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3 mb-8">
          {actionError}
        </p>
      )}

      <h2 className="font-serif text-xl mb-4">Commandes livraison en attente ({orders.length})</h2>
      <div className="grid gap-3 mb-12">
        {orders.map((o) => (
          <div key={o.id} className="bg-bgsoft border border-line rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-sm">{o.phone} - {o.address}</p>
                <p className="text-inkdim text-xs mt-1">{new Date(o.created_at).toLocaleString("fr-FR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-1 rounded-full ${
                  o.payment_status === "paid" ? "bg-basil/20 text-basil"
                  : o.payment_status === "pending" ? "bg-gold/20 text-gold"
                  : o.payment_status === "failed" ? "bg-red-400/20 text-red-400"
                  : "bg-white/10 text-inkdim"
                }`}>
                  {o.payment_status === "paid" ? "Paye" : o.payment_status === "pending" ? "Paiement en cours" : o.payment_status === "failed" ? "Paiement echoue" : "Non paye"}
                </span>
                <span className="font-mono text-gold">{o.total} MAD</span>
              </div>
            </div>
            <ul className="text-sm text-inkdim mb-4">
              {(o.items || []).map((it, idx) => (
                <li key={idx}>{it.qty} x {it.name} - {it.qty * it.price} MAD</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => confirmOrder(o)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
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
                className="px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
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
