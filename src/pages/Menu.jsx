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
    <section className="page-wrap-lg">
      <Reveal>
        <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Notre carte</span></div>
        <h1 className="page-title">LA <span className="text-stroke">CARTE.</span></h1>
        <p className="page-lede">{loading ? t("menu_page.loading") : t("menu_page.note")}</p>
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
              className={`cat-pill ${activeCat === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </Reveal>
      )}

      {/* Grille de cartes retournables - meme traitement que "A la une" sur
          l'accueil, pour une experience visuelle coherente partout ou les
          photos du menu apparaissent */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {shownItems.map((item, ii) => (
          <Reveal key={item.id} delay={Math.min(ii, 6) * 70}>
            <div className="flip-card"
              onClick={(e) => {
                if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped")
              }}>
              <div className="flip-card-inner">
                {/* Face avant : photo + prix */}
                <div className="flip-face info-card flex flex-col">
                  {item.image_url ? (
                    <div className="h-24 md:h-32 overflow-hidden">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 md:h-32 flex items-center justify-center" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl text-gold/40">{item.name?.[0]}</span>
                    </div>
                  )}
                  <div className="p-2 md:p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-widest text-inkdim mb-0.5">{item.category}</p>
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-sm md:text-lg leading-tight">{item.name}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-1 md:pt-2 border-t border-line mt-1 md:mt-2">
                      <p className="font-mono text-gold text-xs md:text-sm">{item.price} MAD</p>
                      <span className="hidden md:inline font-mono text-[9px] text-inkdim uppercase tracking-widest">Survoler &rarr;</span>
                    </div>
                  </div>
                </div>
                {/* Face arriere : description */}
                <div className="flip-face flip-back info-card p-2.5 md:p-4 flex flex-col">
                  <p className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.15em] text-gold mb-1 md:mb-2">/ {item.category}</p>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-base md:text-xl mb-1 md:mb-2">{item.name}</h3>
                  <p className="text-inkdim text-[11px] md:text-xs leading-relaxed flex-1 line-clamp-3 md:line-clamp-4">
                    {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                  </p>
                  <p className="font-mono text-gold text-xs md:text-sm pt-1 md:pt-2 border-t border-line mt-1 md:mt-2">{item.price} MAD</p>
                </div>
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
