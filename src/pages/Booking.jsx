import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { useSEO } from "../lib/useSEO"
import { useServiceStatus } from "../lib/useServiceStatus"

function toMinutes(t) {
  const [h, m] = (t || "0:0").split(":").map(Number)
  return h * 60 + m
}

export default function Booking() {
  const { t } = useTranslation()
  useSEO({ title: t("booking_page.title"), description: t("booking_page.subtitle") })
  const { user, profile } = useAuth()
  const { reservations_enabled } = useServiceStatus()
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
    if (reservations_enabled === false) return

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
    <section className="page-wrap" style={{ maxWidth: 640 }}>
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Reservation</span></div>
      <h1 className="page-title">{t("booking_page.title")}</h1>
      <p className="page-lede" style={{ marginBottom: "3rem" }}>{t("booking_page.subtitle")}</p>

      {status === "success" ? (
        <div className="info-card notch-corner" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", marginBottom: "0.5rem" }}>{t("booking_page.success_title")}</p>
          <p style={{ color: "#c0c0c0" }}>{t("booking_page.success_text")}</p>
        </div>
      ) : reservations_enabled === false ? (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#D4A84B", background: "rgba(212,168,75,0.08)", border: "1px solid rgba(212,168,75,0.3)", padding: "1rem 1.25rem" }}>
          Les reservations en ligne sont temporairement en pause. Appelez-nous directement
          pour reserver une table.
        </p>
      ) : (
        <form onSubmit={submit} className="booking-frame" style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>{t("booking_page.name")}</label>
            <input required placeholder={t("booking_page.name")} value={form.name} onChange={update("name")} className="form-input" />
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>{t("booking_page.phone")}</label>
            <input required placeholder={t("booking_page.phone")} value={form.phone} onChange={update("phone")} className="form-input" />
          </div>
          <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Date</label>
              <input required type="date" min={new Date().toISOString().split("T")[0]} value={form.date} onChange={update("date")} className="form-input" />
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Heure</label>
              <input required type="time" value={form.time} onChange={update("time")} className="form-input" />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>{t("booking_page.guests")}</label>
            <input required type="number" min="1" max="20" value={form.guests} onChange={update("guests")}
              placeholder={t("booking_page.guests")} className="form-input" />
          </div>
          {tables.length > 0 && (
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Table</label>
              <select value={form.table_id} onChange={update("table_id")} className="form-input">
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
            </div>
          )}
          {form.date && form.time && busyTableIds.length > 0 && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D4A84B" }}>
              Certaines tables sont deja reservees a proximite de cet horaire - choisissez-en une autre ou laissez "peu importe la table".
            </p>
          )}
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>{t("booking_page.notes")}</label>
            <textarea placeholder={t("booking_page.notes")} value={form.notes} onChange={update("notes")} className="form-input" rows={3} style={{ resize: "vertical" }} />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            style={{ background: "#D2491F", color: "#000", padding: "1.1rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem", letterSpacing: "0.1em", border: "none", cursor: "pointer", marginTop: "0.5rem", width: "100%" }}
          >
            {status === "loading" ? t("booking_page.submitting") : t("booking_page.submit")}
          </button>
          {status === "error" && (
            <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#f87171", letterSpacing: "0.15em", textTransform: "uppercase" }}>{t("booking_page.error")}</p>
          )}
          {status === "table_taken" && (
            <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#f87171", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Cette table vient d etre reservee par quelqu un d autre - choisissez-en une autre.
            </p>
          )}
        </form>
      )}
    </section>
  )
}
