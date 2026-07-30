import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { useSEO } from "../lib/useSEO"

function toMinutes(t) {
  const [h, m] = (t || "0:0").split(":").map(Number)
  return h * 60 + m
}

export default function Booking() {
  const { t } = useTranslation()
  useSEO({ title: t("booking_page.title"), description: t("booking_page.subtitle") })
  const { user, profile } = useAuth()
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "", guests: 2, notes: "", table_id: "" })
  const [status, setStatus] = useState(null)
  const [tables, setTables] = useState([])
  const [busyTableIds, setBusyTableIds] = useState([])

  useEffect(() => {
    async function loadTables() {
      const { data } = await supabase.from("restaurant_tables").select("id, number, capacity, zone").order("number")
      setTables(data || [])
    }
    loadTables()
  }, [])

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, name: f.name || profile.name || "", phone: f.phone || profile.phone || "" }))
  }, [profile])

  // Empeche de reserver deux fois la meme table sur le meme creneau : des
  // que la date et l heure sont choisies, on regarde les reservations deja
  // confirmees (ou en attente) ce jour-la et on bloque les tables occupees
  // a moins de 2h de l heure demandee.
  useEffect(() => {
    async function checkAvailability() {
      if (!form.date || !form.time) { setBusyTableIds([]); return }
      const { data } = await supabase
        .from("reservations")
        .select("table_id, time, status")
        .eq("date", form.date)
        .not("table_id", "is", null)
        .in("status", ["pending", "confirmed"])
      if (!data) return
      const requested = toMinutes(form.time)
      const busy = data
        .filter((r) => Math.abs(toMinutes(r.time) - requested) < 120)
        .map((r) => r.table_id)
      setBusyTableIds(busy)
    }
    checkAvailability()
  }, [form.date, form.time])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()

    // Dernier controle juste avant l envoi : si la table choisie vient
    // d etre prise entre-temps (quelqu un d autre a reserve juste avant),
    // on bloque et on previent plutot que de laisser un double-booking.
    if (form.table_id && busyTableIds.includes(form.table_id)) {
      setStatus("table_taken")
      return
    }

    setStatus("loading")
    const payload = { ...form, table_id: form.table_id || null, customer_id: user ? user.id : null, status: "pending" }
    const { error } = await supabase.from("reservations").insert([payload])
    if (error?.code === "23505") { setStatus("table_taken"); return }
    setStatus(error ? "error" : "success")
  }

  return (
    <section className="max-w-2xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">{t("booking_page.title")}</h1>
      <p className="text-inkdim mb-10">{t("booking_page.subtitle")}</p>

      {status === "success" ? (
        <div className="bg-bgsoft border border-line rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl mb-2">{t("booking_page.success_title")}</p>
          <p className="text-inkdim">{t("booking_page.success_text")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <input required placeholder={t("booking_page.name")} value={form.name} onChange={update("name")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          <input required placeholder={t("booking_page.phone")} value={form.phone} onChange={update("phone")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          <div className="grid grid-cols-2 gap-4">
            <input required type="date" value={form.date} onChange={update("date")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
            <input required type="time" value={form.time} onChange={update("time")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          </div>
          <input required type="number" min="1" max="20" value={form.guests} onChange={update("guests")}
            placeholder={t("booking_page.guests")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
          {tables.length > 0 && (
            <select value={form.table_id} onChange={update("table_id")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato">
              <option value="">{t("booking_page.table_any")}</option>
              {tables.map((tb) => {
                const taken = busyTableIds.includes(tb.id)
                return (
                  <option key={tb.id} value={tb.id} disabled={taken}>
                    Table {tb.number} - {tb.capacity} places {tb.zone ? `(${tb.zone})` : ""} {taken ? "- deja reservee a cette heure" : ""}
                  </option>
                )
              })}
            </select>
          )}
          {form.date && form.time && busyTableIds.length > 0 && (
            <p className="text-xs text-gold">
              Certaines tables sont deja reservees a proximite de cet horaire - choisissez-en une autre ou laissez "peu importe la table".
            </p>
          )}
          <textarea placeholder={t("booking_page.notes")} value={form.notes} onChange={update("notes")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" rows={3} />
          <button
            disabled={status === "loading"}
            className="mt-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60"
          >
            {status === "loading" ? t("booking_page.submitting") : t("booking_page.submit")}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">{t("booking_page.error")}</p>
          )}
          {status === "table_taken" && (
            <p className="text-sm text-red-400">
              Cette table vient d etre reservee par quelqu un d autre - choisissez-en une autre.
            </p>
          )}
        </form>
      )}
    </section>
  )
}
