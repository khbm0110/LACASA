import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import { motion, AnimatePresence } from "framer-motion"

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

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e) {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % filtered.length)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex])

  const categories = ["Toutes", ...new Set(images.map((i) => i.category || "Restaurant"))]
  const filtered = category === "Toutes" ? images : images.filter((i) => (i.category || "Restaurant") === category)

  return (
    <section className="max-w-wide mx-auto px-6 md:px-8 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="font-serif text-4xl mb-2">Galerie</h1>
        <p className="text-inkSoft mb-8">Un apercu du restaurant, des plats et des soirees.</p>
      </motion.div>

      {images.length === 0 ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-inkSoft text-sm">
          Aucune photo pour le moment - ajoutez-en depuis Admin &gt; Galerie photo.
        </motion.p>
      ) : (
        <>
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((c, i) => (
              <motion.button
                key={c}
                onClick={() => { setCategory(c); }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2  text-sm font-mono uppercase tracking-wide border transition-colors ${
                  category === c ? "bg-gold border-tomato text-white" : "border-border text-inkSoft hover:text-ink hover:border-tomato"
                }`}>
                {c}
              </motion.button>
            ))}
          </div>
          <motion.div layout className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((img, i) => (
                <motion.button
                  key={img.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ layout: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
                  onClick={() => setLightboxIndex(i)}
                  className="rounded-2xl overflow-hidden border border-border aspect-square group cursor-zoom-in"
                  whileHover={{ y: -6, borderColor: "#A16207" }}
                >
                  <motion.img
                    src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }} transition={{ duration: 0.5 }}
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setLightboxIndex(null)}
          >
            <motion.button
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 w-10 h-10  border border-white/20 text-white text-xl"
            >
              &times;
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, borderColor: "#A16207" }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i - 1 + filtered.length) % filtered.length) }}
              className="absolute left-4 md:left-8 w-11 h-11  border border-white/20 text-white flex items-center justify-center"
            >
              &larr;
            </motion.button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              src={filtered[lightboxIndex].url}
              alt={filtered[lightboxIndex].caption || "La Casa Di Carta"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
            />
            <motion.button
              whileHover={{ scale: 1.1, borderColor: "#A16207" }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i + 1) % filtered.length) }}
              className="absolute right-4 md:right-8 w-11 h-11  border border-white/20 text-white flex items-center justify-center"
            >
              &rarr;
            </motion.button>
            {filtered[lightboxIndex].caption && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm text-center px-4"
              >
                {filtered[lightboxIndex].caption}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
