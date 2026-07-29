import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Table "site_content": une ligne par section (hero, about, hours...),
// avec une colonne JSONB "value" contenant { fr, ar, es, en }.
const SECTIONS = [
  { key: "hero_title", label: "Titre principal (accueil)" },
  { key: "hero_lede", label: "Texte sous le titre (accueil)" },
  { key: "about_text", label: "Texte Notre Histoire" },
  { key: "hours", label: "Horaires affiches" }
]

export default function ContentEditor() {
  const [content, setContent] = useState({})
  const [lang, setLang] = useState("fr")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_content").select("key, value")
      const map = {}
      ;(data || []).forEach((row) => { map[row.key] = row.value || {} })
      setContent(map)
    }
    load()
  }, [])

  const updateField = (key) => (e) => {
    setContent((c) => ({ ...c, [key]: { ...(c[key] || {}), [lang]: e.target.value } }))
  }

  const saveAll = async () => {
    setSaving(true)
    for (const section of SECTIONS) {
      await supabase.from("site_content").upsert({ key: section.key, value: content[section.key] || {} })
    }
    setSaving(false)
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Contenu du site</h1>
      <p className="text-inkdim text-sm mb-6">Modifiez les textes affiches sur la page d accueil, par langue.</p>

      <div className="flex gap-2 mb-6 font-mono text-xs">
        {["fr", "ar", "es", "en"].map((l) => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-full border ${lang === l ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((s) => (
          <div key={s.key}>
            <label className="text-sm text-inkdim block mb-1">{s.label}</label>
            <textarea
              rows={2}
              value={(content[s.key] && content[s.key][lang]) || ""}
              onChange={updateField(s.key)}
              className="w-full bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato"
            />
          </div>
        ))}
      </div>

      <button onClick={saveAll} disabled={saving}
        className="mt-6 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60">
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  )
}
