import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"
import Modal from "../ui/Modal.jsx"

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
  const [modalOpen, setModalOpen] = useState(false)
  const confirm = useConfirm()
  const toast = useToast()

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
    const payload = { ...form, published_at: form.published ? (form.published_at || new Date().toISOString()) : null }
    const { error } = editingId
      ? await supabase.from("blog_posts").update(payload).eq("id", editingId)
      : await supabase.from("blog_posts").insert([payload])
    if (error) { toast.error("Echec de l enregistrement."); return }
    setForm(EMPTY)
    setEditingId(null)
    setModalOpen(false)
    load()
    toast.success(
      form.published
        ? "Article publie - visible sur le site."
        : "Article enregistre comme brouillon (pas encore visible sur le site)."
    )
  }

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setModalOpen(true) }
  const openEdit = (post) => { setForm(post); setEditingId(post.id); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setForm(EMPTY); setEditingId(null) }

  // Publier / repasser en brouillon directement depuis la liste, sans ouvrir
  // le formulaire - evite le cas "j ai ecrit un article mais oublie de
  // cocher Publie" en rendant l etat visible et modifiable en un clic.
  const togglePublish = async (post) => {
    const nextPublished = !post.published
    const payload = { published: nextPublished, published_at: nextPublished ? (post.published_at || new Date().toISOString()) : null }
    const { error } = await supabase.from("blog_posts").update(payload).eq("id", post.id)
    if (error) { toast.error("Echec de la mise a jour."); return }
    load()
    toast.success(nextPublished ? "Article publie." : "Article repasse en brouillon.")
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cet article ?", message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("blog_posts").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Article supprime.")
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem" }}>Blog & Actualites</h1>
        <button onClick={openAdd}
          style={{ background: "#D2491F", color: "#000", padding: "0.65rem 1.25rem", fontFamily: "'Oswald', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
          + Nouvel article
        </button>
      </div>

      <div className="grid gap-2">
        {posts.map((p) => (
          <div key={p.id} className="info-card px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium">{p.title}</span>
              <span className={`ml-2 text-xs font-mono uppercase tracking-widest ${p.published ? "text-basil" : "text-gold"}`}>
                {p.published ? "\u25cf Publie" : "\u25cb Brouillon"}
              </span>
            </div>
            <div className="flex gap-3 shrink-0 items-center">
              <button onClick={() => togglePublish(p)} className="link-underline text-xs" style={{ color: p.published ? "#c0c0c0" : "#D4A84B" }}>
                {p.published ? "Repasser en brouillon" : "Publier maintenant"}
              </button>
              <button onClick={() => openEdit(p)} className="link-underline text-inkdim hover:text-ink text-xs">Modifier</button>
              <button onClick={() => remove(p.id)} className="link-underline text-red-400 text-xs">Supprimer</button>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-inkdim text-sm">Aucun article.</p>}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? "Modifier l'article" : "Nouvel article"} maxWidth={640}>
        <form onSubmit={submit} className="grid gap-3">
          <input required placeholder="Titre" value={form.title} onChange={updateTitle}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required placeholder="slug-de-l-article" value={form.slug} onChange={update("slug")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato font-mono" />
          <input placeholder="Resume (affiche dans la liste)" value={form.excerpt} onChange={update("excerpt")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <ImageUploadInput
            label="Image de couverture (optionnel)"
            value={form.cover_image}
            onChange={(url) => setForm((f) => ({ ...f, cover_image: url }))}
            folder="blog"
          />
          <textarea required rows={6} placeholder="Contenu de l article" value={form.content} onChange={update("content")}
            className="bg-bg border border-line px-3 py-2.5 text-sm outline-none focus:border-tomato" />

          <label className="flex items-center gap-3 text-sm p-3"
            style={{ border: `1px solid ${form.published ? "#D2491F" : "#2a2a2a"}`, background: form.published ? "rgba(210,73,31,0.08)" : "transparent" }}>
            <input type="checkbox" checked={form.published} onChange={update("published")} />
            <span>
              <span className="block font-medium" style={{ color: form.published ? "#FF7A3D" : "#f5f5f5" }}>
                {form.published ? "Publie - visible sur le site" : "Non publie - brouillon prive"}
              </span>
              <span className="block text-xs text-inkdim">Decochee, l'article est enregistre mais personne ne le voit sur le site.</span>
            </span>
          </label>

          <div className="flex gap-3 mt-1">
            <button type="submit"
              style={{ background: "#D2491F", color: "#000", padding: "0.65rem 1.5rem", fontFamily: "'Oswald', sans-serif", fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer" }}>
              {editingId ? "Mettre a jour" : form.published ? "Publier l'article" : "Enregistrer en brouillon"}
            </button>
            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm border border-line">
              Annuler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
