import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { category: "", name: "", price: "", description: "", is_featured: false, available_for_delivery: true, image_url: "" }

export default function MenuManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("menu_items").select("*").order("category")
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const { error } = editingId
      ? await supabase.from("menu_items").update(form).eq("id", editingId)
      : await supabase.from("menu_items").insert([form])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    setEditingId(null)
    load()
    toast.success(editingId ? "Plat mis a jour." : "Plat ajoute au menu.")
  }

  const edit = (item) => { setForm(item); setEditingId(item.id) }
  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer ce plat ?", message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("menu_items").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Plat supprime.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Gestion du menu</h1>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-10">
        <input required placeholder="Categorie (ex: Pizzas)" value={form.category} onChange={update("category")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input required placeholder="Nom du plat" value={form.name} onChange={update("name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input required type="number" placeholder="Prix (MAD)" value={form.price} onChange={update("price")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Description" value={form.description} onChange={update("description")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <ImageUploadInput
          label="Photo du plat (optionnel)"
          value={form.image_url}
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          folder="menu"
        />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!form.is_featured} onChange={update("is_featured")} /> Mis en avant sur l accueil
        </label>
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!form.available_for_delivery} onChange={update("available_for_delivery")} /> Disponible en livraison
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
            {editingId ? "Mettre a jour" : "Ajouter au menu"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 min-w-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-line shrink-0" />
              ) : (
                <span className="w-10 h-10 rounded-lg border border-dashed border-line shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-inkdim font-mono text-xs mr-2">{item.category}</span>
                <span className="font-medium">{item.name}</span>
                <span className="text-gold ml-2 font-mono">{item.price} MAD</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => edit(item)} className="text-inkdim hover:text-ink">Modifier</button>
              <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-inkdim text-sm">Aucun plat pour le moment.</p>}
      </div>
    </div>
  )
}
