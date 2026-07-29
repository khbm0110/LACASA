import { useEffect } from "react"
import { supabase } from "./supabaseClient"

// Enregistre une vue de page tres simple (juste le chemin + l heure), pour
// alimenter le Tableau analytics admin sans compte externe. N enregistre
// aucune donnee personnelle (pas d IP, pas de cookie, pas d identifiant).
export function usePageView(path) {
  useEffect(() => {
    supabase.from("page_views").insert([{ path }]).then(() => {})
  }, [path])
}
