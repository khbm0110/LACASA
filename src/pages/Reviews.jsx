import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import { motion } from "framer-motion"

const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait, une belle touche de pesto." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, bons plats - l emince de boeuf et de poulet sont particulierement reussis." },
  { id: "r3", author_name: "Client Google", rating: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
  { id: "r4", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, service correct, ambiance conviviale en soiree." }
]

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
}
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

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
    <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="font-serif text-4xl mb-2">Avis Google</h1>
      </motion.div>

      <motion.div
        className="flex items-center gap-4 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <motion.span
          className="font-serif text-5xl"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
        >
          {info?.google_rating ?? "-"}
        </motion.span>
        <div>
          <p className="text-gold">{"★ ".repeat(Math.round(info?.google_rating || 0))}</p>
          <p className="text-inkdim text-sm">Base sur {info?.google_review_count ?? reviews.length} avis</p>
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid md:grid-cols-2 gap-4">
        {reviews.map((r) => (
          <motion.div
            key={r.id}
            variants={item}
            whileHover={{ borderColor: "rgba(198,123,92,0.4)", y: -3 }}
            className="bg-bgsoft border border-line rounded-2xl p-5"
          >
            <p className="text-gold text-sm mb-2">{"★ ".repeat(r.rating)}{"☆ ".repeat(5 - r.rating)}</p>
            <p className="text-sm text-inkdim">{r.text}</p>
            <p className="text-xs text-inkdim mt-3 opacity-70">{r.author_name}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
