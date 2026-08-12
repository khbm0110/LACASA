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

  if (post === undefined) return <div className="max-w-2xl mx-auto px-6 py-24 text-barklight">Chargement...</div>
  if (!post) return <div className="max-w-2xl mx-auto px-6 py-24 text-barklight">Article introuvable.</div>

  return (
    <article className="max-w-2xl mx-auto px-6 md:px-8 py-20">
      <Link to="/blog" className="text-sm text-barklight mb-8 inline-block">&larr; Retour au blog</Link>
      {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full h-64 object-cover rounded-2xl mb-8" />}
      <p className="font-mono text-xs text-clay mb-2">
        {post.published_at ? new Date(post.published_at).toLocaleDateString("fr-FR") : ""}
      </p>
      <h1 className="font-serif text-4xl mb-6">{post.title}</h1>
      <div className="text-barklight leading-relaxed whitespace-pre-line">{post.content}</div>
    </article>
  )
}
