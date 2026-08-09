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
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#f5f5f5" }}>
      <div className="page-wrap" style={{ maxWidth: 640, paddingBottom: "8rem" }}>
        <div className="section-marker" style={{ marginBottom: "1.5rem" }}>
          <span>{table ? `Table ${table.number}` : "Chargement de la table..."}</span>
        </div>
        <h1 className="page-title" style={{ marginBottom: "2rem" }}>COMMANDER <span className="text-stroke">A TABLE.</span></h1>

        {status === "error" && (
          <p className="text-red-400 text-sm mb-4">Une erreur est survenue - reessayez.</p>
        )}

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`cat-pill ${activeCat === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-3 mb-8">
          {shown.map((item) => (
            <div key={item.id} className="info-card p-3 flex items-center gap-4">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover shrink-0" />
              ) : (
                <div className="w-20 h-20 shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-xl text-gold/40">{item.name?.[0]}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-lg truncate">{item.name}</p>
                <p className="font-mono text-gold text-sm">{item.price} MAD</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => remove(item.id)} disabled={!cart[item.id]}
                  className="w-8 h-8 border border-line-light disabled:opacity-30">-</button>
                <span className="w-5 text-center">{cart[item.id] || 0}</span>
                <button onClick={() => add(item.id)} className="w-8 h-8 border border-line-light">+</button>
              </div>
            </div>
          ))}
          {shown.length === 0 && <p className="text-inkdim text-sm text-center py-10">Aucun plat dans cette categorie.</p>}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0" style={{ background: "#141414", borderTop: "1px solid #1f1f1f", padding: "1rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-inkdim text-xs">{cartCount} article(s)</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-2xl">{total} MAD</p>
          </div>
          <button onClick={submit} disabled={total === 0 || status === "loading"}
            style={{ background: "#D2491F", color: "#000", padding: "0.85rem 1.5rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.05rem", letterSpacing: "0.06em", border: "none", cursor: "pointer" }}
            className="disabled:opacity-50">
            {status === "loading" ? "Envoi..." : "Envoyer la commande"}
          </button>
        </div>
      </div>
    </div>
  )
}
