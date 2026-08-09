import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

export default function Events() {
  useSEO({ title: "Evenements & Offres", description: "Soirees speciales et offres en cours a La Casa Di Carta, Rabat." })
  const [events, setEvents] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true })
      setEvents(data || [])
    }
    load()
  }, [])

  const offers = events.filter((e) => e.is_offer)
  const upcoming = events.filter((e) => !e.is_offer)

  return (
    <section className="page-wrap-lg">
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>A ne pas manquer</span></div>
      <h1 className="page-title" style={{ marginBottom: "3rem" }}>EVENEMENTS <span className="text-stroke">&amp; OFFRES.</span></h1>

      {offers.length > 0 && (
        <div className="mb-14">
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Offres en cours</p>
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>A venir</p>
      <div className="grid md:grid-cols-2 gap-4">
        {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
      {upcoming.length === 0 && offers.length === 0 && (
        <p className="text-inkdim text-sm">Aucun evenement pour le moment.</p>
      )}
    </section>
  )
}

function EventCard({ event }) {
  return (
    <div className="group info-card overflow-hidden">
      {event.image_url && (
        <div className="h-40 overflow-hidden">
          <img src={event.image_url} alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        {event.event_date && (
          <p className="font-mono text-xs text-gold mb-2">{new Date(event.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
        )}
        <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl mb-1">{event.title}</h3>
        <p className="text-inkdim text-sm">{event.description}</p>
      </div>
    </div>
  )
}
