import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

const EMPTY = { slug: "", title: "", excerpt: "", content: "", cover_image: "", published: false }

function slugify(title) {
  return title.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export default function BlogManager() {
  const [posts, setPosts] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)

  const load = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })
    setPosts(data || [])
  }
  useEffect(() => { load() }, [])

  const updateTitle = (e) => {
    const title = e.target.value
    setForm((f) => ({ ...f, title, slug: editingId ? f.slug : slugify(title) }))
  }
  const update = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, published_at: form.published ? new Date().toISOString() : null }
    if (editingId) {
      await supabase.from("blog_posts").update(payload).eq("id", editingId)
    } else {
      await supabase.from("blog_posts").insert([payload])
    }
    setForm(EMPTY)
    setEditingId(null)
    load()
  }

  const edit = (post) => { setForm(post); setEditingId(post.id) }
  const remove = async (id) => { await supabase.from("blog_posts").delete().eq("id", id); load() }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Blog & Actualites</h1>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid gap-3 mb-10">
        <input required placeholder="Titre" value={form.title} onChange={updateTitle}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input required placeholder="slug-de-l-article" value={form.slug} onChange={update("slug")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato font-mono" />
        <input placeholder="Resume (affiche dans la liste)" value={form.excerpt} onChange={update("excerpt")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="URL image de couverture (optionnel)" value={form.cover_image} onChange={update("cover_image")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <textarea required rows={6} placeholder="Contenu de l article" value={form.content} onChange={update("content")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <label className="flex items-center gap-2 text-sm text-inkdim">
          <input type="checkbox" checked={form.published} onChange={update("published")} /> Publie (visible sur le site)
        </label>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
            {editingId ? "Mettre a jour" : "Enregistrer"}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setForm(EMPTY); setEditingId(null) }} className="px-5 py-2.5 rounded-full text-sm border border-line">
              Annuler
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-2">
        {posts.map((p) => (
          <div key={p.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{p.title}</span>
              <span className={`ml-2 text-xs ${p.published ? "text-basil" : "text-inkdim"}`}>{p.published ? "Publie" : "Brouillon"}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => edit(p)} className="text-inkdim hover:text-ink text-xs">Modifier</button>
              <button onClick={() => remove(p.id)} className="text-red-400 text-xs">Supprimer</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-inkdim text-sm">Aucun article.</p>}
      </div>
    </div>
  )
}
