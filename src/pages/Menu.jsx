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

  // Filtre reel : seul le plat de la categorie active est affiche
  // (auparavant tout le monde etait affiche et les boutons ne faisaient
  // que defiler la page - source de la confusion "toutes les assiettes
  // s'affichent").
  const shownItems = items.filter((i) => i.category === activeCat)

  return (
    <section className="max-w-6xl mx-auto px-6 lg:px-10 py-20">
      <Reveal>
        <h1 className="font-serif text-4xl md:text-5xl mb-2">{t("menu_page.title")}</h1>
        <p className="text-inkdim mb-8">{loading ? t("menu_page.loading") : t("menu_page.note")}</p>
      </Reveal>

      {/* Filtre par categorie - boutons qui filtrent reellement la liste,
          en colonnes multiples (flex-wrap) plutot qu'une seule ligne
          defilante trop longue sur les petits ecrans */}
      {categories.length > 1 && (
        <Reveal className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide border transition ${
                activeCat === cat ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim hover:text-ink hover:border-tomato"
              }`}
            >
              {cat}
            </button>
          ))}
        </Reveal>
      )}

      {/* Grille de cartes avec grande photo (coherent avec "A la une" de
          l'accueil) au lieu de la petite vignette 64x64 en liste */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shownItems.map((item, ii) => (
          <Reveal key={item.id} delay={Math.min(ii, 6) * 70}>
            <div className="group bg-bgsoft border border-line rounded-2xl overflow-hidden hover:border-tomato hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col">
              {item.image_url ? (
                <div className="h-48 overflow-hidden">
                  <img src={item.image_url} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                  <span className="font-serif text-3xl text-gold/40">{item.name?.[0]}</span>
                </div>
              )}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl mb-2">{item.name}</h3>
                  <p className="text-sm text-inkdim">{item.description}</p>
                </div>
                <p className="font-mono text-gold mt-4 pt-4 border-t border-line">{item.price} MAD</p>
              </div>
            </div>
          </Reveal>
        ))}

        {shownItems.length === 0 && (
          <p className="text-inkdim text-sm col-span-full">{t("menu_page.note")}</p>
        )}
      </div>
    </section>
  )
}
