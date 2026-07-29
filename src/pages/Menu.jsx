import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

// Categories de secours affichees si Supabase n est pas encore configure
// ou si la table menu_items est vide (premier lancement du projet).
const FALLBACK = [
  { id: "f1", category: "Pizzas", name: "Margherita", price: 55, description: "Tomate San Marzano, mozzarella, basilic." },
  { id: "f2", category: "Pizzas", name: "Diavola", price: 65, description: "Salami piquant, mozzarella, piment frais." },
  { id: "f3", category: "Viandes", name: "Emince de Boeuf", price: 95, description: "Filet fin, sauce creme et champignons." },
  { id: "f4", category: "Maison", name: "Couscous du Vendredi", price: 65, description: "Agneau ou poulet, sept legumes." }
]

export default function Menu() {
  const [items, setItems] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, category, name, price, description")
        .order("category", { ascending: true })
      if (!error && data && data.length > 0) setItems(data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl md:text-5xl mb-2">Notre Menu</h1>
      <p className="text-inkdim mb-12">
        {loading ? "Chargement..." : "Prix indicatifs, geres depuis le panneau d administration."}
      </p>

      {categories.map((cat) => (
        <div key={cat} className="mb-14">
          <h2 className="font-serif text-2xl mb-5 text-gold">{cat}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {items.filter((i) => i.category === cat).map((item) => (
              <div key={item.id} className="bg-bgsoft border border-line rounded-2xl p-5 flex justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg">{item.name}</h3>
                  <p className="text-sm text-inkdim mt-1">{item.description}</p>
                </div>
                <span className="font-mono text-gold whitespace-nowrap">{item.price} MAD</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
