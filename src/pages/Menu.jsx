import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import Reveal from "../components/Reveal.jsx"

// NOTE traduction : les noms/descriptions des plats viennent de la base de
// donnees (menu_items) et sont donc dans une seule langue (celle saisie
// dans l admin) - seuls les libelles de l interface sont traduits ici.
// Pour des fiches plats multilingues, il faudrait des colonnes JSONB comme
// pour site_content (evolution possible plus tard).
const FALLBACK = [
  { id: "f1", category: "Pizzas", name: "Margherita", price: 55, description: "Tomate San Marzano, mozzarella, basilic." },
  { id: "f2", category: "Pizzas", name: "Diavola", price: 65, description: "Salami piquant, mozzarella, piment frais." },
  { id: "f3", category: "Viandes", name: "Emince de Boeuf", price: 95, description: "Filet fin, sauce creme et champignons." },
  { id: "f4", category: "Maison", name: "Couscous du Vendredi", price: 65, description: "Agneau ou poulet, sept legumes." }
]

function slugCat(cat) {
  return "cat-" + (cat || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export default function Menu() {
  const { t } = useTranslation()
  useSEO({ title: t("menu_page.title") })
  const [items, setItems] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, category, name, price, description, image_url")
        .order("category", { ascending: true })
      if (!error && data && data.length > 0) setItems(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = [...new Set(items.map((i) => i.category))]

  useEffect(() => {
    if (categories.length > 0 && !activeCat) setActiveCat(categories[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const jumpTo = (cat) => {
    setActiveCat(cat)
    document.getElementById(slugCat(cat))?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-20">
      <Reveal>
        <h1 className="font-serif text-4xl md:text-5xl mb-2">{t("menu_page.title")}</h1>
        <p className="text-inkdim mb-8">{loading ? t("menu_page.loading") : t("menu_page.note")}</p>
      </Reveal>

      {/* Navigation par categories - organise la carte et permet un acces rapide */}
      {categories.length > 1 && (
        <div className="sticky top-[64px] z-30 -mx-6 md:-mx-8 px-6 md:px-8 py-3 mb-10 bg-bg/85 backdrop-blur-md border-b border-line">
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => jumpTo(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wide border transition ${
                  activeCat === cat ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim hover:text-ink hover:border-tomato"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.map((cat, ci) => (
        <div key={cat} id={slugCat(cat)} className="mb-16 scroll-mt-32">
          <Reveal>
            <h2 className="font-serif text-2xl mb-5 text-gold">{cat}</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-4">
            {items.filter((i) => i.category === cat).map((item, ii) => (
              <Reveal key={item.id} delay={Math.min(ii, 6) * 70}>
                <div className="group bg-bgsoft border border-line rounded-2xl p-5 flex justify-between gap-4 h-full hover:border-tomato hover:-translate-y-1 transition-all duration-300">
                  <div className="flex gap-4 min-w-0">
                    {item.image_url && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-line shrink-0">
                        <img src={item.image_url} alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg">{item.name}</h3>
                      <p className="text-sm text-inkdim mt-1">{item.description}</p>
                    </div>
                  </div>
                  <span className="font-mono text-gold whitespace-nowrap">{item.price} MAD</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
