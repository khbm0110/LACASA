import { useEffect, useRef, useState } from "react"
import { uploadImage } from "../lib/uploadImage"

// Champ image reutilisable pour l'admin : soit coller un lien, soit
// televerser un fichier (stocke sur Supabase Storage, bucket "media").
//
// Props:
//  - value: url actuelle (string)
//  - onChange(url): appele avec la nouvelle url
//  - folder: sous-dossier de stockage ("menu" | "gallery" | "events" | "blog")
//  - label: texte au-dessus du champ
export default function ImageUploadInput({ value, onChange, folder = "misc", label = "Image" }) {
  const [mode, setMode] = useState("url")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [linkBroken, setLinkBroken] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { setLinkBroken(false) }, [value])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
    } catch (err) {
      setError(err.message || "Echec du televersement.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="sm:col-span-2">
      {label && <label className="text-xs text-inkdim block mb-1.5">{label}</label>}

      <div className="flex gap-1.5 mb-2 font-mono text-[11px]">
        <button type="button" onClick={() => setMode("url")}
          className={`px-3 py-1 rounded-full border ${mode === "url" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          Lien
        </button>
        <button type="button" onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded-full border ${mode === "upload" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          Televerser
        </button>
      </div>

      <div className="flex gap-3 items-start">
        {value && !linkBroken && (
          <img src={value} alt="apercu" onError={() => setLinkBroken(true)}
            className="w-16 h-16 rounded-lg object-cover border border-line shrink-0" />
        )}
        {value && linkBroken && (
          <span className="w-16 h-16 rounded-lg border border-dashed border-red-400/50 shrink-0 flex items-center justify-center text-red-400 text-[10px] text-center leading-tight px-1">
            Lien invalide
          </span>
        )}
        <div className="flex-1 min-w-0">
          {mode === "url" ? (
            <input
              placeholder="https://... (lien direct vers l image)"
              value={value || ""}
              onChange={(e) => onChange(e.target.value.trim())}
              className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato"
            />
          ) : (
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} disabled={uploading}
                className="w-full text-xs text-inkdim file:mr-3 file:px-3 file:py-2 file:rounded-full file:border-0 file:bg-tomato file:text-paper file:text-xs file:font-semibold file:cursor-pointer disabled:opacity-60" />
              {uploading && <p className="text-xs text-gold mt-1.5">Televersement en cours...</p>}
            </div>
          )}
          {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          {linkBroken && !error && (
            <p className="text-xs text-red-400 mt-1.5">
              Ce lien ne charge pas d image. Verifiez que c est un lien direct (se terminant par .jpg/.png/.webp,
              pas une page Google Images / Drive / Facebook / Instagram) — ou utilisez "Televerser" a la place.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
