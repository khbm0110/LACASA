import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useBranch } from "../BranchContext.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { name: "", address: "", phone: "", active: true }

export default function Branches() {
  const { branches, reload } = useBranch()
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const { error } = editingId
      ? await supabase.from("branches").update(form).eq("id", editingId)
      : await supabase.from("branches").insert([form])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    setEditingId(null)
    reload()
    toast.success(editingId ? "Etablissement mis a jour." : "Etablissement ajoute. Selectionnez-le en haut de l ecran pour y saisir son stock et ses ventes.")
  }

  const edit = (b) => { setForm({ name: b.name, address: b.address || "", phone: b.phone || "", active: b.active }); setEditingId(b.id) }

  const remove = async (id) => {
    if (branches.length <= 1) { toast.error("Impossible de supprimer le seul etablissement restant."); return }
    const ok = await confirm({ title: "Supprimer cet etablissement ?", message: "Le stock, les achats et les ventes qui lui sont rattaches resteront dans l historique mais ne seront plus filtrables par cet etablissement." })
    if (!ok) return
    const { error } = await supabase.from("branches").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    reload()
    toast.success("Etablissement supprime.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Etablissements</h1>
      <p className="text-inkdim text-sm mb-8">
        Ajoutez un etablissement des l ouverture d un 2e point de vente. Une fois ajoute, utilisez le
        selecteur en haut de l ecran pour basculer entre les etablissements : le stock, les achats et
        le point de vente se filtrent automatiquement sur celui actif.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-10">
        <input required placeholder="Nom de l etablissement" value={form.name} onChange={update("name")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato sm:col-span-2" />
        <input placeholder="Adresse" value={form.address} onChange={update("address")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Telephone" value={form.phone} onChange={update("phone")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={!!form.active} onChange={update("active")} /> Actif
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
            {editingId ? "Mettre a jour" : "Ajouter l etablissement"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-2">
        {branches.map((b) => (
          <div key={b.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{b.name}</span>
                {!b.active && <span className="text-xs text-inkdim border border-line rounded-full px-2 py-0.5">Inactif</span>}
              </div>
              <p className="text-inkdim text-xs truncate">{[b.address, b.phone].filter(Boolean).join(" · ") || "Aucune coordonnee"}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button onClick={() => edit(b)} className="text-inkdim hover:text-ink">Modifier</button>
              <button onClick={() => remove(b.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
