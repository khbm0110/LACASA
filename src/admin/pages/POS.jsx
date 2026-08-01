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
// Chaque ligne du ticket a une cle unique (item + modificateurs choisis)
// pour eviter de fusionner deux plats identiques configures differemment
// (ex: une pizza "sans oignon" et une autre "double fromage").
//
// !! Tiroir-caisse !!
// Le navigateur ne peut pas ouvrir un tiroir-caisse USB directement. Deux
// solutions reelles : (1) une imprimante de tickets dont le pilote a
// l option "ouvrir le tiroir a chaque impression" activee (le plus
// simple : ca marche automatiquement des que ce POS imprime le ticket,
// sans rien coder ici) ; (2) une integration WebUSB/WebSerial specifique
// au modele exact de votre imprimante - a batir une fois que vous savez
// quel materiel vous avez.
const FORMULES_TAB = "__formules__"

export default function POS() {
  const [items, setItems] = useState([])
  const [combos, setCombos] = useState([])
  const [groupsByMenuItem, setGroupsByMenuItem] = useState({}) // { menuItemId: [group] }
  const [cart, setCart] = useState([]) // [{ key, type, id, name, unitPrice, qty, modifiers }]
  const [orderType, setOrderType] = useState("dine_in")
  const [payMode, setPayMode] = useState(null)
  const [cashReceived, setCashReceived] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [pickerItem, setPickerItem] = useState(null) // menu item en cours de configuration (modificateurs)
  const [pickerSelection, setPickerSelection] = useState({}) // { groupId: [modifierId, ...] }
  const toast = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    async function load() {
      const [{ data: mi }, { data: combosData }, { data: assignments }, { data: groups }, { data: mods }] = await Promise.all([
        supabase.from("menu_items").select("id, category, name, price, image_url").order("category"),
        supabase.from("combos").select("*, combo_items(*, menu_items(name))").eq("active", true),
        supabase.from("menu_item_modifier_groups").select("menu_item_id, modifier_group_id"),
        supabase.from("modifier_groups").select("*"),
        supabase.from("modifiers").select("*").order("sort_order"),
      ])
      setItems(mi || [])
      setCombos(combosData || [])

      const groupsMap = {}
      ;(groups || []).forEach((g) => { groupsMap[g.id] = { ...g, modifiers: (mods || []).filter((m) => m.group_id === g.id) } })
      const byMenuItem = {}
      ;(assignments || []).forEach((a) => {
        if (!byMenuItem[a.menu_item_id]) byMenuItem[a.menu_item_id] = []
        if (groupsMap[a.modifier_group_id]) byMenuItem[a.menu_item_id].push(groupsMap[a.modifier_group_id])
      })
      setGroupsByMenuItem(byMenuItem)

      if (mi && mi.length > 0) setActiveCategory(mi[0].category)
    }
    load()
  }, [])

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items])
  const shownItems = items.filter((i) => i.category === activeCategory)

  const total = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
  const change = payMode === "cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0

  const lineKey = (id, modifierIds) => `${id}::${[...modifierIds].sort().join(",")}`

  const addSimpleItem = (item) => {
    const key = lineKey(item.id, [])
    setCart((c) => {
      const existing = c.find((l) => l.key === key)
      if (existing) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      return [...c, { key, type: "menu_item", id: item.id, name: item.name, unitPrice: item.price, qty: 1, modifiers: [] }]
    })
  }

  const addCombo = (combo) => {
    const key = lineKey(combo.id, ["combo"])
    setCart((c) => {
      const existing = c.find((l) => l.key === key)
      if (existing) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      return [...c, { key, type: "combo", id: combo.id, name: combo.name, unitPrice: combo.price, qty: 1, modifiers: [] }]
    })
  }

  const clickItem = (item) => {
    const groups = groupsByMenuItem[item.id]
    if (!groups || groups.length === 0) { addSimpleItem(item); return }
    setPickerItem(item)
    setPickerSelection({})
  }

  const toggleModifier = (group, modifierId) => {
    setPickerSelection((sel) => {
      const current = sel[group.id] || []
      const isSelected = current.includes(modifierId)
      let next
      if (group.max_select === 1) {
        next = isSelected ? [] : [modifierId]
      } else if (isSelected) {
        next = current.filter((id) => id !== modifierId)
      } else if (current.length < group.max_select) {
        next = [...current, modifierId]
      } else {
        next = current
      }
      return { ...sel, [group.id]: next }
    })
  }

  const confirmPicker = () => {
    const groups = groupsByMenuItem[pickerItem.id] || []
    for (const g of groups) {
      const count = (pickerSelection[g.id] || []).length
      if (g.required && count < Math.max(1, g.min_select)) {
        toast.error(`Choisissez une option pour "${g.name}".`)
        return
      }
    }
    const chosenModifiers = groups.flatMap((g) => (pickerSelection[g.id] || []).map((mid) => g.modifiers.find((m) => m.id === mid)).filter(Boolean))
    const extra = chosenModifiers.reduce((s, m) => s + Number(m.price_delta), 0)
    const key = lineKey(pickerItem.id, chosenModifiers.map((m) => m.id))
    setCart((c) => {
      const existing = c.find((l) => l.key === key)
      if (existing) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      return [...c, {
        key, type: "menu_item", id: pickerItem.id, name: pickerItem.name,
        unitPrice: pickerItem.price + extra, qty: 1,
        modifiers: chosenModifiers.map((m) => ({ id: m.id, name: m.name, price_delta: m.price_delta })),
      }]
    })
    setPickerItem(null)
  }

  const incLine = (key) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)))
  const decLine = (key) => setCart((c) => c.flatMap((l) => {
    if (l.key !== key) return [l]
    if (l.qty > 1) return [{ ...l, qty: l.qty - 1 }]
    return []
  }))

  const resetSale = () => {
    setCart([])
    setPayMode(null)
    setCashReceived("")
  }

  const clearCart = async () => {
    if (cart.length === 0) return
    const ok = await confirm({ title: "Vider le ticket en cours ?" })
    if (!ok) return
    resetSale()
  }

  const finalize = async () => {
    if (cart.length === 0 || !payMode) return
    if (payMode === "cash" && Number(cashReceived || 0) < total) {
      toast.error("Le montant recu est inferieur au total.")
      return
    }
    setBusy(true)
    const orderItems = cart.map((l) => ({
      item_id: l.id, item_type: l.type, name: l.name, qty: l.qty, price: l.unitPrice,
      modifiers: l.modifiers.length > 0 ? l.modifiers.map((m) => m.name) : undefined,
    }))
    const { data, error } = await supabase.from("orders").insert([{
      phone: "",
      address: orderType === "dine_in" ? "Comptoir" : "A emporter",
      items: orderItems,
      total,
      status: "new", // deja encaisse devant le client : part direct en cuisine (deduit aussi le stock des recettes)
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
          {combos.length > 0 && (
            <button
              onClick={() => setActiveCategory(FORMULES_TAB)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide border transition ${
                activeCategory === FORMULES_TAB ? "bg-gold border-gold text-[#1a0d05]" : "border-line text-inkdim hover:text-ink hover:border-gold"
              }`}
            >
              Formules
            </button>
          )}
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
          {activeCategory === FORMULES_TAB
            ? combos.map((c) => (
              <button
                key={c.id}
                onClick={() => addCombo(c)}
                className="bg-bgsoft border border-gold/40 rounded-2xl p-4 text-left hover:border-gold hover:-translate-y-0.5 transition active:scale-95"
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                ) : (
                  <div className="w-full h-20 rounded-lg mb-2 flex items-center justify-center bg-white/5">
                    <span className="font-serif text-2xl text-gold/40">{c.name?.[0]}</span>
                  </div>
                )}
                <p className="text-sm font-medium leading-tight mb-1">{c.name}</p>
                <p className="font-mono text-gold text-sm">{c.price} MAD</p>
              </button>
            ))
            : shownItems.map((item) => (
              <button
                key={item.id}
                onClick={() => clickItem(item)}
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
                {groupsByMenuItem[item.id]?.length > 0 && <p className="text-[10px] text-inkdim mt-1">Options disponibles</p>}
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
          {cart.length === 0 && <p className="text-inkdim text-sm text-center py-10">Ticket vide - touchez un plat pour l ajouter.</p>}
          {cart.map((l) => (
            <div key={l.key} className="flex items-center justify-between gap-2 bg-bg border border-line rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{l.name}{l.type === "combo" && <span className="text-gold text-xs ml-1">(formule)</span>}</p>
                {l.modifiers.length > 0 && <p className="text-xs text-inkdim truncate">{l.modifiers.map((m) => m.name).join(", ")}</p>}
                <p className="text-xs text-inkdim">{l.unitPrice} MAD</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => decLine(l.key)} className="w-7 h-7 rounded-full border border-line">-</button>
                <span className="w-5 text-center text-sm">{l.qty}</span>
                <button onClick={() => incLine(l.key)} className="w-7 h-7 rounded-full border border-line">+</button>
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
              disabled={busy || cart.length === 0 || !payMode}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50"
            >
              {busy ? "Encaissement..." : "Encaisser"}
            </button>
          </div>
        </div>
      </div>

      {/* Selection des modificateurs */}
      {pickerItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setPickerItem(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto grid gap-4">
            <h2 className="font-serif text-xl">{pickerItem.name}</h2>
            {(groupsByMenuItem[pickerItem.id] || []).map((g) => (
              <div key={g.id}>
                <p className="text-sm font-medium mb-2">
                  {g.name} {g.required && <span className="text-tomato text-xs">(obligatoire)</span>}
                </p>
                <div className="grid gap-1.5">
                  {g.modifiers.map((m) => {
                    const selected = (pickerSelection[g.id] || []).includes(m.id)
                    return (
                      <button key={m.id} type="button" onClick={() => toggleModifier(g, m.id)}
                        className={`flex items-center justify-between text-sm rounded-lg px-3 py-2 border transition ${
                          selected ? "bg-tomato/20 border-tomato" : "bg-bg border-line"
                        }`}>
                        <span>{m.name}</span>
                        <span className="font-mono text-xs text-gold">{m.price_delta > 0 ? `+${m.price_delta}` : m.price_delta} MAD</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={confirmPicker} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                Ajouter au ticket
              </button>
              <button onClick={() => setPickerItem(null)} className="px-4 py-2.5 rounded-xl text-sm border border-line">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
