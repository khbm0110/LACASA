import { useEffect, useState } from "react"

// Fait defiler plusieurs photos en fondu enchaine (crossfade), dans
// l esprit d une animation Framer Motion, mais en CSS pur - ce projet n a
// pas de dependance framer-motion installee (et l environnement ne peut
// pas en telecharger). Avec une seule photo, elle reste simplement fixe.
export default function HeroDishRotator({ images, intervalMs = 4500 }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs)
    return () => clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <div className="absolute inset-0">
      {images.map((img, i) => (
        <div
          key={img.id ?? i}
          className="absolute inset-0 transition-opacity ease-in-out"
          style={{
            opacity: i === index ? 1 : 0,
            transitionDuration: "1200ms",
            transform: "translateZ(0)"
          }}
        >
          <img
            src={img.url}
            alt={img.label || "Plat du jour"}
            className="w-full h-full object-cover"
            style={{
              animation: i === index ? "hero-dish-zoom 9s ease-out forwards" : "none"
            }}
          />
          {img.label && (
            <div
              className="absolute top-6 left-6 font-mono text-xs rounded-xl border border-line px-4 py-3 backdrop-blur"
              style={{ background: "rgba(20,18,16,0.75)", transform: "translateZ(40px)" }}
            >
              Specialite
              <b className="block font-serif text-lg font-semibold text-gold">{img.label}</b>
            </div>
          )}
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((img, i) => (
            <span
              key={img.id ?? i}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: i === index ? 20 : 6, background: i === index ? "#FF7A3D" : "rgba(244,238,224,0.35)" }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes hero-dish-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.08); }
        }
      `}</style>
    </div>
  )
}
