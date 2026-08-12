import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import { motion, AnimatePresence } from "framer-motion"

const fieldAnim = {
  hidden: { opacity: 0, y: 15 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5 } })
}

export default function Contact() {
  useSEO({ title: "Contact", description: "Contactez La Casa Di Carta a Rabat - questions, groupes, evenements prives." })
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" })
  const [status, setStatus] = useState(null)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    const { error } = await supabase.from("contact_messages").insert([{ ...form, status: "new" }])
    setStatus(error ? "error" : "success")
  }

  const inputClass = "bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato transition-colors"

  return (
    <section className="max-w-xl mx-auto px-6 md:px-8 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="font-serif text-4xl mb-2">Contact</h1>
        <p className="text-inkdim mb-10">
          Une question, un evenement prive, un groupe ? Ecrivez-nous, nous repondons rapidement.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-bgsoft border border-tomato/30 rounded-2xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-16 h-16 bg-tomato rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0E0C0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="font-serif text-2xl mb-2">Message envoye !</p>
            <p className="text-inkdim">Nous vous repondons des que possible.</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onSubmit={submit} className="grid gap-3"
          >
            <motion.div custom={0} variants={fieldAnim} initial="hidden" animate="visible">
              <input required placeholder="Nom" value={form.name} onChange={update("name")} className={inputClass} />
            </motion.div>
            <div className="grid grid-cols-2 gap-3">
              <motion.div custom={1} variants={fieldAnim} initial="hidden" animate="visible">
                <input type="email" placeholder="Email" value={form.email} onChange={update("email")} className={inputClass} />
              </motion.div>
              <motion.div custom={2} variants={fieldAnim} initial="hidden" animate="visible">
                <input placeholder="Telephone" value={form.phone} onChange={update("phone")} className={inputClass} />
              </motion.div>
            </div>
            <motion.div custom={3} variants={fieldAnim} initial="hidden" animate="visible">
              <input placeholder="Sujet" value={form.subject} onChange={update("subject")} className={inputClass} />
            </motion.div>
            <motion.div custom={4} variants={fieldAnim} initial="hidden" animate="visible">
              <textarea required rows={5} placeholder="Votre message" value={form.message} onChange={update("message")} className={inputClass} />
            </motion.div>
            <motion.div custom={5} variants={fieldAnim} initial="hidden" animate="visible">
              <motion.button
                disabled={status === "loading"}
                className="mt-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A] disabled:opacity-60 w-full"
                whileHover={{ scale: 1.02, boxShadow: "0 8px 30px rgba(200,150,62,0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {status === "loading" ? (
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Envoi...</motion.span>
                ) : "Envoyer"}
              </motion.button>
            </motion.div>
            <AnimatePresence>
              {status === "error" && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400">
                  Une erreur est survenue, reessayez.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  )
}
