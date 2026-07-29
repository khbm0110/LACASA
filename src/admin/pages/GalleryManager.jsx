import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

const EMPTY = { url: "", caption: "", category: "Restaurant", sort_order: 0 }

// Gestion par URL d image (pas d upload de fichier ici). Hebergez vos photos
// sur Supabase Storage (bucket public) ou tout autre service, puis collez
// l URL publique ici.
export default function GalleryManager() {
  const [images, setImages] = useState([])
  const [form, setForm] = useState(EMPTY)

  const load = async () => {
    const { data } = await supabase.from("gallery_images").select("*").order("sort_order")
    setImages(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await supabase.from("gallery_images").insert([{ ...form, sort_order: Number(form.sort_order) || 0 }])
    setForm(EMPTY)
    load()
  }

  const remove = async (id) => {
    await supabase.from("gallery_images").delete().eq("id", id)
    load()
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Galerie photo</h1>
      <p className="text-inkdim text-sm mb-8">
        Collez l URL publique d une image (Supabase Storage ou autre hebergeur).
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-4 gap-3 mb-10">
        <input required placeholder="URL de l image" value={form.url} onChange={update("url")}
          className="sm:col-span-2 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Legende" value={form.caption} onChange={update("caption")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Categorie" value={form.category} onChange={update("category")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <button className="sm:col-span-4 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
          Ajouter la photo
        </button>
      </form>

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-bgsoft border border-line rounded-2xl overflow-hidden">
            <img src={img.url} alt={img.caption} className="w-full h-32 object-cover" />
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-inkdim truncate">{img.category}</span>
              <button onClick={() => remove(img.id)} className="text-red-400 text-xs">Suppr.</button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-inkdim text-sm">Aucune photo.</p>}
      </div>
    </div>
  )
}
