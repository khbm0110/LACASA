import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useBranch } from "../BranchContext.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { name: "", category: "", unit: "unite", min_stock_alert: 0, cost_per_unit: 0, supplier_id: "" }
const UNITS = ["unite", "kg", "g", "l", "ml"]

export default function InventoryItems() {
  const { activeBranchId, activeBranch } = useBranch()
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [adjustingId, setAdjustingId] = useState(null)
  const [adjustQty, setAdjustQty] = useState("")
  const [adjustType, setAdjustType] = useState("manual_in")
  const [adjustReason, setAdjustReason] = useState("")
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    if (!activeBranchId) return
    const [{ data: inv }, { data: sup }] = await Promise.all([
      supabase.from("inventory_items").select("*, suppliers(name)").eq("branch_id", activeBranchId).order("name"),
      supabase.from("suppliers").select("id, name").eq("active", true).order("name"),
    ])
    setItems(inv || [])
    setSuppliers(sup || [])
  }
  useEffect(() => { load() }, [activeBranchId])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, supplier_id: form.supplier_id || null, branch_id: activeBranchId }
    const { error } = editingId
      ? await supabase.from("inventory_items").update(payload).eq("id", editingId)
      : await supabase.from("inventory_items").insert([payload])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    setEditingId(null)
    load()
    toast.success(editingId ? "Article mis a jour." : "Article ajoute au stock.")
  }

  const edit = (item) => {
    setForm({
      name: item.name, category: item.category || "", unit: item.unit,
      min_stock_alert: item.min_stock_alert, cost_per_unit: item.cost_per_unit,
      supplier_id: item.supplier_id || "",
    })
    setEditingId(item.id)
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cet article de stock ?", message: "L historique des mouvements sera egalement perdu." })
    if (!ok) return
    const { error } = await supabase.from("inventory_items").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Article supprime.")
  }

  const openAdjust = (item) => {
    setAdjustingId(item.id)
    setAdjustQty("")
    setAdjustType("manual_in")
    setAdjustReason("")
  }

  const submitAdjust = async (e) => {
    e.preventDefault()
    const qty = Number(adjustQty)
    if (!qty) { toast.error("Quantite invalide."); return }
    const signedQty = adjustType === "waste" ? -Math.abs(qty) : qty
    const { error } = await supabase.from("stock_adjustments").insert([{
      inventory_item_id: adjustingId, type: adjustType, quantity: signedQty, reason: adjustReason || null, branch_id: activeBranchId,
    }])
    if (error) { toast.error("Echec de l enregistrement du mouvement."); return }
    setAdjustingId(null)
    load()
    toast.success("Mouvement de stock enregistre.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Inventaire (stock){activeBranch && <span className="text-inkdim text-lg font-sans ml-2">— {activeBranch.name}</span>}</h1>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-10">
        <input required placeholder="Nom de l article (ex: Farine T55)" value={form.name} onChange={update("name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Categorie (ex: Viandes, Legumes...)" value={form.category} onChange={update("category")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <select value={form.unit} onChange={update("unit")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={form.supplier_id} onChange={update("supplier_id")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
          <option value="">Fournisseur (optionnel)</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Seuil d alerte stock bas" value={form.min_stock_alert} onChange={update("min_stock_alert")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input type="number" step="0.01" placeholder="Cout par unite (MAD)" value={form.cost_per_unit} onChange={update("cost_per_unit")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <div className="sm:col-span-2 flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
            {editingId ? "Mettre a jour" : "Ajouter l article"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
        {!editingId && (
          <p className="sm:col-span-2 text-xs text-inkdim">
            Le stock de depart se saisit ensuite via le bouton "Ajuster" (ou via un achat receptionne).
          </p>
        )}
      </form>

      <div className="grid gap-2">
        {items.map((item) => {
          const low = item.current_stock <= item.min_stock_alert
          return (
            <div key={item.id} className={`bg-bgsoft border rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3 ${low ? "border-tomato/60" : "border-line"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{item.name}</span>
                  {item.category && <span className="text-inkdim font-mono text-xs">{item.category}</span>}
                  {low && (
                    <span className="text-xs text-tomato border border-tomato/60 rounded-full px-2 py-0.5">Stock bas</span>
                  )}
                </div>
                <p className="text-inkdim text-xs">
                  {item.current_stock} {item.unit} en stock · seuil {item.min_stock_alert} {item.unit}
                  {item.suppliers?.name && <> · {item.suppliers.name}</>}
                  {" · "}{item.cost_per_unit} MAD/{item.unit}
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => openAdjust(item)} className="text-gold hover:text-gold/80">Ajuster</button>
                <button onClick={() => edit(item)} className="text-inkdim hover:text-ink">Modifier</button>
                <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
              </div>
            </div>
          )
        })}
        {items.length === 0 && <p className="text-inkdim text-sm">Aucun article de stock pour le moment.</p>}
      </div>

      {adjustingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setAdjustingId(null)}>
          <form onSubmit={submitAdjust} onClick={(e) => e.stopPropagation()}
            className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm grid gap-3">
            <h2 className="font-serif text-xl">Ajuster le stock</h2>
            <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
              <option value="manual_in">Entree manuelle (+)</option>
              <option value="waste">Perte / casse (-)</option>
              <option value="correction">Correction d inventaire</option>
            </select>
            <input required type="number" step="0.01" placeholder="Quantite" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
            {adjustType === "correction" && (
              <p className="text-xs text-inkdim -mt-1">Utilisez un nombre negatif pour retirer du stock.</p>
            )}
            <input placeholder="Motif (optionnel)" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
              className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
            <div className="flex gap-3 mt-2">
              <button className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                Enregistrer
              </button>
              <button type="button" onClick={() => setAdjustingId(null)} className="px-4 py-2.5 rounded-xl text-sm border border-line">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
