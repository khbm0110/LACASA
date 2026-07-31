import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useToast } from "../ui/Toast.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import ImageUploadInput from "../../components/ImageUploadInput.jsx"

// Table "site_content": une ligne par section (hero, about, hours...),
// avec une colonne JSONB "value" contenant { fr, ar, es, en }.
const SECTIONS = [
  { key: "hero_title", label: "Titre principal (accueil)" },
  { key: "hero_lede", label: "Texte sous le titre (accueil)" },
  { key: "about_text", label: "Texte Notre Histoire" },
  { key: "hours", label: "Horaires affiches" }
]

const SERVICE_TOGGLES = [
  { key: "delivery_enabled", label: "Livraison", hint: "Coupe la commande en livraison sur tout le site (menu et paiement toujours visibles, mais la commande est bloquee)." },
  { key: "online_payment_enabled", label: "Paiement en ligne", hint: "Si desactive, la livraison repasse en paiement a la reception (sans passer par la page de paiement carte)." },
  { key: "reservations_enabled", label: "Reservations de table", hint: "Coupe le formulaire de reservation (utile si complet, ou fermeture exceptionnelle)." }
]

export default function ContentEditor() {
  const [content, setContent] = useState({})
  const [lang, setLang] = useState("fr")
  const [saving, setSaving] = useState(false)
  const [reviewsCount, setReviewsCount] = useState(6)
  const [savingReviews, setSavingReviews] = useState(false)
  const [services, setServices] = useState({ delivery_enabled: true, online_payment_enabled: true, reservations_enabled: true })
  const [heroDishes, setHeroDishes] = useState([])
  const [heroForm, setHeroForm] = useState({ url: "", label: "" })
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_content").select("key, value")
      const map = {}
      ;(data || []).forEach((row) => { map[row.key] = row.value || {} })
      setContent(map)
    }
    async function loadInfo() {
      const { data } = await supabase.from("restaurant_info")
        .select("home_reviews_count, delivery_enabled, online_payment_enabled, reservations_enabled")
        .eq("id", 1).single()
      if (data?.home_reviews_count) setReviewsCount(data.home_reviews_count)
      if (data) setServices({
        delivery_enabled: data.delivery_enabled,
        online_payment_enabled: data.online_payment_enabled,
        reservations_enabled: data.reservations_enabled
      })
    }
    async function loadHeroDishes() {
      const { data } = await supabase.from("hero_dishes").select("*").order("sort_order")
      setHeroDishes(data || [])
    }
    load()
    loadInfo()
    loadHeroDishes()
  }, [])

  const saveReviewsCount = async () => {
    setSavingReviews(true)
    const { error } = await supabase.from("restaurant_info").update({ home_reviews_count: Number(reviewsCount) || 6 }).eq("id", 1)
    setSavingReviews(false)
    if (error) toast.error("Echec de l enregistrement.")
    else toast.success("Enregistre.")
  }

  const toggleService = async (key) => {
    const next = !services[key]
    setServices((s) => ({ ...s, [key]: next })) // optimiste
    const { error } = await supabase.from("restaurant_info").update({ [key]: next }).eq("id", 1)
    if (error) {
      setServices((s) => ({ ...s, [key]: !next })) // on annule si echec
      toast.error("Echec de la mise a jour.")
      return
    }
    toast.success(next ? "Service reactive." : "Service mis en pause.")
  }

  const addHeroDish = async (e) => {
    e.preventDefault()
    if (!heroForm.url) return
    const { error } = await supabase.from("hero_dishes").insert([{
      url: heroForm.url,
      label: heroForm.label || null,
      sort_order: heroDishes.length
    }])
    if (error) { toast.error("Echec de l ajout."); return }
    setHeroForm({ url: "", label: "" })
    const { data } = await supabase.from("hero_dishes").select("*").order("sort_order")
    setHeroDishes(data || [])
    toast.success("Photo ajoutee au Hero.")
  }

  const removeHeroDish = async (id) => {
    const ok = await confirm({ title: "Supprimer cette photo du Hero ?" })
    if (!ok) return
    const { error } = await supabase.from("hero_dishes").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    setHeroDishes((list) => list.filter((d) => d.id !== id))
    toast.success("Photo supprimee.")
  }

  const updateField = (key) => (e) => {
    setContent((c) => ({ ...c, [key]: { ...(c[key] || {}), [lang]: e.target.value } }))
  }

  const saveAll = async () => {
    setSaving(true)
    for (const section of SECTIONS) {
      await supabase.from("site_content").upsert({ key: section.key, value: content[section.key] || {} })
    }
    setSaving(false)
    toast.success("Contenu enregistre.")
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

      <div className="mt-14 pt-8 border-t border-line">
        <h2 className="font-serif text-2xl mb-2">Etat des services</h2>
        <p className="text-inkdim text-sm mb-4">
          Mettez en pause un service temporairement, sans toucher au code. Effet immediat sur le site.
        </p>
        <div className="grid gap-3">
          {SERVICE_TOGGLES.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-4 bg-bgsoft border border-line rounded-2xl px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-inkdim mt-0.5">{s.hint}</p>
              </div>
              <button
                onClick={() => toggleService(s.key)}
                aria-pressed={!!services[s.key]}
                className={`shrink-0 w-12 h-7 rounded-full relative transition ${services[s.key] ? "bg-basil" : "bg-white/10"}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${services[s.key] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-line">
        <h2 className="font-serif text-2xl mb-2">Photo(s) du Hero (accueil)</h2>
        <p className="text-inkdim text-sm mb-4 max-w-2xl">
          Le grand visuel en haut de la page d accueil. Ajoutez une photo (lien ou
          televersement) ou plusieurs - avec plusieurs photos, elles defilent en fondu
          automatiquement. Sans aucune photo, un visuel par defaut s affiche.
        </p>

        <form onSubmit={addHeroDish} className="bg-bgsoft border border-line rounded-2xl p-5 grid sm:grid-cols-2 gap-3 mb-6">
          <ImageUploadInput
            label="Photo du plat"
            value={heroForm.url}
            onChange={(url) => setHeroForm((f) => ({ ...f, url }))}
            folder="hero"
          />
          <div>
            <label className="text-xs text-inkdim block mb-1.5">Nom du plat (optionnel, affiche en overlay)</label>
            <input
              placeholder="ex: Pizza al Forno"
              value={heroForm.label}
              onChange={(e) => setHeroForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato"
            />
          </div>
          <button className="sm:col-span-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] w-fit">
            Ajouter au Hero
          </button>
        </form>

        <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
          {heroDishes.map((d) => (
            <div key={d.id} className="bg-bgsoft border border-line rounded-2xl overflow-hidden">
              <img src={d.url} alt={d.label || "Plat"} className="w-full h-28 object-cover" />
              <div className="p-3 flex items-center justify-between gap-2">
                <span className="text-xs text-inkdim truncate">{d.label || "Sans nom"}</span>
                <button onClick={() => removeHeroDish(d.id)} className="text-red-400 text-xs shrink-0">Suppr.</button>
              </div>
            </div>
          ))}
          {heroDishes.length === 0 && <p className="text-inkdim text-sm">Aucune photo - le visuel par defaut est affiche.</p>}
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-line">
        <h2 className="font-serif text-2xl mb-2">Slider Avis Google (accueil)</h2>
        <p className="text-inkdim text-sm mb-4">
          Nombre d avis Google affiches dans le slider de la page d accueil.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="20"
            value={reviewsCount}
            onChange={(e) => setReviewsCount(e.target.value)}
            className="w-24 bg-bgsoft border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato"
          />
          <button onClick={saveReviewsCount} disabled={savingReviews}
            className="px-5 py-2.5 rounded-full text-sm font-semibold border border-line hover:bg-white/5 disabled:opacity-60">
            {savingReviews ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}
