import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useBranch } from "../BranchContext.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const TYPE_LABEL = { dine_in: "Sur place", takeaway: "A emporter", delivery: "Livraison" }

export default function SalesHistory() {
  const { activeBranchId, activeBranch } = useBranch()
  const [orders, setOrders] = useState([])
  const [voidingOrder, setVoidingOrder] = useState(null)
  const [voidReason, setVoidReason] = useState("")
  const [refundingOrder, setRefundingOrder] = useState(null)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundMethod, setRefundMethod] = useState("cash")
  const [refundReason, setRefundReason] = useState("")
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    if (!activeBranchId) return
    const { data } = await supabase.from("orders").select("*")
      .eq("branch_id", activeBranchId).order("created_at", { ascending: false }).limit(100)
    setOrders(data || [])
  }
  useEffect(() => { load() }, [activeBranchId])

  const openRefund = (order) => {
    setRefundingOrder(order)
    setRefundAmount((Number(order.total) - Number(order.refunded_total || 0)).toFixed(2))
    setRefundMethod(order.payment_provider === "card_tpe" ? "card_tpe" : "cash")
    setRefundReason("")
  }

  const submitRefund = async (e) => {
    e.preventDefault()
    const remaining = Number(refundingOrder.total) - Number(refundingOrder.refunded_total || 0)
    const amount = Number(refundAmount)
    if (!amount || amount <= 0) { toast.error("Montant invalide."); return }
    if (amount > remaining) { toast.error(`Le montant depasse ce qui reste remboursable (${remaining} MAD).`); return }
    setBusy(true)
    const { error } = await supabase.from("order_refunds").insert([{
      order_id: refundingOrder.id, amount, payment_method: refundMethod, reason: refundReason || null,
    }])
    setBusy(false)
    if (error) { toast.error("Echec de l enregistrement du remboursement."); return }
    setRefundingOrder(null)
    load()
    toast.success(`Remboursement de ${amount} MAD enregistre.`)
  }

  const openVoid = (order) => { setVoidingOrder(order); setVoidReason("") }

  const submitVoid = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.rpc("void_order", { p_order_id: voidingOrder.id, p_reason: voidReason || null })
    setBusy(false)
    if (error) { toast.error("Echec de l annulation."); return }
    setVoidingOrder(null)
    load()
    toast.success("Commande annulee, stock restitue si necessaire.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Ventes & remboursements{activeBranch && <span className="text-inkdim text-lg font-sans ml-2">— {activeBranch.name}</span>}</h1>
      <p className="text-inkdim text-sm mb-8">Les 100 dernieres commandes de cet etablissement. Annulez une erreur de saisie ou remboursez (partiellement ou totalement) une commande deja encaissee.</p>

      <div className="grid gap-2">
        {orders.map((o) => {
          const isCancelled = o.status === "cancelled"
          const remaining = Number(o.total) - Number(o.refunded_total || 0)
          const fullyRefunded = !isCancelled && remaining <= 0
          return (
            <div key={o.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-inkdim">#{o.id.slice(0, 8)}</span>
                  <span className="font-medium">{TYPE_LABEL[o.order_type] || o.order_type}</span>
                  <span className="font-mono text-gold">{o.total} MAD</span>
                  {isCancelled && <span className="text-xs text-red-400 border border-red-400/50 rounded-full px-2 py-0.5">Annulee</span>}
                  {!isCancelled && fullyRefunded && <span className="text-xs text-tomato border border-tomato/50 rounded-full px-2 py-0.5">Remboursee</span>}
                  {!isCancelled && !fullyRefunded && o.refunded_total > 0 && (
                    <span className="text-xs text-gold border border-gold/50 rounded-full px-2 py-0.5">Rembourse partiel : {o.refunded_total} MAD</span>
                  )}
                </div>
                <p className="text-inkdim text-xs">
                  {new Date(o.created_at).toLocaleString("fr-FR")} · {
                    o.payment_provider === "card_tpe" ? "Carte" :
                    o.payment_provider === "cash" ? "Especes" :
                    o.payment_provider === "split" ? "Paiement partage" :
                    o.payment_provider || "—"
                  }
                </p>
              </div>
              {!isCancelled && (
                <div className="flex gap-3 shrink-0">
                  {!fullyRefunded && <button onClick={() => openRefund(o)} className="text-gold hover:text-gold/80">Rembourser</button>}
                  <button onClick={() => openVoid(o)} className="text-red-400 hover:text-red-300">Annuler</button>
                </div>
              )}
            </div>
          )
        })}
        {orders.length === 0 && <p className="text-inkdim text-sm">Aucune commande pour le moment.</p>}
      </div>

      {refundingOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setRefundingOrder(null)}>
          <form onSubmit={submitRefund} onClick={(e) => e.stopPropagation()} className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm grid gap-3">
            <h2 className="font-serif text-xl">Rembourser la commande</h2>
            <p className="text-inkdim text-xs -mt-2">
              Total {refundingOrder.total} MAD · deja rembourse {refundingOrder.refunded_total || 0} MAD
            </p>
            <input required type="number" step="0.01" placeholder="Montant a rembourser (MAD)" value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
            <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
              <option value="cash">Especes (sortira de la caisse)</option>
              <option value="card_tpe">Carte (TPE)</option>
            </select>
            <input placeholder="Motif (optionnel)" value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
            <div className="flex gap-3 mt-1">
              <button disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
                {busy ? "Enregistrement..." : "Confirmer le remboursement"}
              </button>
              <button type="button" onClick={() => setRefundingOrder(null)} className="px-4 py-2.5 rounded-xl text-sm border border-line">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {voidingOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setVoidingOrder(null)}>
          <form onSubmit={submitVoid} onClick={(e) => e.stopPropagation()} className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm grid gap-3">
            <h2 className="font-serif text-xl">Annuler la commande</h2>
            <p className="text-inkdim text-xs -mt-2">
              La commande sera retiree des ventes et le stock deduit par sa recette (le cas echeant) sera restitue.
            </p>
            <input placeholder="Motif (optionnel)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
            <div className="flex gap-3 mt-1">
              <button disabled={busy} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/90 hover:bg-red-500 text-white disabled:opacity-50">
                {busy ? "Annulation..." : "Confirmer l annulation"}
              </button>
              <button type="button" onClick={() => setVoidingOrder(null)} className="px-4 py-2.5 rounded-xl text-sm border border-line">Retour</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
