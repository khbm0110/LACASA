import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printOrderReceipt, printKitchenTicket } from "../../lib/printReceipt"
import { playPosChime, playAddBeep, playRemoveBeep, playErrorBuzz, isPosSoundMuted, setPosSoundMuted } from "../pos-sound"
import { IconVolume, IconVolumeMute, IconClipboardList } from "../icons.jsx"
import { useToast } from "../ui/Toast.jsx"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useBranch } from "../BranchContext.jsx"
import { useShift } from "../useShift"

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
  const [tables, setTables] = useState([])
  const [selectedTableId, setSelectedTableId] = useState("")
  const [groupsByMenuItem, setGroupsByMenuItem] = useState({}) // { menuItemId: [group] }
  const [cart, setCart] = useState([]) // [{ key, type, id, name, unitPrice, qty, modifiers }]
  const [orderType, setOrderType] = useState("dine_in")
  const [payMode, setPayMode] = useState(null) // "cash" | "card" | "split"
  const [cashReceived, setCashReceived] = useState("")
  const [splitCash, setSplitCash] = useState("")
  const [splitCard, setSplitCard] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const [pickerItem, setPickerItem] = useState(null) // menu item en cours de configuration (modificateurs)
  const [pickerSelection, setPickerSelection] = useState({}) // { groupId: [modifierId, ...] }
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountType, setDiscountType] = useState("amount") // "amount" | "percent"
  const [discountValue, setDiscountValue] = useState("")
  const [discountReason, setDiscountReason] = useState("")
  const toast = useToast()
  const confirm = useConfirm()
  const { activeBranchId } = useBranch()
  const { shift, busy: shiftBusy, openShift, closeShift, fetchLiveSummary } = useShift(activeBranchId)
  const [openingCashInput, setOpeningCashInput] = useState("")
  const [closingOpen, setClosingOpen] = useState(false)
  const [closingSummary, setClosingSummary] = useState(null)
  const [closingCashInput, setClosingCashInput] = useState("")
  const [closingNotes, setClosingNotes] = useState("")
  const [closeResult, setCloseResult] = useState(null)
  const [muted, setMuted] = useState(isPosSoundMuted())

  const toggleMuted = () => {
    setMuted((m) => { setPosSoundMuted(!m); return !m })
  }

  const submitOpenShift = async (e) => {
    e.preventDefault()
    const { error } = await openShift(openingCashInput)
    if (error) { toast.error("Echec de l ouverture de la caisse."); return }
    setOpeningCashInput("")
    toast.success("Caisse ouverte.")
  }

  const openClosingModal = async () => {
    const summary = await fetchLiveSummary()
    setClosingSummary(summary)
    setClosingCashInput("")
    setClosingNotes("")
    setCloseResult(null)
    setClosingOpen(true)
  }

  const submitCloseShift = async (e) => {
    e.preventDefault()
    if (cart.length > 0) {
      toast.error("Terminez ou videz le ticket en cours avant de fermer la caisse.")
      return
    }
    const expected = closingSummary.expectedCash
    const counted = Number(closingCashInput) || 0
    const { error } = await closeShift(closingCashInput, closingNotes)
    if (error) { toast.error("Echec de la fermeture de la caisse."); return }
    setCloseResult({ expected, counted, diff: counted - expected })
    toast.success("Caisse fermee.")
  }

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

  useEffect(() => {
    async function loadTables() {
      if (!activeBranchId) { setTables([]); return }
      const { data } = await supabase.from("restaurant_tables").select("id, number, zone").eq("branch_id", activeBranchId).order("number")
      setTables(data || [])
    }
    loadTables()
  }, [activeBranchId])

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items])
  const shownItems = items.filter((i) => i.category === activeCategory)

  const subtotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0)
  const discountAmount = discountValue === "" ? 0 : discountType === "percent"
    ? Math.round(subtotal * (Number(discountValue) / 100) * 100) / 100
    : Math.min(subtotal, Number(discountValue) || 0)
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100)
  const change = payMode === "cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0
  const splitAssigned = Number(splitCash || 0) + Number(splitCard || 0)
  const splitRemaining = Math.round((total - splitAssigned) * 100) / 100

  const lineKey = (id, modifierIds) => `${id}::${[...modifierIds].sort().join(",")}`

  const addSimpleItem = (item) => {
    const key = lineKey(item.id, [])
    playAddBeep()
    setCart((c) => {
      const existing = c.find((l) => l.key === key)
      if (existing) return c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      return [...c, { key, type: "menu_item", id: item.id, name: item.name, unitPrice: item.price, qty: 1, modifiers: [] }]
    })
  }

  const addCombo = (combo) => {
    const key = lineKey(combo.id, ["combo"])
    playAddBeep()
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
        playErrorBuzz()
        toast.error(`Choisissez une option pour "${g.name}".`)
        return
      }
    }
    const chosenModifiers = groups.flatMap((g) => (pickerSelection[g.id] || []).map((mid) => g.modifiers.find((m) => m.id === mid)).filter(Boolean))
    const extra = chosenModifiers.reduce((s, m) => s + Number(m.price_delta), 0)
    const key = lineKey(pickerItem.id, chosenModifiers.map((m) => m.id))
    playAddBeep()
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

  const incLine = (key) => { playAddBeep(); setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))) }
  const decLine = (key) => {
    playRemoveBeep()
    setCart((c) => c.flatMap((l) => {
      if (l.key !== key) return [l]
      if (l.qty > 1) return [{ ...l, qty: l.qty - 1 }]
      return []
    }))
  }

  const resetSale = () => {
    setCart([])
    setPayMode(null)
    setCashReceived("")
    setSplitCash("")
    setSplitCard("")
    setDiscountOpen(false)
    setDiscountType("amount")
    setDiscountValue("")
    setDiscountReason("")
    setSelectedTableId("")
  }

  const clearCart = async () => {
    if (cart.length === 0) return
    const ok = await confirm({ title: "Vider le ticket en cours ?" })
    if (!ok) return
    playRemoveBeep()
    resetSale()
  }

  const finalize = async () => {
    if (cart.length === 0 || !payMode) return
    if (!shift) {
      playErrorBuzz()
      toast.error("Ouvrez la caisse avant d encaisser une vente.")
      return
    }
    if (payMode === "cash" && Number(cashReceived || 0) < total) {
      playErrorBuzz()
      toast.error("Le montant recu est inferieur au total.")
      return
    }
    if (payMode === "split" && splitRemaining !== 0) {
      playErrorBuzz()
      toast.error(splitRemaining > 0 ? `Il manque ${splitRemaining} MAD.` : `Le total depasse de ${-splitRemaining} MAD.`)
      return
    }
    setBusy(true)
    const orderItems = cart.map((l) => ({
      item_id: l.id, item_type: l.type, name: l.name, qty: l.qty, price: l.unitPrice,
      modifiers: l.modifiers.length > 0 ? l.modifiers.map((m) => m.name) : undefined,
    }))
    const payments = payMode === "split"
      ? [
          ...(Number(splitCash) > 0 ? [{ method: "cash", amount: Number(splitCash) }] : []),
          ...(Number(splitCard) > 0 ? [{ method: "card_tpe", amount: Number(splitCard) }] : []),
        ]
      : [{ method: payMode === "cash" ? "cash" : "card_tpe", amount: total }]

    const { data, error } = await supabase.from("orders").insert([{
      phone: "",
      address: orderType === "dine_in" ? "Comptoir" : "A emporter",
      items: orderItems,
      subtotal,
      discount_amount: discountAmount,
      discount_reason: discountAmount > 0 ? (discountReason || null) : null,
      total,
      status: "new", // deja encaisse devant le client : part direct en cuisine (deduit aussi le stock des recettes)
      order_type: orderType,
      payment_status: "paid",
      payment_provider: payMode === "split" ? "split" : (payMode === "cash" ? "cash" : "card_tpe"),
      paid_at: new Date().toISOString(),
      branch_id: activeBranchId,
      shift_id: shift.id,
      table_id: orderType === "dine_in" ? (selectedTableId || null) : null,
    }]).select().single()

    if (error || !data) {
      setBusy(false)
      playErrorBuzz()
      toast.error("Echec de l enregistrement de la vente.")
      return
    }

    const { error: paymentsError } = await supabase.from("order_payments").insert(
      payments.map((p) => ({ order_id: data.id, method: p.method, amount: p.amount }))
    )
    setBusy(false)
    if (paymentsError) {
      playErrorBuzz()
      toast.error("Vente enregistree mais echec du detail de paiement - verifiez la caisse.")
      return
    }

    const tableNumber = orderType === "dine_in" && selectedTableId ? tables.find((t) => t.id === selectedTableId)?.number : null
    printKitchenTicket({ ...data, table_number: tableNumber })
    printOrderReceipt({ ...data, payments })
    playPosChime()
    toast.success(`Vente encaissee - ${total} MAD`)
    resetSale()
  }

  return (
    <>
    {shift === undefined && (
      <div className="flex items-center justify-center h-[60vh] text-inkdim text-sm">Chargement de la caisse...</div>
    )}

    {shift === null && (
      <div className="flex items-center justify-center h-[60vh]">
        <form onSubmit={submitOpenShift} className="bg-bgsoft border border-line rounded-2xl p-8 w-full max-w-sm grid gap-4 text-center">
          <IconClipboardList size={32} className="mx-auto text-gold" />
          <h1 className="font-serif text-2xl">Ouvrir la caisse</h1>
          <p className="text-inkdim text-sm -mt-2">Saisissez le fond de caisse de depart pour commencer la session de vente.</p>
          <input required type="number" step="0.01" placeholder="Fond de caisse (MAD)" autoFocus value={openingCashInput}
            onChange={(e) => setOpeningCashInput(e.target.value)}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm text-center outline-none focus:border-tomato" />
          <button disabled={shiftBusy} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
            {shiftBusy ? "Ouverture..." : "Ouvrir la caisse"}
          </button>
        </form>
      </div>
    )}

    {shift && (
    <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 lg:h-[calc(100dvh-9rem)]">
      <div className="flex flex-col min-h-0 lg:h-full">
        <div className="flex items-center justify-between mb-2 shrink-0 gap-2 flex-wrap">
          <h1 className="font-serif text-3xl">Point de vente</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMuted}
              title={muted ? "Activer le son" : "Couper le son"}
              className="text-inkdim hover:text-ink p-2 rounded-full border border-line"
            >
              {muted ? <IconVolumeMute size={18} /> : <IconVolume size={18} />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4 shrink-0 text-xs text-inkdim bg-bgsoft border border-line rounded-xl px-3 py-2">
          <span>Caisse ouverte a {new Date(shift.opened_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · fond {shift.opening_cash} MAD</span>
          <button onClick={openClosingModal} className="text-tomatoglow hover:underline font-medium">Fermer la caisse</button>
        </div>

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

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 flex-1 min-h-0 overflow-y-auto pr-1 auto-rows-min">
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
      <div className="bg-bgsoft border border-line rounded-2xl p-5 flex flex-col min-h-0 lg:h-full">
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

        {orderType === "dine_in" && tables.length > 0 && (
          <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}
            className="w-full bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato mb-4 shrink-0">
            <option value="">Table (optionnel)</option>
            {tables.map((t) => <option key={t.id} value={t.id}>Table {t.number}{t.zone ? ` — ${t.zone}` : ""}</option>)}
          </select>
        )}

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
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setDiscountOpen((o) => !o)} className="text-xs text-gold hover:text-gold/80 underline decoration-dotted">
              {discountAmount > 0 ? "Modifier la remise" : "+ Remise"}
            </button>
            {discountAmount > 0 && (
              <button onClick={() => { setDiscountValue(""); setDiscountReason(""); setDiscountOpen(false) }} className="text-xs text-inkdim hover:text-ink">
                Retirer
              </button>
            )}
          </div>

          {discountOpen && (
            <div className="grid gap-2 mb-3 bg-bg border border-line rounded-xl p-3">
              <div className="flex gap-2">
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                  className="bg-bgsoft border border-line rounded-lg px-2 py-2 text-sm outline-none focus:border-tomato">
                  <option value="amount">MAD</option>
                  <option value="percent">%</option>
                </select>
                <input type="number" step="0.01" placeholder={discountType === "percent" ? "Ex: 10" : "Ex: 20"} value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="flex-1 bg-bgsoft border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-tomato" />
              </div>
              <input placeholder="Motif (ex: fidelite, geste commercial...)" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}
                className="bg-bgsoft border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-tomato" />
            </div>
          )}

          {discountAmount > 0 && (
            <div className="text-sm text-inkdim mb-1 flex justify-between">
              <span>Sous-total</span><span>{subtotal} MAD</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="text-sm text-tomatoglow mb-1 flex justify-between">
              <span>Remise</span><span>-{discountAmount} MAD</span>
            </div>
          )}
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
            <button
              onClick={() => setPayMode("split")}
              title="Paiement partage (especes + carte)"
              className={`px-3 py-3 rounded-xl text-sm font-semibold border ${payMode === "split" ? "bg-basil border-basil text-[#0e1a08]" : "border-line text-inkdim"}`}
            >
              Partage
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

          {payMode === "split" && (
            <div className="mb-3 grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Especes (MAD)"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato"
                />
                <input
                  type="number"
                  placeholder="Carte (MAD)"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato"
                />
              </div>
              <p className={`text-sm ${splitRemaining === 0 ? "text-basil" : "text-tomato"}`}>
                {splitRemaining === 0
                  ? "Montants complets."
                  : splitRemaining > 0
                    ? `Il manque ${splitRemaining} MAD.`
                    : `Depasse le total de ${-splitRemaining} MAD.`}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={clearCart} className="px-4 py-3 rounded-xl text-sm border border-line text-inkdim">
              Vider
            </button>
            <button
              onClick={finalize}
              disabled={busy || cart.length === 0 || !payMode || (payMode === "split" && splitRemaining !== 0)}
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
    )}

    {/* Fermeture de caisse */}
    {closingOpen && closingSummary && (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => !closeResult && setClosingOpen(false)}>
        <div onClick={(e) => e.stopPropagation()} className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm grid gap-4 max-h-[85vh] overflow-y-auto">
          <h2 className="font-serif text-xl">Fermeture de caisse</h2>

          {!closeResult ? (
            <>
              <div className="grid gap-1.5 text-sm bg-bg border border-line rounded-xl p-4">
                <div className="flex justify-between"><span className="text-inkdim">Fond de depart</span><span>{shift.opening_cash} MAD</span></div>
                <div className="flex justify-between"><span className="text-inkdim">Ventes especes</span><span>+{closingSummary.cashSales} MAD</span></div>
                {closingSummary.cashRefunds > 0 && (
                  <div className="flex justify-between text-tomato"><span>Remboursements especes</span><span>-{closingSummary.cashRefunds} MAD</span></div>
                )}
                <div className="flex justify-between"><span className="text-inkdim">Ventes carte (TPE)</span><span>{closingSummary.cardSales} MAD</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t border-line mt-1">
                  <span>Especes attendues en caisse</span><span className="text-gold">{closingSummary.expectedCash} MAD</span>
                </div>
              </div>
              <form onSubmit={submitCloseShift} className="grid gap-3">
                <input required type="number" step="0.01" placeholder="Montant compte reellement (MAD)" autoFocus
                  value={closingCashInput} onChange={(e) => setClosingCashInput(e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
                <input placeholder="Notes (optionnel)" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)}
                  className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
                <div className="flex gap-3">
                  <button disabled={shiftBusy} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-50">
                    {shiftBusy ? "Fermeture..." : "Confirmer la fermeture"}
                  </button>
                  <button type="button" onClick={() => setClosingOpen(false)} className="px-4 py-2.5 rounded-xl text-sm border border-line">Annuler</button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="grid gap-1.5 text-sm bg-bg border border-line rounded-xl p-4">
                <div className="flex justify-between"><span className="text-inkdim">Attendu</span><span>{closeResult.expected} MAD</span></div>
                <div className="flex justify-between"><span className="text-inkdim">Compte</span><span>{closeResult.counted} MAD</span></div>
                <div className={`flex justify-between font-semibold pt-2 border-t border-line mt-1 ${closeResult.diff === 0 ? "text-basil" : "text-tomato"}`}>
                  <span>Ecart</span><span>{closeResult.diff > 0 ? "+" : ""}{closeResult.diff} MAD</span>
                </div>
              </div>
              <p className="text-inkdim text-xs">
                {closeResult.diff === 0 ? "Caisse equilibree." : "Ecart constate - verifiez le comptage ou notez la raison dans le suivi des caisses."}
              </p>
              <button onClick={() => setClosingOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
                Fermer
              </button>
            </>
          )}
        </div>
      </div>
    )}
    </>
  )
}
