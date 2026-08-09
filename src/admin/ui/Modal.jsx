import { useEffect } from "react"

// Fenetre modale reutilisable pour les formulaires d edition/creation dans
// l espace admin. Remplace les formulaires en ligne en haut de page :
// on ouvre "Modifier" ou "Ajouter", on remplit, on ferme - la liste reste
// visible et lisible en arriere-plan.
export default function Modal({ open, onClose, title, children, maxWidth = 560 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center px-3 py-6 sm:px-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="info-card notch-corner w-full shadow-2xl my-auto"
        style={{ maxWidth, background: "#141414" }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid #2a2a2a" }}>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem" }}>{title}</p>
          <button onClick={onClose} aria-label="Fermer" className="text-inkdim hover:text-ink text-xl leading-none px-1">&times;</button>
        </div>
        <div className="px-5 sm:px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
