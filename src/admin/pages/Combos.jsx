import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { name: "", description: "", price: "", image_url: "", active: true }
const EMPTY_LINE = { menu_item_id: "", quantity: 1 }

export default function Combos() {
  const [combos, setCombos] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [lines, setLines] = useState([{ ...EMPTY_LINE }])
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const [{ data: c }, { data: mi }] = await Promise.all([
      supabase.from("combos").select("*, combo_items(*, menu_items(name))").order("created_at", { ascending: false }),
      supabase.from("menu_items").select("id, name, category").order("category"),
    ])
    setCombos(c || [])
    setMenuItems(mi || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }
  const updateLine = (i, key, value) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)))
  const addLine = () => setLines((ls) => [...ls, { ...EMPTY_LINE }])
  const removeLine = (i) => setLines((ls) => ls.filter((_, idx) => idx !== i))

  const resetForm = () => { setForm(EMPTY); setLines([{ ...EMPTY_LINE }]); setEditingId(null) }

  const submit = async (e) => {
    e.preventDefault()
    const validLines = lines.filter((l) => l.menu_item_id && Number(l.quantity) > 0)
    if (validLines.length === 0) { toast.error("Ajoutez au moins un plat a la formule."); return }
    setBusy(true)

    let comboId = editingId
    if (editingId) {
      const { error } = await supabase.from("combos").update(form).eq("id", editingId)
      if (error) { setBusy(false); toast.error("Echec de la mise a jour."); return }
      await supabase.from("combo_items").delete().eq("combo_id", editingId)
    } else {
      const { data, error } = await supabase.from("combos").insert([form]).select().single()
      if (error || !data) { setBusy(false); toast.error("Echec de la creation."); return }
      comboId = data.id
    }

    const { error: itemsError } = await supabase.from("combo_items").insert(
      validLines.map((l) => ({ combo_id: comboId, menu_item_id: l.menu_item_id, quantity: Number(l.quantity) }))
    )
    setBusy(false)
    if (itemsError) { toast.error("Formule enregistree mais echec sur sa composition."); return }

    resetForm()
    load()
    toast.success(editingId ? "Formule mise a jour." : "Formule creee.")
  }

  const edit = (c) => {
    setForm({ name: c.name, description: c.description || "", price: c.price, image_url: c.image_url || "", active: c.active })
    setLines(c.combo_items.length > 0 ? c.combo_items.map((ci) => ({ menu_item_id: ci.menu_item_id, quantity: ci.quantity })) : [{ ...EMPTY_LINE }])
    setEditingId(c.id)
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cette formule ?" })
    if (!ok) return
    const { error } = await supabase.from("combos").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Formule supprimee.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Formules (combos)</h1>
      <p className="text-inkdim text-sm mb-8">
        Un bundle de plats existants vendu a un prix fixe (ex: "Menu Duo" = 2 pizzas + 2 boissons).
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid gap-3 mb-10">
        <div className="grid sm:grid-cols-2 gap-3">
          <input required placeholder="Nom de la formule" value={form.name} onChange={update("name")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required type="number" step="0.01" placeholder="Prix fixe (MAD)" value={form.price} onChange={update("price")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        </div>
        <input placeholder="Description (optionnel)" value={form.description} onChange={update("description")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <ImageUploadInput label="Photo (optionnel)" value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} folder="combos" />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!form.active} onChange={update("active")} /> Active (visible a la vente)
        </label>

        <div className="pt-3 border-t border-line">
          <p className="text-sm text-inkdim mb-2">Composition de la formule</p>
          <div className="grid gap-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 items-center">
                <select required value={l.menu_item_id} onChange={(e) => updateLine(i, "menu_item_id", e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
                  <option value="">Plat...</option>
                  {menuItems.map((m) => <option key={m.id} value={m.id}>{m.category} — {m.name}</option>)}
                </select>
                <input required type="number" min="1" placeholder="Qte" value={l.quantity}
                  onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
                <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1}
                  className="text-red-400 hover:text-red-300 disabled:opacity-30 px-2">✕</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addLine} className="text-sm text-gold hover:text-gold/80 mt-2">
            + Ajouter un plat
          </button>
        </div>

        <div className="flex gap-3 pt-3 border-t border-line">
          <button disabled={busy} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
            {busy ? "Enregistrement..." : editingId ? "Mettre a jour" : "Creer la formule"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-full text-sm border border-line">Annuler</button>
          )}
        </div>
      </form>

      <div className="grid gap-2">
        {combos.map((c) => (
          <div key={c.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover border border-line shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-lg border border-dashed border-line shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gold font-mono">{c.price} MAD</span>
                  {!c.active && <span className="text-xs text-inkdim border border-line rounded-full px-2 py-0.5">Inactive</span>}
                </div>
                <p className="text-inkdim text-xs truncate">
                  {c.combo_items.map((ci) => `${ci.quantity}× ${ci.menu_items?.name}`).join(", ") || "Aucun plat"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => edit(c)} className="text-inkdim hover:text-ink">Modifier</button>
              <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
        {combos.length === 0 && <p className="text-inkdim text-sm">Aucune formule pour le moment.</p>}
      </div>
    </div>
  )
}
