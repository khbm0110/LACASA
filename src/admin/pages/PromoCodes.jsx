import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { code: "", discount_type: "percent", value: "", min_order: 0, active: true, expires_at: "" }

export default function PromoCodes() {
  const [codes, setCodes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false })
    setCodes(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from("promo_codes").upsert([{
      ...form,
      code: form.code.toUpperCase().trim(),
      value: Number(form.value),
      min_order: Number(form.min_order) || 0,
      expires_at: form.expires_at || null
    }])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    load()
    toast.success("Code promo enregistre.")
  }

  const toggleActive = async (code, active) => {
    const { error } = await supabase.from("promo_codes").update({ active: !active }).eq("code", code)
    if (error) { toast.error("Echec de la mise a jour."); return }
    load()
    toast.success(!active ? "Code active." : "Code desactive.")
  }

  const remove = async (code) => {
    const ok = await confirm({ title: `Supprimer le code ${code} ?`, message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("promo_codes").delete().eq("code", code)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Code promo supprime.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Codes promo</h1>
      <p className="text-inkdim text-sm mb-8">
        Utilisables sur la page de commande (livraison / sur place). Le code est verifie
        et le rabais applique automatiquement au moment de payer.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-3 gap-3 mb-10">
        <input required placeholder="Code (ex: BIENVENUE10)" value={form.code} onChange={update("code")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <select value={form.discount_type} onChange={update("discount_type")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm">
          <option value="percent">Pourcentage (%)</option>
          <option value="fixed">Montant fixe (MAD)</option>
        </select>
        <input required type="number" placeholder="Valeur" value={form.value} onChange={update("value")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input type="number" placeholder="Commande minimum (MAD)" value={form.min_order} onChange={update("min_order")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input type="date" value={form.expires_at} onChange={update("expires_at")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
          Enregistrer
        </button>
      </form>

      <div className="grid gap-2">
        {codes.map((c) => (
          <div key={c.code} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-mono font-medium">{c.code}</span>
              <span className="text-inkdim ml-3">
                {c.discount_type === "percent" ? `${c.value}%` : `${c.value} MAD`}
                {c.min_order > 0 ? ` - min ${c.min_order} MAD` : ""}
                {c.expires_at ? ` - expire ${c.expires_at}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleActive(c.code, c.active)}
                className={c.active ? "text-basil text-xs" : "text-inkdim text-xs"}>
                {c.active ? "Actif" : "Inactif"}
              </button>
              <button onClick={() => remove(c.code)} className="text-red-400 text-xs">Supprimer</button>
            </div>
          </div>
        ))}
        {codes.length === 0 && <p className="text-inkdim text-sm">Aucun code promo pour le moment.</p>}
      </div>
    </div>
  )
}
