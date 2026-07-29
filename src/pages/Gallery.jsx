import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

export default function Gallery() {
  useSEO({ title: "Galerie photo", description: "Photos du restaurant, des plats et de l'ambiance de La Casa Di Carta a Rabat." })
  const [images, setImages] = useState([])
  const [category, setCategory] = useState("Toutes")

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order")
      setImages(data || [])
    }
    load()
  }, [])

  const categories = ["Toutes", ...new Set(images.map((i) => i.category || "Restaurant"))]
  const filtered = category === "Toutes" ? images : images.filter((i) => (i.category || "Restaurant") === category)

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Galerie</h1>
      <p className="text-inkdim mb-8">Un apercu du restaurant, des plats et des soirees.</p>

      {images.length === 0 ? (
        <p className="text-inkdim text-sm">
          Aucune photo pour le moment - ajoutez-en depuis Admin &gt; Galerie photo.
        </p>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono border ${
                  category === c ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"
                }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((img) => (
              <div key={img.id} className="rounded-2xl overflow-hidden border border-line aspect-square">
                <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
