import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const ROLES = ["admin", "manager", "cuisine", "staff"]

// Gestion de l equipe - reservee aux comptes "admin" (voir StaffGuard dans
// AdminLayout). Un nouveau membre doit d abord creer un compte normal sur
// /compte (ou via une inscription dediee), puis l admin l ajoute ici avec
// son UUID Supabase (visible dans Authentication > Users cote Supabase).
export default function StaffManager() {
  const [staff, setStaff] = useState([])
  const [form, setForm] = useState({ id: "", role: "staff" })
  const [error, setError] = useState(null)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at")
    setStaff(data || [])
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.from("staff").insert([{ id: form.id.trim(), role: form.role }])
    if (error) { setError(error.message); return }
    setForm({ id: "", role: "staff" })
    load()
    toast.success("Membre ajoute a l equipe.")
  }

  const changeRole = async (id, role) => {
    const { error } = await supabase.from("staff").update({ role }).eq("id", id)
    if (error) { toast.error("Echec de la mise a jour du role."); return }
    load()
    toast.success("Role mis a jour.")
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Retirer ce membre de l equipe ?", message: "Il perdra l acces a l espace admin." })
    if (!ok) return
    const { error } = await supabase.from("staff").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Membre retire de l equipe.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Equipe & permissions</h1>
      <p className="text-inkdim text-sm mb-8 max-w-2xl">
        <b>admin</b> : acces complet, y compris cette page. <b>manager</b> : tout sauf gestion
        de l equipe. <b>cuisine</b> : uniquement l ecran cuisine. <b>staff</b> : menu, reservations,
        livraisons, tables.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-3 gap-3 mb-10">
        <input required placeholder="UUID du compte (Supabase Auth)" value={form.id}
          onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato sm:col-span-2" />
        <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button className="sm:col-span-3 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
          Ajouter a l equipe
        </button>
        {error && <p className="sm:col-span-3 text-red-400 text-xs">{error}</p>}
      </form>

      <div className="grid gap-2">
        {staff.map((s) => (
          <div key={s.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <span className="font-mono text-xs text-inkdim truncate max-w-[240px]">{s.id}</span>
            <div className="flex items-center gap-3">
              <select value={s.role} onChange={(e) => changeRole(s.id, e.target.value)}
                className="bg-bg border border-line rounded-lg px-2 py-1 text-xs">
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => remove(s.id)} className="text-red-400 text-xs">Retirer</button>
            </div>
          </div>
        ))}
        {staff.length === 0 && <p className="text-inkdim text-sm">Aucun membre pour le moment.</p>}
      </div>
    </div>
  )
}
