import { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"

// Page ouverte en scannant le QR code d une table : /table/:id
// Le client voit le menu et peut envoyer sa commande directement en salle
// (order_type = "dine_in"), sans passer par l adresse de livraison.
export default function TableMenu() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [table, setTable] = useState(null)
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({})
  const [status, setStatus] = useState(null)
  const [activeCat, setActiveCat] = useState(null)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("restaurant_tables").select("*").eq("id", id).single(),
        supabase.from("menu_items").select("id, name, price, category, image_url").order("category")
      ])
      setTable(t || null)
      setItems(m || [])
    }
    load()
  }, [id])

  const categories = useMemo(() => [...new Set(items.map((i) => i.category || "Autres"))], [items])

  useEffect(() => {
    if (categories.length > 0 && !activeCat) setActiveCat(categories[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Une seule categorie a la fois (pas tout le menu en vrac), meme logique
  // que /menu et /livraison pour rester coherent sur tout le site.
  const shown = items.filter((i) => (i.category || "Autres") === activeCat)

  const add = (itemId) => setCart((c) => ({ ...c, [itemId]: (c[itemId] || 0) + 1 }))
  const remove = (itemId) => setCart((c) => ({ ...c, [itemId]: Math.max(0, (c[itemId] || 0) - 1) }))
  const total = items.reduce((sum, i) => sum + (cart[i.id] || 0) * i.price, 0)
  const cartCount = Object.values(cart).reduce((s, n) => s + n, 0)

  const submit = async () => {
    setStatus("loading")
    const orderItems = items.filter((i) => cart[i.id] > 0).map((i) => ({ item_id: i.id, name: i.name, qty: cart[i.id], price: i.price }))
    const { data, error } = await supabase.from("orders").insert([{
      table_id: id, order_type: "dine_in", items: orderItems, total, status: "new",
      phone: "", address: table ? `Table ${table.number}` : "Table",
      customer_id: user ? user.id : null
    }]).select().single()
    if (error) { setStatus("error"); return }
    navigate(`/suivi/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-bg text-ink px-6 py-10 max-w-2xl mx-auto pb-28">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">
        {table ? `Table ${table.number}` : "Chargement de la table..."}
      </p>
      <h1 className="font-serif text-3xl mb-6">Commander a table</h1>

      {status === "error" && (
        <p className="text-red-400 text-sm mb-4">Une erreur est survenue - reessayez.</p>
      )}

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
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
        </div>
      )}

      <div className="grid gap-3 mb-8">
        {shown.map((item) => (
          <div key={item.id} className="bg-bgsoft border border-line rounded-2xl p-3 flex items-center gap-4">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                <span className="font-serif text-xl text-gold/40">{item.name?.[0]}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg truncate">{item.name}</p>
              <p className="font-mono text-gold text-sm">{item.price} MAD</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => remove(item.id)} disabled={!cart[item.id]}
                className="w-8 h-8 rounded-full border border-line disabled:opacity-30">-</button>
              <span className="w-5 text-center">{cart[item.id] || 0}</span>
              <button onClick={() => add(item.id)} className="w-8 h-8 rounded-full border border-line">+</button>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="text-inkdim text-sm text-center py-10">Aucun plat dans cette categorie.</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-bgsoft border-t border-line p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-inkdim text-xs">{cartCount} article(s)</p>
            <p className="font-serif text-2xl">{total} MAD</p>
          </div>
          <button onClick={submit} disabled={total === 0 || status === "loading"}
            className="px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
            {status === "loading" ? "Envoi..." : "Envoyer la commande"}
          </button>
        </div>
      </div>
    </div>
  )
}
