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
    <section className="page-wrap" style={{ maxWidth: 640 }}>
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Contact</span></div>
      <h1 className="page-title">ECRIVEZ-<span className="text-stroke">NOUS.</span></h1>
      <p className="page-lede" style={{ marginBottom: "3rem" }}>
        Une question, un evenement prive, un groupe ? Nous vous repondons rapidement.
      </p>

      {status === "success" ? (
        <div className="info-card notch-corner" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", marginBottom: "0.5rem" }}>Message envoye !</p>
          <p style={{ color: "#c0c0c0" }}>Nous vous repondons des que possible.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="booking-frame" style={{ padding: "2rem 2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Nom</label>
            <input required placeholder="Votre nom" value={form.name} onChange={update("name")} className="form-input" />
          </div>
          <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Email</label>
              <input type="email" placeholder="vous@exemple.com" value={form.email} onChange={update("email")} className="form-input" />
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Telephone</label>
              <input placeholder="+212 6 00 00 00 00" value={form.phone} onChange={update("phone")} className="form-input" />
            </div>
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Sujet</label>
            <input placeholder="Objet de votre message" value={form.subject} onChange={update("subject")} className="form-input" />
          </div>
          <div>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Message</label>
            <textarea required rows={4} placeholder="Votre message" value={form.message} onChange={update("message")}
              className="form-input" style={{ resize: "vertical" }} />
          </div>
          <button type="submit" disabled={status === "loading"}
            style={{ background: "#D2491F", color: "#000", padding: "1.1rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem", letterSpacing: "0.1em", border: "none", cursor: "pointer", marginTop: "0.5rem", width: "100%" }}>
            {status === "loading" ? "Envoi..." : "ENVOYER LE MESSAGE"}
          </button>
          {status === "error" && <p style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#f87171", letterSpacing: "0.15em", textTransform: "uppercase" }}>Une erreur est survenue, reessayez.</p>}
        </form>
      )}
    </section>
  )
}
