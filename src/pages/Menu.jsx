import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"
import { motion, AnimatePresence } from "framer-motion"

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

  const shownItems = items.filter((i) => i.category === activeCat)

  return (
    <section className="max-w-wide mx-auto px-5 md:px-10 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-serif text-4xl md:text-5xl mb-2">{t("menu_page.title")}</h1>
        <p className="text-pale/70 mb-8">{loading ? t("menu_page.loading") : t("menu_page.note")}</p>
      </motion.div>

      {/* Category filter with layout animation */}
      {categories.length > 1 && (
        <motion.div
          layout
          className="flex flex-wrap gap-2 mb-10"
        >
          {categories.map((cat, i) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCat(cat)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2  text-sm font-mono uppercase tracking-wide border transition-colors ${
                activeCat === cat ? "bg-gold border-tomato text-white" : "border-white/[0.06] text-pale/70 hover:text-ivory hover:border-tomato"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Menu grid with layout animation for filtering */}
      <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {shownItems.map((item, ii) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
              className="flip-card h-64 md:h-80"
              onClick={(e) => {
                if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped")
              }}
            >
              <div className="flip-card-inner">
                {/* Front face */}
                <div className="flip-face bg-white border border-white/[0.06]  flex flex-col">
                  {item.image_url ? (
                    <div className="relative h-36 md:h-56 overflow-hidden">
                      <motion.img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                      />
                      <div className="absolute top-3 left-3 font-mono text-[10px] text-goldBright tracking-[0.2em]">/ {String(ii + 1).padStart(2, "0")}</div>
                    </div>
                  ) : (
                    <div className="relative h-36 md:h-56 flex items-center justify-center" style={{ background: "linear-gradient(155deg,#E8DCC8,#D4C4A8 60%)" }}>
                      <span className="font-serif text-3xl text-gold/40">{item.name?.[0]}</span>
                      <div className="absolute top-3 left-3 font-mono text-[10px] text-goldBright tracking-[0.2em]">/ {String(ii + 1).padStart(2, "0")}</div>
                    </div>
                  )}
                  <div className="p-3 md:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-pale/70 mb-1">{item.category}</p>
                      <h3 className="font-serif text-base md:text-xl leading-tight">{item.name}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-white/[0.06] mt-2 md:mt-3">
                      <motion.p
                        className="font-mono text-goldBright text-sm md:text-base"
                        whileHover={{ scale: 1.05, color: "#FF7A3D" }}
                      >
                        {item.price} MAD
                      </motion.p>
                      <span className="hidden md:inline font-mono text-[10px] text-pale/70 uppercase tracking-widest">Survoler &rarr;</span>
                    </div>
                  </div>
                </div>
                {/* Back face */}
                <div className="flip-face flip-back bg-white border border-tomato/50 rounded-2xl p-4 md:p-7 flex flex-col">
                  <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-goldBright mb-2 md:mb-3">/ {item.category}</p>
                  <h3 className="font-serif text-lg md:text-2xl mb-2 md:mb-4">{item.name}</h3>
                  <p className="text-pale/70 text-xs md:text-sm leading-relaxed flex-1 line-clamp-4 md:line-clamp-none">
                    {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                  </p>
                  <motion.p
                    className="font-mono text-goldBright text-sm md:text-lg pt-2 md:pt-4 border-t border-white/[0.06] mt-2 md:mt-4"
                    whileHover={{ color: "#FF7A3D" }}
                  >
                    {item.price} MAD
                  </motion.p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {shownItems.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-pale/70 text-sm col-span-full"
          >
            {t("menu_page.note")}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}
