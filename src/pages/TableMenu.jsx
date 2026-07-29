import { useEffect, useState } from "react"
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

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: m }] = await Promise.all([
        supabase.from("restaurant_tables").select("*").eq("id", id).single(),
        supabase.from("menu_items").select("id, name, price, category").order("category")
      ])
      setTable(t || null)
      setItems(m || [])
    }
    load()
  }, [id])

  const add = (itemId) => setCart((c) => ({ ...c, [itemId]: (c[itemId] || 0) + 1 }))
  const remove = (itemId) => setCart((c) => ({ ...c, [itemId]: Math.max(0, (c[itemId] || 0) - 1) }))
  const total = items.reduce((sum, i) => sum + (cart[i.id] || 0) * i.price, 0)

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
    <div className="min-h-screen bg-bg text-ink px-6 py-10 max-w-2xl mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">
        {table ? `Table ${table.number}` : "Chargement de la table..."}
      </p>
      <h1 className="font-serif text-3xl mb-8">Commander a table</h1>

      {status === "error" && (
        <p className="text-red-400 text-sm mb-4">Une erreur est survenue - reessayez.</p>
      )}
      <div className="grid gap-3 mb-8">
        {items.map((item) => (
          <div key={item.id} className="bg-bgsoft border border-line rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-serif text-lg">{item.name}</p>
              <p className="font-mono text-gold text-sm">{item.price} MAD</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => remove(item.id)} className="w-8 h-8 rounded-full border border-line">-</button>
              <span className="w-5 text-center">{cart[item.id] || 0}</span>
              <button onClick={() => add(item.id)} className="w-8 h-8 rounded-full border border-line">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-4 bg-bgsoft border border-line rounded-2xl p-5 flex items-center justify-between">
        <p className="font-serif text-2xl">{total} MAD</p>
        <button onClick={submit} disabled={total === 0 || status === "loading"}
          className="px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
          {status === "loading" ? "Envoi..." : "Envoyer la commande"}
        </button>
      </div>
    </div>
  )
}
