import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { url: "", caption: "", category: "Restaurant", sort_order: 0 }
const HOME_LIMIT = 10

// Gestion par URL d image ou televersement direct (Supabase Storage).
// Cochez "Afficher sur l accueil" pour inclure une photo dans le slider
// de la page d accueil (10 photos maximum affichees).
export default function GalleryManager() {
  const [images, setImages] = useState([])
  const [form, setForm] = useState(EMPTY)
  const confirm = useConfirm()
  const toast = useToast()

  const load = async () => {
    const { data } = await supabase.from("gallery_images").select("*").order("sort_order")
    setImages(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.url) return
    const { error } = await supabase.from("gallery_images").insert([{ ...form, sort_order: Number(form.sort_order) || 0 }])
    if (error) { toast.error("Echec de l ajout de la photo."); return }
    setForm(EMPTY)
    load()
    toast.success("Photo ajoutee.")
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cette photo ?", message: "Cette action est definitive." })
    if (!ok) return
    const { error } = await supabase.from("gallery_images").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Photo supprimee.")
  }

  const homeCount = images.filter((i) => i.show_on_home).length

  const toggleHome = async (img) => {
    if (!img.show_on_home && homeCount >= HOME_LIMIT) return
    await supabase.from("gallery_images").update({ show_on_home: !img.show_on_home }).eq("id", img.id)
    load()
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Galerie photo</h1>
      <p className="text-inkdim text-sm mb-8">
        Collez un lien d image ou televersez un fichier. Cochez "Accueil" pour l afficher dans le
        slider de la page d accueil ({homeCount}/{HOME_LIMIT} selectionnees).
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-4 gap-3 mb-10">
        <ImageUploadInput
          label="Photo"
          value={form.url}
          onChange={(url) => setForm((f) => ({ ...f, url }))}
          folder="gallery"
        />
        <input placeholder="Legende" value={form.caption} onChange={update("caption")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Categorie" value={form.category} onChange={update("category")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <button className="sm:col-span-4 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
          Ajouter la photo
        </button>
      </form>

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-bgsoft border border-line rounded-2xl overflow-hidden">
            <div className="relative">
              <img src={img.url} alt={img.caption} className="w-full h-32 object-cover" />
              {img.show_on_home && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-tomato text-paper text-[10px] font-mono">Accueil</span>
              )}
            </div>
            <div className="p-3 flex items-center justify-between gap-2">
              <span className="text-xs text-inkdim truncate">{img.category}</span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleHome(img)}
                  disabled={!img.show_on_home && homeCount >= HOME_LIMIT}
                  className={`text-xs ${img.show_on_home ? "text-tomatoglow" : "text-inkdim hover:text-ink"} disabled:opacity-40`}
                  title={!img.show_on_home && homeCount >= HOME_LIMIT ? `Maximum ${HOME_LIMIT} atteint` : ""}
                >
                  {img.show_on_home ? "Retirer" : "Accueil"}
                </button>
                <button onClick={() => remove(img.id)} className="text-red-400 text-xs">Suppr.</button>
              </div>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-inkdim text-sm">Aucune photo.</p>}
      </div>
    </div>
  )
}
