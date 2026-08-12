import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import Reveal from "../components/Reveal.jsx"

export default function Blog() {
  useSEO({ title: "Blog & Actualites", description: "Actualites, coulisses et nouveautes de La Casa Di Carta." })
  const [posts, setPosts] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("blog_posts").select("*").eq("published", true).order("published_at", { ascending: false })
      setPosts(data || [])
    }
    load()
  }, [])

  return (
    <section className="max-w-wide mx-auto px-5 md:px-10 py-20">
      <h1 className="font-serif text-4xl mb-10">Blog & Actualites</h1>

      {/* Meme carte que le bloc "Blog" de l accueil, pour une experience
          coherente entre l apercu et la liste complete. */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {posts.map((p, i) => (
          <Reveal key={p.id} delay={Math.min(i, 6) * 90}>
            <Link to={`/blog/${p.slug}`} className="group block bg-white border border-border rounded-2xl overflow-hidden hover:border-tomato hover:-translate-y-1.5 transition-all duration-300 h-full">
              {p.cover_image && (
                <div className="h-36 overflow-hidden">
                  <img src={p.cover_image} alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="p-5">
                <p className="font-mono text-xs text-gold mb-2">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                </p>
                <h2 className="font-serif text-lg mb-1">{p.title}</h2>
                <p className="text-inkSoft text-sm line-clamp-2">{p.excerpt}</p>
              </div>
            </Link>
          </Reveal>
        ))}
        {posts.length === 0 && <p className="text-inkSoft text-sm col-span-full">Aucun article publie pour le moment.</p>}
      </div>
    </section>
  )
}
