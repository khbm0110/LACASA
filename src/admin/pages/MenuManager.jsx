import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"
import Modal from "../ui/Modal.jsx"

const EMPTY = { category: "", name: "", price: "", description: "", is_featured: false, available_for_delivery: true, image_url: "" }

export default function MenuManager() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")
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
    setModalOpen(false)
    load()
    toast.success(editingId ? "Plat mis a jour." : "Plat ajoute au menu.")
  }

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setModalOpen(true) }
  const openEdit = (item) => { setForm(item); setEditingId(item.id); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setForm(EMPTY); setEditingId(null) }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer ce plat ?", message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("menu_items").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Plat supprime.")
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) =>
      i.name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem" }}>Gestion du menu</h1>
        <button onClick={openAdd}
          style={{ background: "#D2491F", color: "#000", padding: "0.65rem 1.25rem", fontFamily: "'Oswald', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
          + Ajouter un plat
        </button>
      </div>

      <input
        placeholder="Rechercher un plat, une categorie..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="form-input mb-6"
        style={{ maxWidth: 360 }}
      />

      <div className="grid gap-2">
        {filtered.map((item) => (
          <div key={item.id} className="info-card px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 min-w-0">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-10 h-10 object-cover border border-line shrink-0" />
              ) : (
                <span className="w-10 h-10 border border-dashed border-line shrink-0" />
              )}
              <div className="min-w-0">
                <span className="text-inkdim font-mono text-xs mr-2">{item.category}</span>
                <span className="font-medium">{item.name}</span>
                <span className="text-gold ml-2 font-mono">{item.price} MAD</span>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => openEdit(item)} className="link-underline text-inkdim hover:text-ink">Modifier</button>
              <button onClick={() => remove(item.id)} className="link-underline text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && items.length > 0 && <p className="text-inkdim text-sm">Aucun resultat pour "{search}".</p>}
        {items.length === 0 && <p className="text-inkdim text-sm">Aucun plat pour le moment.</p>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Modifier le plat" : "Ajouter un plat"}>
        <form onSubmit={submit} className="grid gap-3">
          <input required placeholder="Categorie (ex: Pizzas)" value={form.category} onChange={update("category")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required placeholder="Nom du plat" value={form.name} onChange={update("name")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required type="number" placeholder="Prix (MAD)" value={form.price} onChange={update("price")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input placeholder="Description" value={form.description} onChange={update("description")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
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
          <div className="flex gap-3 mt-1">
            <button type="submit"
              style={{ background: "#D2491F", color: "#000", padding: "0.65rem 1.5rem", fontFamily: "'Oswald', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
              {editingId ? "Mettre a jour" : "Ajouter au menu"}
            </button>
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm border border-line">
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
