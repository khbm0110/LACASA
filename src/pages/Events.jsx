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
    <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-10">Evenements & Offres</h1>

      {offers.length > 0 && (
        <div className="mb-14">
          <h2 className="font-serif text-2xl mb-5 text-gold">Offres en cours</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      <h2 className="font-serif text-2xl mb-5 text-gold">A venir</h2>
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
    <div className="group bg-bgsoft border border-line rounded-2xl overflow-hidden hover:border-tomato hover:-translate-y-1.5 transition-all duration-300">
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
        <h3 className="font-serif text-xl mb-1">{event.title}</h3>
        <p className="text-inkdim text-sm">{event.description}</p>
      </div>
    </div>
  )
}
