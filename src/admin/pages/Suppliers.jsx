import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { name: "", contact_name: "", phone: "", email: "", address: "", notes: "", active: true }

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("suppliers").select("*").order("name")
    setSuppliers(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const { error } = editingId
      ? await supabase.from("suppliers").update(form).eq("id", editingId)
      : await supabase.from("suppliers").insert([form])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    setEditingId(null)
    load()
    toast.success(editingId ? "Fournisseur mis a jour." : "Fournisseur ajoute.")
  }

  const edit = (s) => { setForm(s); setEditingId(s.id) }
  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer ce fournisseur ?", message: "Les articles de stock lies conserveront leur historique mais perdront ce lien." })
    if (!ok) return
    const { error } = await supabase.from("suppliers").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression (verifiez qu aucun achat n y est lie)."); return }
    load()
    toast.success("Fournisseur supprime.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Fournisseurs</h1>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-10">
        <input required placeholder="Nom du fournisseur" value={form.name} onChange={update("name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Personne a contacter" value={form.contact_name || ""} onChange={update("contact_name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Telephone" value={form.phone || ""} onChange={update("phone")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Email" value={form.email || ""} onChange={update("email")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Adresse" value={form.address || ""} onChange={update("address")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato sm:col-span-2" />
        <textarea placeholder="Notes (conditions de paiement, delais...)" value={form.notes || ""} onChange={update("notes")}
          rows={2}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!form.active} onChange={update("active")} /> Actif
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
            {editingId ? "Mettre a jour" : "Ajouter le fournisseur"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-2">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{s.name}</span>
                {!s.active && <span className="text-xs text-inkdim border border-line rounded-full px-2 py-0.5">Inactif</span>}
              </div>
              <p className="text-inkdim text-xs truncate">
                {[s.contact_name, s.phone, s.email].filter(Boolean).join(" · ") || "Aucune coordonnee"}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => edit(s)} className="text-inkdim hover:text-ink">Modifier</button>
              <button onClick={() => remove(s.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <p className="text-inkdim text-sm">Aucun fournisseur pour le moment.</p>}
      </div>
    </div>
  )
}
