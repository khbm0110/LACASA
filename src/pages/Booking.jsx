import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { useSEO } from "../lib/useSEO"
import { useServiceStatus } from "../lib/useServiceStatus"
import { motion, AnimatePresence } from "framer-motion"

function toMinutes(t) {
  const [h, m] = (t || "0:0").split(":").map(Number)
  return h * 60 + m
}

const formFields = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5 }
  })
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
    if (form.table_id && busyTableIds.includes(form.table_id)) { setStatus("table_taken"); return }
    setStatus("loading")
    const payload = { ...form, table_id: form.table_id || null, customer_id: user ? user.id : null, status: "pending" }
    const { error } = await supabase.from("reservations").insert([payload])
    if (error?.code === "23505") { setStatus("table_taken"); return }
    setStatus(error ? "error" : "success")
  }

  const inputClass = "bg-white border border-border rounded-xl px-4 py-3 outline-none focus:border-tomato transition-colors"

  return (
    <section className="max-w-2xl mx-auto px-6 md:px-8 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="font-serif text-4xl mb-2">{t("booking_page.title")}</h1>
        <p className="text-barklight mb-10">{t("booking_page.subtitle")}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-tomato/30 rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 bg-terracotta rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="font-serif text-2xl mb-2">{t("booking_page.success_title")}</p>
            <p className="text-barklight">{t("booking_page.success_text")}</p>
          </motion.div>
        ) : reservations_enabled === false ? (
          <motion.p
            key="disabled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm text-clay bg-gold/10 border border-gold/30 rounded-xl px-4 py-3"
          >
            Les reservations en ligne sont temporairement en pause. Appelez-nous directement pour reserver une table.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={submit}
            className="grid gap-4"
          >
            <motion.div custom={0} variants={formFields} initial="hidden" animate="visible">
              <input required placeholder={t("booking_page.name")} value={form.name} onChange={update("name")} className={inputClass} />
            </motion.div>
            <motion.div custom={1} variants={formFields} initial="hidden" animate="visible">
              <input required placeholder={t("booking_page.phone")} value={form.phone} onChange={update("phone")} className={inputClass} />
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div custom={2} variants={formFields} initial="hidden" animate="visible">
                <input required type="date" min={new Date().toISOString().split("T")[0]} value={form.date} onChange={update("date")} className={inputClass} />
              </motion.div>
              <motion.div custom={3} variants={formFields} initial="hidden" animate="visible">
                <input required type="time" value={form.time} onChange={update("time")} className={inputClass} />
              </motion.div>
            </div>
            <motion.div custom={4} variants={formFields} initial="hidden" animate="visible">
              <input required type="number" min="1" max="20" value={form.guests} onChange={update("guests")} placeholder={t("booking_page.guests")} className={inputClass} />
            </motion.div>
            {tables.length > 0 && (
              <motion.div custom={5} variants={formFields} initial="hidden" animate="visible">
                <select value={form.table_id} onChange={update("table_id")} className={inputClass}>
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
              </motion.div>
            )}
            {form.date && form.time && busyTableIds.length > 0 && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-clay">
                Certaines tables sont deja reservees a proximite de cet horaire - choisissez-en une autre ou laissez "peu importe la table".
              </motion.p>
            )}
            <motion.div custom={6} variants={formFields} initial="hidden" animate="visible">
              <textarea placeholder={t("booking_page.notes")} value={form.notes} onChange={update("notes")} className={inputClass} rows={3} />
            </motion.div>
            <motion.div custom={7} variants={formFields} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#2C1810] disabled:opacity-60 w-full"
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(198,123,92,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {status === "loading" ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {t("booking_page.submitting")}
                  </motion.span>
                ) : t("booking_page.submit")}
              </motion.button>
            </motion.div>
            <AnimatePresence>
              {status === "error" && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-400">
                  {t("booking_page.error")}
                </motion.p>
              )}
              {status === "table_taken" && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-sm text-red-400">
                  Cette table vient d etre reservee par quelqu un d autre - choisissez-en une autre.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  )
}
