import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt } from "../../lib/printReceipt"
import { playPosChime } from "../pos-sound"
import { useToast } from "../ui/Toast.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"

// Point de vente (POS) : pour un client au comptoir (sur place ou a
// emporter). La commande est encaissee immediatement (especes ou carte via
// un terminal TPE separe), part directement en cuisine (statut "new",
// deja payee) et la fiche est imprimee.
//
// !! Tiroir-caisse !!
// Le navigateur ne peut pas ouvrir un tiroir-caisse USB directement. Deux
// solutions reelles : (1) une imprimante de tickets dont le pilote a
// l option "ouvrir le tiroir a chaque impression" activee (le plus
// simple : ca marche automatiquement des que ce POS imprime le ticket,
// sans rien coder ici) ; (2) une integration WebUSB/WebSerial specifique
// au modele exact de votre imprimante - a batir une fois que vous savez
// quel materiel vous avez.
export default function POS() {
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({}) // { itemId: qty }
  const [orderType, setOrderType] = useState("dine_in") // dine_in (sur place) | takeaway (a emporter)
  const [payMode, setPayMode] = useState(null) // null | "cash" | "card"
  const [cashReceived, setCashReceived] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("menu_items").select("id, category, name, price, image_url").order("category")
      setItems(data || [])
      if (data && data.length > 0) setActiveCategory(data[0].category)
    }
    load()
  }, [])

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items])
  const shownItems = items.filter((i) => i.category === activeCategory)

  const cartLines = items
    .filter((i) => cart[i.id])
    .map((i) => ({ ...i, qty: cart[i.id] }))
  const total = cartLines.reduce((sum, i) => sum + i.price * i.qty, 0)
  const change = payMode === "cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0

  const addItem = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const removeItem = (id) => setCart((c) => {
    const next = { ...c }
    if (next[id] > 1) next[id] -= 1
    else delete next[id]
    return next
  })

  const resetSale = () => {
    setCart({})
    setPayMode(null)
    setCashReceived("")
  }

  const clearCart = async () => {
    if (cartLines.length === 0) return
    const ok = await confirm({ title: "Vider le ticket en cours ?" })
    if (!ok) return
    resetSale()
  }

  const finalize = async () => {
    if (cartLines.length === 0 || !payMode) return
    if (payMode === "cash" && Number(cashReceived || 0) < total) {
      toast.error("Le montant recu est inferieur au total.")
      return
    }
    setBusy(true)
    const orderItems = cartLines.map((i) => ({ item_id: i.id, name: i.name, qty: i.qty, price: i.price }))
    const { data, error } = await supabase.from("orders").insert([{
      phone: "",
      address: orderType === "dine_in" ? "Comptoir" : "A emporter",
      items: orderItems,
      total,
      status: "new", // deja encaisse devant le client : part direct en cuisine
      order_type: orderType,
      payment_status: "paid",
      payment_provider: payMode === "cash" ? "cash" : "card_tpe",
      paid_at: new Date().toISOString()
    }]).select().single()
    setBusy(false)

    if (error || !data) {
      toast.error("Echec de l enregistrement de la vente.")
      return
    }

    printOrderReceipt(data)
    playPosChime()
    toast.success(`Vente encaissee - ${total} MAD`)
    resetSale()
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 h-[calc(100vh-140px)]">
      <div className="flex flex-col min-h-0">
        <h1 className="font-serif text-3xl mb-4 shrink-0">Point de vente</h1>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide border transition ${
                activeCategory === cat ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim hover:text-ink hover:border-tomato"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
          {shownItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addItem(item.id)}
              className="bg-bgsoft border border-line rounded-2xl p-4 text-left hover:border-tomato hover:-translate-y-0.5 transition active:scale-95"
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full h-20 rounded-lg mb-2 flex items-center justify-center bg-white/5">
                  <span className="font-serif text-2xl text-gold/40">{item.name?.[0]}</span>
                </div>
              )}
              <p className="text-sm font-medium leading-tight mb-1">{item.name}</p>
              <p className="font-mono text-gold text-sm">{item.price} MAD</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ticket en cours */}
      <div className="bg-bgsoft border border-line rounded-2xl p-5 flex flex-col min-h-0">
        <div className="flex gap-2 mb-4 shrink-0">
          {[["dine_in", "Sur place"], ["takeaway", "A emporter"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setOrderType(val)}
              className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition ${
                orderType === val ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 grid gap-2 content-start">
          {cartLines.length === 0 && <p className="text-inkdim text-sm text-center py-10">Ticket vide - touchez un plat pour l ajouter.</p>}
          {cartLines.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 bg-bg border border-line rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{i.name}</p>
                <p className="text-xs text-inkdim">{i.price} MAD</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => removeItem(i.id)} className="w-7 h-7 rounded-full border border-line">-</button>
                <span className="w-5 text-center text-sm">{i.qty}</span>
                <button onClick={() => addItem(i.id)} className="w-7 h-7 rounded-full border border-line">+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 pt-4 mt-4 border-t border-line">
          <div className="flex justify-between font-serif text-2xl mb-4">
            <span>Total</span>
            <span>{total} MAD</span>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPayMode("cash")}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-semibold border ${payMode === "cash" ? "bg-basil border-basil text-[#0e1a08]" : "border-line text-inkdim"}`}
            >
              Especes
            </button>
            <button
              onClick={() => setPayMode("card")}
              className={`flex-1 px-3 py-3 rounded-xl text-sm font-semibold border ${payMode === "card" ? "bg-basil border-basil text-[#0e1a08]" : "border-line text-inkdim"}`}
            >
              Carte (TPE)
            </button>
          </div>

          {payMode === "cash" && (
            <div className="mb-3">
              <input
                type="number"
                placeholder="Montant recu"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato mb-2"
              />
              {cashReceived !== "" && (
                <p className="text-sm text-inkdim">Monnaie a rendre : <span className="text-gold font-mono">{change} MAD</span></p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={clearCart} className="px-4 py-3 rounded-xl text-sm border border-line text-inkdim">
              Vider
            </button>
            <button
              onClick={finalize}
              disabled={busy || cartLines.length === 0 || !payMode}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50"
            >
              {busy ? "Encaissement..." : "Encaisser"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
