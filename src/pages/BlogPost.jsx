import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(undefined)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("blog_posts").select("*").eq("slug", slug).eq("published", true).single()
      setPost(data || null)
    }
    load()
  }, [slug])

  useSEO({ title: post?.title, description: post?.excerpt })

  if (post === undefined) return <div className="max-w-2xl mx-auto px-6 py-24 text-inkdim">Chargement...</div>
  if (!post) return <div className="max-w-2xl mx-auto px-6 py-24 text-inkdim">Article introuvable.</div>

  return (
    <article className="page-wrap" style={{ maxWidth: 720 }}>
      <Link to="/blog" className="link-underline" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#c0c0c0", marginBottom: "2.5rem", display: "inline-block" }}>&larr; Retour au blog</Link>
      {post.cover_image && <img src={post.cover_image} alt={post.title} className="notch-corner w-full h-64 object-cover mb-8" style={{ border: "1px solid #1f1f1f" }} />}
      <p className="font-mono text-xs text-gold mb-2">
        {post.published_at ? new Date(post.published_at).toLocaleDateString("fr-FR") : ""}
      </p>
      <h1 className="page-title" style={{ marginTop: 0, marginBottom: "2rem" }}>{post.title}</h1>
      <div className="text-inkdim leading-relaxed whitespace-pre-line">{post.content}</div>
    </article>
  )
}
