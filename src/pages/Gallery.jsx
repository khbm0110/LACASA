import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

export default function Gallery() {
  useSEO({ title: "Galerie photo", description: "Photos du restaurant, des plats et de l'ambiance de La Casa Di Carta a Rabat." })
  const [images, setImages] = useState([])
  const [category, setCategory] = useState("Toutes")
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("gallery_images").select("*").order("sort_order")
      setImages(data || [])
    }
    load()
  }, [])

  // Fermer avec Echap, naviguer avec les fleches quand le lightbox est ouvert
  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e) {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % filtered.length)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex])

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
              <button key={c} onClick={() => { setCategory(c); }}
                className={`px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide border transition ${
                  category === c ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim hover:text-ink hover:border-tomato"
                }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((img, i) => (
              <button key={img.id} onClick={() => setLightboxIndex(i)}
                className="rounded-2xl overflow-hidden border border-line aspect-square group cursor-zoom-in">
                <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </button>
            ))}
          </div>
        </>
      )}

      {/* Lightbox : agrandir la photo, naviguer au clavier ou avec les fleches */}
      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <button onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full border border-white/20 text-white text-xl">
            &times;
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length) }}
            className="absolute left-4 md:left-8 w-11 h-11 rounded-full border border-white/20 text-white flex items-center justify-center"
          >
            &larr;
          </button>
          <img
            src={filtered[lightboxIndex].url}
            alt={filtered[lightboxIndex].caption || "La Casa Di Carta"}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % filtered.length) }}
            className="absolute right-4 md:right-8 w-11 h-11 rounded-full border border-white/20 text-white flex items-center justify-center"
          >
            &rarr;
          </button>
          {filtered[lightboxIndex].caption && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center px-4">
              {filtered[lightboxIndex].caption}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
