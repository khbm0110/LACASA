import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useToast } from "../ui/Toast.jsx"

export default function Recipes() {
  const [menuItems, setMenuItems] = useState([])
  const [invItems, setInvItems] = useState([])
  const [selectedMenuId, setSelectedMenuId] = useState("")
  const [rows, setRows] = useState([]) // [{ inventory_item_id, quantity }]
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    async function load() {
      const [{ data: mi }, { data: ii }] = await Promise.all([
        supabase.from("menu_items").select("id, name, category").order("category"),
        supabase.from("inventory_items").select("id, name, unit").order("name"),
      ])
      setMenuItems(mi || [])
      setInvItems(ii || [])
      if (mi && mi.length > 0) setSelectedMenuId(mi[0].id)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadRecipe() {
      if (!selectedMenuId) { setRows([]); return }
      const { data } = await supabase.from("menu_item_ingredients")
        .select("inventory_item_id, quantity").eq("menu_item_id", selectedMenuId)
      setRows(data && data.length > 0 ? data : [{ inventory_item_id: "", quantity: "" }])
    }
    loadRecipe()
  }, [selectedMenuId])

  const unitOf = useMemo(() => {
    const map = {}
    invItems.forEach((i) => { map[i.id] = i.unit })
    return map
  }, [invItems])

  const updateRow = (i, key, value) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)))
  const addRow = () => setRows((rs) => [...rs, { inventory_item_id: "", quantity: "" }])
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i))

  const save = async () => {
    const valid = rows.filter((r) => r.inventory_item_id && Number(r.quantity) > 0)
    setSaving(true)
    await supabase.from("menu_item_ingredients").delete().eq("menu_item_id", selectedMenuId)
    if (valid.length > 0) {
      const { error } = await supabase.from("menu_item_ingredients").insert(
        valid.map((r) => ({ menu_item_id: selectedMenuId, inventory_item_id: r.inventory_item_id, quantity: Number(r.quantity) }))
      )
      if (error) { setSaving(false); toast.error("Echec de l enregistrement de la recette."); return }
    }
    setSaving(false)
    toast.success("Recette enregistree. Le stock sera deduit automatiquement a chaque vente.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Recettes</h1>
      <p className="text-inkdim text-sm mb-8">
        Associez chaque plat aux articles de stock qu il consomme. A chaque vente, le stock correspondant
        sera deduit automatiquement des qu une commande part en cuisine.
      </p>

      <div className="bg-bgsoft border border-line rounded-2xl p-6">
        <select value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)}
          className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato mb-5">
          {menuItems.map((m) => <option key={m.id} value={m.id}>{m.category} — {m.name}</option>)}
        </select>

        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2 items-center">
              <select value={r.inventory_item_id} onChange={(e) => updateRow(i, "inventory_item_id", e.target.value)}
                className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato">
                <option value="">Article de stock...</option>
                {invItems.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <input type="number" step="0.001" placeholder="Quantite" value={r.quantity}
                onChange={(e) => updateRow(i, "quantity", e.target.value)}
                className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
              <div className="flex items-center gap-2">
                {r.inventory_item_id && <span className="text-xs text-inkdim shrink-0">{unitOf[r.inventory_item_id]}</span>}
                <button type="button" onClick={() => removeRow(i)} className="text-red-400 hover:text-red-300 px-2">✕</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addRow} className="text-sm text-gold hover:text-gold/80 mt-3">
          + Ajouter un ingredient
        </button>

        <div className="pt-5 mt-5 border-t border-line">
          <button onClick={save} disabled={saving || !selectedMenuId}
            className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer la recette"}
          </button>
        </div>
      </div>
    </div>
  )
}
