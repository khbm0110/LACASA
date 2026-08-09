import { useEffect, useMemo, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { useSEO } from "../lib/useSEO"
import { useServiceStatus } from "../lib/useServiceStatus"

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
  const { t } = useTranslation()
  useSEO({ title: t("delivery_page.title") })
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { delivery_enabled, online_payment_enabled } = useServiceStatus()
  const [items, setItems] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState(null)
  const [status, setStatus] = useState(null)
  const [promoInput, setPromoInput] = useState("")
  const [promo, setPromo] = useState(null)
  const [promoError, setPromoError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, category, name, price, description, image_url")
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

  const categories = useMemo(() => [...new Set(items.map((i) => i.category || "Autres"))], [items])

  useEffect(() => {
    if (categories.length > 0 && !activeCat) setActiveCat(categories[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Une seule categorie affichee a la fois (pas tout le menu en vrac) - la
  // recherche, elle, ignore volontairement le filtre de categorie pour que
  // taper un plat le retrouve meme s'il est dans une autre categorie.
  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : items.filter((i) => (i.category || "Autres") === activeCat)

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
  const canOrder = delivery_enabled !== false && subtotal >= MIN_ORDER && address.trim() && phone.trim()

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
      // "awaiting_confirmation" reste le statut de depart, mais desormais
      // c est le paiement en ligne (voir Payment.jsx + chari-webhook) qui
      // fait passer la commande directement a "new" (cuisine) une fois
      // confirme cote serveur - la commande ne part donc jamais en
      // cuisine tant qu elle n est pas payee.
      total, status: "awaiting_confirmation", order_type: "delivery",
      customer_id: user ? user.id : null,
      promo_code: promo ? promo.code : null,
      discount
    }]).select().single()

    if (error) { setStatus("error"); return }
    // Le paiement en ligne peut etre mis en pause depuis Admin > Contenu du
    // site (ex: prestataire de paiement en panne) : dans ce cas, on repasse
    // temporairement en paiement a la reception - la commande suit alors
    // l ancien circuit (Admin > Confirmation des commandes).
    navigate(online_payment_enabled === false ? `/suivi/${data.id}` : `/paiement/${data.id}`)
  }

  return (
    <section className="page-wrap-lg">
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Livraison</span></div>
      <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>{t("delivery_page.title")}</h1>
      <p className="text-inkdim mb-2">
        {t("delivery_page.subtitle", { min: MIN_ORDER, threshold: FREE_DELIVERY_THRESHOLD })}
      </p>
      {!user && (
        <p className="text-inkdim text-sm mb-8">
          <Link to="/compte" className="link-underline" style={{ color: "#D4A84B" }}>{t("delivery_page.login_hint")}</Link>
        </p>
      )}

      {delivery_enabled === false && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#D4A84B", background: "rgba(212,168,75,0.08)", border: "1px solid rgba(212,168,75,0.3)", padding: "1rem 1.25rem", marginBottom: "2rem" }}>
          La livraison est temporairement en pause. Vous pouvez consulter le menu, mais la
          commande n est pas disponible pour le moment - reessayez plus tard ou appelez-nous.
        </p>
      )}

      {status === "error" ? (
        <p className="text-red-400 text-sm mb-8">{t("booking_page.error")}</p>
      ) : null}

      <div className="grid md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2">
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              placeholder={t("delivery_page.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ minWidth: 180 }}
            />
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
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

          <div className="grid gap-3">
            {loading && <p className="text-inkdim text-sm">{t("menu_page.loading")}</p>}
            {filtered.map((item) => (
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
                  {item.description && <p className="text-inkdim text-xs mt-1 line-clamp-2">{item.description}</p>}
                  <p className="font-mono text-gold text-sm mt-1">{item.price} MAD</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => removeFromCart(item.id)} disabled={!cart[item.id]}
                    className="w-8 h-8 border border-line-light disabled:opacity-30">-</button>
                  <span className="w-5 text-center">{cart[item.id] || 0}</span>
                  <button onClick={() => addToCart(item.id)} disabled={delivery_enabled === false}
                    className="w-8 h-8 border border-line-light disabled:opacity-30">+</button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="text-inkdim text-sm">{t("menu_page.note")}</p>
            )}
          </div>
        </div>

        <div className="info-card notch-corner p-5 h-fit sticky top-24">
          {cartLines.length === 0 ? (
            <p className="text-inkdim text-sm mb-4">{t("delivery_page.empty_cart")}</p>
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
            <input placeholder={t("delivery_page.promo_placeholder")} value={promoInput} onChange={(e) => setPromoInput(e.target.value)}
              className="form-input" style={{ flex: 1 }} />
            <button onClick={applyPromo} className="cat-pill" style={{ padding: "0.5rem 0.9rem" }}>{t("delivery_page.apply")}</button>
          </div>
          {promoError && <p className="text-xs text-red-400 mb-2">{promoError}</p>}
          {promo && <p className="text-xs text-basil mb-2">Code {promo.code}</p>}

          <div style={{ borderTop: "1px solid #2a2a2a" }} className="pt-3 mb-4 grid gap-1.5 text-sm">
            <div className="flex justify-between text-inkdim">
              <span>{t("delivery_page.subtotal")}</span><span>{subtotal} MAD</span>
            </div>
            <div className="flex justify-between text-inkdim">
              <span>{t("delivery_page.delivery_fee")}</span><span>{deliveryFee === 0 ? t("delivery_page.free") : `${deliveryFee} MAD`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-basil">
                <span>{t("delivery_page.discount")}</span><span>-{discount} MAD</span>
              </div>
            )}
            <div style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="flex justify-between text-xl pt-1">
              <span>{t("delivery_page.total")}</span><span>{total} MAD</span>
            </div>
          </div>

          {belowMin && (
            <p className="text-xs text-gold mb-3">
              {t("delivery_page.min_order_hint", { amount: MIN_ORDER - subtotal })}
            </p>
          )}
          {user && total > 0 && (
            <p className="text-xs text-inkdim mb-3">{t("delivery_page.points_note", { points: pointsEarned })}</p>
          )}

          <input placeholder={t("delivery_page.address_placeholder")} value={address} onChange={(e) => setAddress(e.target.value)}
            className="form-input w-full mb-3" />
          <input placeholder={t("delivery_page.phone_placeholder")} value={phone} onChange={(e) => setPhone(e.target.value)}
            className="form-input w-full mb-3" />
          <textarea placeholder={t("delivery_page.notes_placeholder")} value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={2} className="form-input w-full mb-4" style={{ resize: "vertical" }} />

          <button
            onClick={submitOrder}
            disabled={!canOrder || status === "loading"}
            style={{ background: "#D2491F", color: "#000", padding: "1rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", letterSpacing: "0.08em", border: "none", cursor: "pointer", width: "100%" }}
            className="disabled:opacity-50"
          >
            {status === "loading" ? t("delivery_page.submitting") : `${t("delivery_page.submit")} - ${total} MAD`}
          </button>
        </div>
      </div>
    </section>
  )
}
