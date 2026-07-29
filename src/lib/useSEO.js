import { useEffect } from "react"

// Petit utilitaire SEO sans dependance externe : met a jour le titre de la
// page et la meta description a chaque navigation (chaque page publique
// appelle useSEO avec son propre titre/description).
export function useSEO({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | La Casa Di Carta` : "La Casa Di Carta - Trattoria & Livraison, Rabat"
    document.title = fullTitle

    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "description")
      document.head.appendChild(meta)
    }
    if (description) meta.setAttribute("content", description)

    let ogTitle = document.querySelector('meta[property="og:title"]')
    if (!ogTitle) {
      ogTitle = document.createElement("meta")
      ogTitle.setAttribute("property", "og:title")
      document.head.appendChild(ogTitle)
    }
    ogTitle.setAttribute("content", fullTitle)
  }, [title, description])
}
