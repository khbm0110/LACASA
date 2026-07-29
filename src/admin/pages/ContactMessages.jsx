import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function ContactMessages() {
  const [messages, setMessages] = useState([])

  const load = async () => {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })
    setMessages(data || [])
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id)
    load()
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Messages de contact</h1>
      <div className="grid gap-3">
        {messages.map((m) => (
          <div key={m.id} className="bg-bgsoft border border-line rounded-xl p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="font-medium">{m.name} {m.subject ? `- ${m.subject}` : ""}</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                m.status === "replied" ? "bg-basil/20 text-basil" : m.status === "read" ? "bg-gold/20 text-gold" : "bg-tomato/20 text-tomatoglow"
              }`}>{m.status}</span>
            </div>
            <p className="text-inkdim text-xs mb-2">{m.email} {m.phone ? `- ${m.phone}` : ""}</p>
            <p className="mb-3">{m.message}</p>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setStatus(m.id, "read")} className="text-gold">Marquer lu</button>
              <button onClick={() => setStatus(m.id, "replied")} className="text-basil">Marquer repondu</button>
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-inkdim text-sm">Aucun message pour le moment.</p>}
      </div>
    </div>
  )
}
