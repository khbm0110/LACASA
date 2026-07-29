import { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"

const FALLBACK = [
  { id: "f1", category: "Pizzas", name: "Margherita", price: 55, description: "Tomate San Marzano, mozzarella, basilic." },
  { id: "f2", category: "Pizzas", name: "Diavola", price: 65, description: "Salami piquant, mozzarella, piment frais." },
  { id: "f3", category: "Viandes & Poissons", name: "Emince de Poulet", price: 80, description: "Escalope fine, sauce citronnee legere." },
  { id: "f4", category: "Maison", name: "Tagliatelle al Ragu", price: 70, description: "Pates fraiches, ragu de boeuf mijote." }
]

// Frais de livraison simples : gratuite au-dela d un certain montant.
const DELIVERY_FEE = 15
const FREE_DELIVERY_THRESHOLD = 150
const MIN_ORDER = 40

export default function Delivery() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [items, setItems] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("Tous")
  const [status, setStatus] = useState(null)
  const [promoInput, setPromoInput] = useState("")
  const [promo, setPromo] = useState(null)
  const [promoError, setPromoError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, category, name, price, description")
        .eq("available_for_delivery", true)
        .order("category")
      if (!error && data && data.length > 0) setItems(data)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (profile?.phone && !phone) setPhone(profile.phone)
  }, [profile]) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => ["Tous", ...new Set(items.map((i) => i.category || "Autres"))], [items])

  const filtered = items.filter((i) => {
    const matchCat = activeCat === "Tous" || (i.category || "Autres") === activeCat
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const addToCart = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeFromCart = (id) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) - 1) }))

  const cartLines = items.filter((i) => cart[i.id] > 0)
  const subtotal = cartLines.reduce((sum, i) => sum + cart[i.id] * i.price, 0)
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

  const discount = useMemo(() => {
    if (!promo || subtotal < (promo.min_order || 0)) return 0
    return promo.discount_type === "percent" ? Math.round((subtotal * promo.value) / 100) : Math.min(promo.value, subtotal)
  }, [promo, subtotal])

  const total = Math.max(0, subtotal + deliveryFee - discount)
  const pointsEarned = Math.floor(total / 10)
  const belowMin = subtotal > 0 && subtotal < MIN_ORDER
  const canOrder = subtotal >= MIN_ORDER && address.trim() && phone.trim()

  const applyPromo = async () => {
    setPromoError(null)
    setPromo(null)
    if (!promoInput.trim()) return
    const { data, error } = await supabase.from("promo_codes").select("*").eq("code", promoInput.trim().toUpperCase()).single()
    if (error || !data) { setPromoError("Code promo introuvable."); return }
    if (!data.active) { setPromoError("Ce code n est plus actif."); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError("Ce code a expire."); return }
    if (subtotal < (data.min_order || 0)) { setPromoError(`Commande minimum de ${data.min_order} MAD pour ce code.`); return }
    setPromo(data)
  }

  const submitOrder = async () => {
    setStatus("loading")
    const orderItems = cartLines.map((i) => ({ item_id: i.id, name: i.name, qty: cart[i.id], price: i.price }))
    const { data, error } = await supabase.from("orders").insert([{
      address, phone, notes, items: orderItems,
      total, status: "new", order_type: "delivery",
      customer_id: user ? user.id : null,
      promo_code: promo ? promo.code : null,
      discount
    }]).select().single()

    if (error) { setStatus("error"); return }
    navigate(`/suivi/${data.id}`)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Commander en livraison</h1>
      <p className="text-inkdim mb-2">
        Livraison estimee 15 a 20 minutes selon votre secteur - commande minimum {MIN_ORDER} MAD,
        livraison offerte des {FREE_DELIVERY_THRESHOLD} MAD.
      </p>
      {!user && (
        <p className="text-inkdim text-sm mb-8">
          <Link to="/compte" className="text-gold underline">Connectez-vous</Link> pour cumuler des points de fidelite sur cette commande.
        </p>
      )}

      {status === "error" ? (
        <p className="text-red-400 text-sm mb-8">Une erreur est survenue - verifiez la configuration Supabase et reessayez.</p>
      ) : null}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              placeholder="Rechercher un plat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[180px] bg-bgsoft border border-line rounded-xl px-4 py-2.5 text-sm outline-none focus:border-tomato"
            />
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-mono border transition ${
                  activeCat === cat ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            {loading && <p className="text-inkdim text-sm">Chargement du menu...</p>}
            {!loading && filtered.length === 0 && (
              <p className="text-inkdim text-sm">Aucun plat ne correspond a votre recherche.</p>
            )}
            {filtered.map((item) => (
              <div key={item.id} className="bg-bgsoft border border-line rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-serif text-lg truncate">{item.name}</p>
                  {item.description && <p className="text-inkdim text-xs mt-1 line-clamp-2">{item.description}</p>}
                  <p className="font-mono text-gold text-sm mt-1">{item.price} MAD</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => removeFromCart(item.id)} disabled={!cart[item.id]}
                    className="w-8 h-8 rounded-full border border-line disabled:opacity-30">-</button>
                  <span className="w-5 text-center">{cart[item.id] || 0}</span>
                  <button onClick={() => addToCart(item.id)} className="w-8 h-8 rounded-full border border-line">+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bgsoft border border-line rounded-2xl p-5 h-fit sticky top-24">
          <p className="font-mono text-xs uppercase tracking-widest text-gold mb-3">Votre commande</p>

          {cartLines.length === 0 ? (
            <p className="text-inkdim text-sm mb-4">Votre panier est vide - ajoutez des plats a gauche.</p>
          ) : (
            <div className="grid gap-2 mb-4">
              {cartLines.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-inkdim truncate pr-2">{cart[i.id]} x {i.name}</span>
                  <span className="font-mono whitespace-nowrap">{cart[i.id] * i.price} MAD</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 mb-3">
            <input placeholder="Code promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
              className="flex-1 bg-bg border border-line rounded-xl px-3 py-2 text-sm outline-none focus:border-tomato" />
            <button onClick={applyPromo} className="px-3 py-2 rounded-xl text-xs border border-line">Appliquer</button>
          </div>
          {promoError && <p className="text-xs text-red-400 mb-2">{promoError}</p>}
          {promo && <p className="text-xs text-basil mb-2">Code {promo.code} applique.</p>}

          <div className="border-t border-line pt-3 mb-4 grid gap-1.5 text-sm">
            <div className="flex justify-between text-inkdim">
              <span>Sous-total</span><span>{subtotal} MAD</span>
            </div>
            <div className="flex justify-between text-inkdim">
              <span>Livraison</span><span>{deliveryFee === 0 ? "Offerte" : `${deliveryFee} MAD`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-basil">
                <span>Remise</span><span>-{discount} MAD</span>
              </div>
            )}
            <div className="flex justify-between font-serif text-xl pt-1">
              <span>Total</span><span>{total} MAD</span>
            </div>
          </div>

          {belowMin && (
            <p className="text-xs text-gold mb-3">
              Ajoutez {MIN_ORDER - subtotal} MAD pour atteindre le minimum de commande.
            </p>
          )}
          {user && total > 0 && (
            <p className="text-xs text-inkdim mb-3">Vous gagnerez ~{pointsEarned} points de fidelite sur cette commande.</p>
          )}

          <input placeholder="Adresse de livraison" value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full mb-3 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input placeholder="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-3 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <textarea placeholder="Instructions (etage, code porte...)" value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} className="w-full mb-4 bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />

          <button
            onClick={submitOrder}
            disabled={!canOrder || status === "loading"}
            className="w-full px-5 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50"
          >
            {status === "loading" ? "Envoi..." : `Commander - ${total} MAD`}
          </button>
        </div>
      </div>
    </section>
  )
}
