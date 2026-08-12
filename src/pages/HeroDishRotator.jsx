import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

// Fait defiler plusieurs photos de plats en fondu enchaine (crossfade) sur
// le visuel principal de l accueil, avec Framer Motion. Une seule photo
// reste simplement affichee sans animation de transition.
export default function HeroDishRotator({ images, intervalMs = 4500 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  const current = images[index]

  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id ?? index}
          className="absolute inset-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        >
          <motion.img
            src={current.url}
            alt={current.label || "Plat du jour"}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: intervalMs / 1000 + 1, ease: "easeOut" }}
          />
          {current.label && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="absolute top-6 left-6 font-mono text-xs rounded-xl border border-line px-4 py-3 backdrop-blur"
              style={{ background: "rgba(20,18,16,0.75)" }}
            >
              Specialite
              <b className="block font-serif text-lg font-semibold text-gold">{current.label}</b>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((img, i) => (
            <motion.span
              key={img.id ?? i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === index ? 20 : 6,
                backgroundColor: i === index ? "#FF7A3D" : "rgba(244,238,224,0.35)"
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
