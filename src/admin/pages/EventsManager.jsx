import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { title: "", description: "", image_url: "", event_date: "", is_offer: false, active: true }

export default function EventsManager() {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(EMPTY)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date")
    setEvents(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from("events").insert([{ ...form, event_date: form.event_date || null }])
    if (error) { toast.error("Echec de la publication."); return }
    setForm(EMPTY)
    load()
    toast.success("Evenement publie.")
  }

  const toggleActive = async (id, active) => {
    const { error } = await supabase.from("events").update({ active: !active }).eq("id", id)
    if (error) { toast.error("Echec de la mise a jour."); return }
    load()
    toast.success(!active ? "Evenement active." : "Evenement desactive.")
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cet evenement ?", message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("events").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Evenement supprime.")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Evenements & Offres</h1>
      <p className="text-inkdim text-sm mb-8">
        Cochez "Offre permanente" pour une promo sans date fixe, sinon renseignez une date d evenement.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-2 gap-3 mb-10">
        <input required placeholder="Titre" value={form.title} onChange={update("title")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input type="date" value={form.event_date} onChange={update("event_date")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Description" value={form.description} onChange={update("description")}
          className="sm:col-span-2 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <ImageUploadInput
          label="Image (optionnel)"
          value={form.image_url}
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
          folder="events"
        />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={form.is_offer} onChange={update("is_offer")} /> Offre permanente
        </label>
        <button className="sm:col-span-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
          Publier
        </button>
      </form>

      <div className="grid gap-2">
        {events.map((e) => (
          <div key={e.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{e.title}</span>
              <span className="text-inkdim ml-2 text-xs">{e.is_offer ? "Offre permanente" : e.event_date}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleActive(e.id, e.active)} className={e.active ? "text-basil text-xs" : "text-inkdim text-xs"}>
                {e.active ? "Actif" : "Inactif"}
              </button>
              <button onClick={() => remove(e.id)} className="text-red-400 text-xs">Supprimer</button>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-inkdim text-sm">Aucun evenement.</p>}
      </div>
    </div>
  )
}
