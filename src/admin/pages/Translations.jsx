import { useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Permet d uploader un fichier JSON de traduction (ex: es.json, en.json)
// pour remplacer les textes d interface sans toucher au code.
// Le fichier est stocke dans la table "ui_translations" (colonne lang, colonne data JSONB)
// et/ou dans le bucket Supabase Storage "translations" pour servir de source statique.
export default function Translations() {
  const [lang, setLang] = useState("es")
  const [fileContent, setFileContent] = useState(null)
  const [fileName, setFileName] = useState("")
  const [status, setStatus] = useState(null)

  const onFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        setFileContent(parsed)
      } catch {
        setStatus("invalid_json")
      }
    }
    reader.readAsText(file)
  }

  const upload = async () => {
    if (!fileContent) return
    setStatus("saving")
    const { error } = await supabase.from("ui_translations").upsert({ lang, data: fileContent })
    setStatus(error ? "error" : "success")
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Fichiers de traduction</h1>
      <p className="text-inkdim text-sm mb-8">
        Le francais reste la langue par defaut du site. Ajoutez ou remplacez ici les fichiers
        JSON pour l arabe, l espagnol et l anglais (meme structure que src/i18n/locales/fr.json).
      </p>

      <div className="bg-bgsoft border border-line rounded-2xl p-6 max-w-lg">
        <label className="text-sm text-inkdim block mb-2">Langue</label>
        <select value={lang} onChange={(e) => setLang(e.target.value)}
          className="w-full mb-4 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm">
          <option value="ar">Arabe (ar)</option>
          <option value="es">Espagnol (es)</option>
          <option value="en">Anglais (en)</option>
        </select>

        <label className="text-sm text-inkdim block mb-2">Fichier JSON</label>
        <input type="file" accept="application/json" onChange={onFile}
          className="w-full mb-4 text-sm text-inkdim" />
        {fileName && <p className="text-xs text-inkdim mb-4">Fichier charge : {fileName}</p>}

        <button onClick={upload} disabled={!fileContent || status === "saving"}
          className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
          {status === "saving" ? "Envoi..." : "Enregistrer la traduction"}
        </button>

        {status === "success" && <p className="text-basil text-xs mt-3">Traduction enregistree.</p>}
        {status === "error" && <p className="text-red-400 text-xs mt-3">Erreur - verifiez la configuration Supabase.</p>}
        {status === "invalid_json" && <p className="text-red-400 text-xs mt-3">Le fichier n est pas un JSON valide.</p>}
      </div>
    </div>
  )
}
