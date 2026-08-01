import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY_LINE = { inventory_item_id: "", quantity: "", unit_cost: "" }

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [invItems, setInvItems] = useState([])
  const [supplierId, setSupplierId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const [{ data: p }, { data: sup }, { data: inv }] = await Promise.all([
      supabase.from("purchases").select("*, suppliers(name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
      supabase.from("inventory_items").select("id, name, unit, cost_per_unit").order("name"),
    ])
    setPurchases(p || [])
    setSuppliers(sup || [])
    setInvItems(inv || [])
  }
  useEffect(() => { load() }, [])

  const updateLine = (i, key, value) => {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)))
  }
  const addLine = () => setLines((ls) => [...ls, { ...EMPTY_LINE }])
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i))

  const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0), 0)

  const submit = async (e) => {
    e.preventDefault()
    const validLines = lines.filter((l) => l.inventory_item_id && Number(l.quantity) > 0)
    if (validLines.length === 0) { toast.error("Ajoutez au moins un article avec une quantite."); return }
    setBusy(true)

    const { data: purchase, error } = await supabase.from("purchases").insert([{
      supplier_id: supplierId || null,
      invoice_number: invoiceNumber || null,
      status: "pending",
      total: 0,
    }]).select().single()

    if (error || !purchase) { setBusy(false); toast.error("Echec de la creation du bon d achat."); return }

    const { error: itemsError } = await supabase.from("purchase_items").insert(
      validLines.map((l) => ({
        purchase_id: purchase.id,
        inventory_item_id: l.inventory_item_id,
        quantity: Number(l.quantity),
        unit_cost: Number(l.unit_cost) || 0,
      }))
    )
    setBusy(false)
    if (itemsError) { toast.error("Bon d achat cree mais echec sur les lignes."); return }

    setSupplierId(""); setInvoiceNumber(""); setLines([{ ...EMPTY_LINE }])
    load()
    toast.success("Bon d achat cree (en attente de reception).")
  }

  const receive = async (purchase) => {
    const ok = await confirm({ title: "Marquer ce bon comme recu ?", message: "Le stock des articles concernes sera automatiquement incremente." })
    if (!ok) return
    const { error } = await supabase.rpc("receive_purchase", { p_purchase_id: purchase.id })
    if (error) { toast.error("Echec de la reception."); return }
    load()
    toast.success("Bon d achat receptionne, stock mis a jour.")
  }

  const cancel = async (purchase) => {
    const ok = await confirm({ title: "Annuler ce bon d achat ?" })
    if (!ok) return
    const { error } = await supabase.from("purchases").update({ status: "cancelled" }).eq("id", purchase.id)
    if (error) { toast.error("Echec de l annulation."); return }
    load()
    toast.success("Bon d achat annule.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Achats</h1>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid gap-3 mb-10">
        <div className="grid sm:grid-cols-2 gap-3">
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
            <option value="">Fournisseur (optionnel)</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input placeholder="N° de facture / bon (optionnel)" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        </div>

        <div className="grid gap-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
              <select required value={l.inventory_item_id}
                onChange={(e) => {
                  const it = invItems.find((x) => x.id === e.target.value)
                  updateLine(i, "inventory_item_id", e.target.value)
                  if (it && !l.unit_cost) updateLine(i, "unit_cost", it.cost_per_unit)
                }}
                className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
                <option value="">Article...</option>
                {invItems.map((it) => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
              </select>
              <input required type="number" step="0.01" placeholder="Qte" value={l.quantity}
                onChange={(e) => updateLine(i, "quantity", e.target.value)}
                className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
              <input type="number" step="0.01" placeholder="Cout/u" value={l.unit_cost}
                onChange={(e) => updateLine(i, "unit_cost", e.target.value)}
                className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
              <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                className="text-red-400 hover:text-red-300 disabled:opacity-30 px-2">✕</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addLine} className="text-sm text-gold hover:text-gold/80 justify-self-start">
          + Ajouter une ligne
        </button>

        <div className="flex items-center justify-between pt-3 border-t border-line">
          <span className="text-sm text-inkdim">Total estime : <span className="text-gold font-mono">{total.toFixed(2)} MAD</span></span>
          <button disabled={busy} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
            {busy ? "Creation..." : "Creer le bon d achat"}
          </button>
        </div>
      </form>

      <div className="grid gap-2">
        {purchases.map((p) => (
          <div key={p.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{p.suppliers?.name || "Fournisseur non renseigne"}</span>
                {p.invoice_number && <span className="text-inkdim font-mono text-xs">#{p.invoice_number}</span>}
                <StatusBadge status={p.status} />
              </div>
              <p className="text-inkdim text-xs">
                {new Date(p.created_at).toLocaleDateString("fr-FR")} · {p.total} MAD
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              {p.status === "pending" && (
                <>
                  <button onClick={() => receive(p)} className="text-basil hover:text-basil/80">Marquer recue</button>
                  <button onClick={() => cancel(p)} className="text-red-400 hover:text-red-300">Annuler</button>
                </>
              )}
            </div>
          </div>
        ))}
        {purchases.length === 0 && <p className="text-inkdim text-sm">Aucun bon d achat pour le moment.</p>}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    pending: ["En attente", "border-gold/60 text-gold"],
    received: ["Recu", "border-basil/60 text-basil"],
    cancelled: ["Annule", "border-line text-inkdim"],
  }
  const [label, cls] = map[status] || [status, "border-line text-inkdim"]
  return <span className={`text-xs border rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
}
