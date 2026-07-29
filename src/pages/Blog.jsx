import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

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
    <section className="max-w-4xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-10">Blog & Actualites</h1>
      <div className="grid gap-6">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="bg-bgsoft border border-line rounded-2xl overflow-hidden flex flex-col sm:flex-row hover:border-tomato transition">
            {p.cover_image && <img src={p.cover_image} alt={p.title} className="w-full sm:w-56 h-40 object-cover" />}
            <div className="p-5">
              <p className="font-mono text-xs text-gold mb-2">
                {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
              </p>
              <h2 className="font-serif text-xl mb-1">{p.title}</h2>
              <p className="text-inkdim text-sm line-clamp-2">{p.excerpt}</p>
            </div>
          </Link>
        ))}
        {posts.length === 0 && <p className="text-inkdim text-sm">Aucun article publie pour le moment.</p>}
      </div>
    </section>
  )
}
