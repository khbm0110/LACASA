import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"

export default function Booking() {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", guests: 2, notes: "", table_id: "" })
  const [status, setStatus] = useState(null)
  const [tables, setTables] = useState([])

  useEffect(() => {
    // Propose une table specifique si l equipe a defini un plan de salle
    // (Admin > Tables). Facultatif : le client peut laisser "Peu importe".
    async function loadTables() {
      const { data } = await supabase.from("restaurant_tables").select("id, number, capacity, zone").order("number")
      setTables(data || [])
    }
    loadTables()
  }, [])

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, name: f.name || profile.name || "", phone: f.phone || profile.phone || "" }))
  }, [profile])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    // Ecrit la reservation dans la table Supabase "reservations".
    // Statut par defaut "pending" - a valider depuis Admin > Reservations.
    const payload = { ...form, table_id: form.table_id || null, customer_id: user ? user.id : null, status: "pending" }
    const { error } = await supabase.from("reservations").insert([payload])
    setStatus(error ? "error" : "success")
  }

  return (
    <section className="max-w-2xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Reserver une table</h1>
      <p className="text-inkdim mb-10">Nous confirmons votre reservation par telephone sous peu.</p>

      {status === "success" ? (
        <div className="bg-bgsoft border border-line rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl mb-2">Merci !</p>
          <p className="text-inkdim">Votre demande a bien ete recue, nous vous appelons pour confirmer.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <input required placeholder="Nom complet" value={form.name} onChange={update("name")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          <input required placeholder="Telephone" value={form.phone} onChange={update("phone")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          <div className="grid grid-cols-2 gap-4">
            <input required type="date" value={form.date} onChange={update("date")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
            <input required type="time" value={form.time} onChange={update("time")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          </div>
          <input required type="number" min="1" max="20" value={form.guests} onChange={update("guests")}
            placeholder="Nombre de convives"
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          {tables.length > 0 && (
            <select value={form.table_id} onChange={update("table_id")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato">
              <option value="">Peu importe la table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>Table {t.number} - {t.capacity} places {t.zone ? `(${t.zone})` : ""}</option>
              ))}
            </select>
          )}
          <textarea placeholder="Notes (allergies, occasion...)" value={form.notes} onChange={update("notes")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" rows={3} />
          <button
            disabled={status === "loading"}
            className="mt-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60"
          >
            {status === "loading" ? "Envoi..." : "Confirmer la demande"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">
              Une erreur est survenue. Verifiez que Supabase est bien configure (.env).
            </p>
          )}
        </form>
      )}
    </section>
  )
}
