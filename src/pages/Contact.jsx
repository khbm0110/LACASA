import { useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

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

  return (
    <section className="max-w-xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Contact</h1>
      <p className="text-inkdim mb-10">
        Une question, un evenement prive, un groupe ? Ecrivez-nous, nous repondons rapidement.
      </p>

      {status === "success" ? (
        <div className="bg-bgsoft border border-line rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl mb-2">Message envoye !</p>
          <p className="text-inkdim">Nous vous repondons des que possible.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-3">
          <input required placeholder="Nom" value={form.name} onChange={update("name")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
          <div className="grid grid-cols-2 gap-3">
            <input type="email" placeholder="Email" value={form.email} onChange={update("email")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
            <input placeholder="Telephone" value={form.phone} onChange={update("phone")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
          </div>
          <input placeholder="Sujet" value={form.subject} onChange={update("subject")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
          <textarea required rows={5} placeholder="Votre message" value={form.message} onChange={update("message")}
            className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
          <button disabled={status === "loading"}
            className="mt-2 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60">
            {status === "loading" ? "Envoi..." : "Envoyer"}
          </button>
          {status === "error" && <p className="text-xs text-red-400">Une erreur est survenue, reessayez.</p>}
        </form>
      )}
    </section>
  )
}
