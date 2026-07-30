import { supabase } from "./supabaseClient"

// Televerse un fichier image dans le bucket public "media" (Supabase Storage)
// et renvoie son URL publique, prete a etre enregistree dans une colonne
// "image_url" / "url" / "cover_image" en base.
//
// folder: sous-dossier logique (ex: "menu", "gallery", "events", "blog")
export async function uploadImage(file, folder = "misc") {
  if (!file) throw new Error("Aucun fichier fourni.")
  if (!file.type?.startsWith("image/")) throw new Error("Le fichier doit etre une image.")
  if (file.size > 8 * 1024 * 1024) throw new Error("Image trop lourde (8 Mo maximum).")

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    upsert: false
  })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from("media").getPublicUrl(path)
  return data.publicUrl
}
