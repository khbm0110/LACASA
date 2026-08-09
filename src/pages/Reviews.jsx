import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

// Avis affiches tant que google_reviews (synchronisee via
// supabase/functions/sync-google-reviews) n est pas encore remplie.
const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait, une belle touche de pesto." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, bons plats - l emince de boeuf et de poulet sont particulierement reussis." },
  { id: "r3", author_name: "Client Google", rating: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
  { id: "r4", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, service correct, ambiance conviviale en soiree." }
]

export default function Reviews() {
  useSEO({ title: "Avis Google", description: "Ce que disent nos clients de La Casa Di Carta, Rabat." })
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: r }, { data: i }] = await Promise.all([
        supabase.from("google_reviews").select("*").order("time", { ascending: false }).limit(30),
        supabase.from("restaurant_info").select("google_rating, google_review_count").eq("id", 1).single()
      ])
      if (r && r.length > 0) setReviews(r)
      if (i) setInfo(i)
    }
    load()
  }, [])

  return (
    <section className="page-wrap-lg">
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Avis</span></div>
      <h1 className="page-title">CE QU'EN PENSENT <span className="text-stroke">NOS CLIENTS.</span></h1>
      <div className="flex items-center gap-4 mb-12 mt-6">
        <span style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-5xl">{info?.google_rating ?? "-"}</span>
        <div>
          <p style={{ color: "#D2491F" }}>{"★ ".repeat(Math.round(info?.google_rating || 0))}</p>
          <p className="font-mono text-inkdim text-xs">Base sur {info?.google_review_count ?? reviews.length} avis Google</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <div key={r.id} className="info-card p-5">
            <p style={{ color: "#D2491F" }} className="text-sm mb-2">{"★ ".repeat(r.rating)}</p>
            <p className="text-sm text-inkdim">{r.text}</p>
            <p className="font-mono text-xs text-muted mt-3 uppercase tracking-widest opacity-70">{r.author_name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
