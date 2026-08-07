import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useBranch } from "../BranchContext.jsx"

const PERIODS = [{ label: "7 jours", days: 7 }, { label: "30 jours", days: 30 }, { label: "90 jours", days: 90 }]

export default function Reports() {
  const { activeBranchId, activeBranch } = useBranch()
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  const [lowStock, setLowStock] = useState([])
  const [waste, setWaste] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [supplierDebts, setSupplierDebts] = useState([])

  useEffect(() => {
    async function load() {
      if (!activeBranchId) return
      setLoading(true)
      const cutoff = new Date(Date.now() - days * 86400000).toISOString()

      const [{ data: inv }, { data: wasteRows }, { data: orders }, { data: debts }] = await Promise.all([
        supabase.from("inventory_items").select("*, suppliers(name)").eq("branch_id", activeBranchId),
        supabase.from("stock_adjustments").select("quantity, inventory_items(name, unit, cost_per_unit)")
          .eq("branch_id", activeBranchId).eq("type", "waste").gte("created_at", cutoff),
        supabase.from("orders").select("items").eq("branch_id", activeBranchId).neq("status", "cancelled").gte("created_at", cutoff),
        supabase.from("purchases").select("total, suppliers(id, name)").eq("branch_id", activeBranchId).eq("status", "received").eq("payment_status", "unpaid"),
      ])

      setLowStock((inv || []).filter((i) => Number(i.current_stock) <= Number(i.min_stock_alert)))

      const wasteMap = {}
      ;(wasteRows || []).forEach((r) => {
        const name = r.inventory_items?.name || "?"
        if (!wasteMap[name]) wasteMap[name] = { name, unit: r.inventory_items?.unit, qty: 0, cost: 0 }
        const qty = Math.abs(Number(r.quantity))
        wasteMap[name].qty += qty
        wasteMap[name].cost += qty * Number(r.inventory_items?.cost_per_unit || 0)
      })
      setWaste(Object.values(wasteMap).sort((a, b) => b.cost - a.cost))

      // Ventes par plat/formule sur la periode
      const salesMap = {}
      ;(orders || []).forEach((o) => {
        ;(o.items || []).forEach((it) => {
          const key = `${it.item_type || "menu_item"}::${it.item_id}`
          if (!salesMap[key]) salesMap[key] = { itemId: it.item_id, type: it.item_type || "menu_item", name: it.name, qty: 0, revenue: 0 }
          salesMap[key].qty += it.qty
          salesMap[key].revenue += it.qty * it.price
        })
      })
      const menuItemIds = Object.values(salesMap).filter((s) => s.type === "menu_item").map((s) => s.itemId)
      let unitCostMap = {}
      if (menuItemIds.length > 0) {
        const { data: recipeRows } = await supabase.from("menu_item_ingredients")
          .select("menu_item_id, quantity, inventory_items(cost_per_unit)").in("menu_item_id", menuItemIds)
        ;(recipeRows || []).forEach((r) => {
          unitCostMap[r.menu_item_id] = (unitCostMap[r.menu_item_id] || 0) + Number(r.quantity) * Number(r.inventory_items?.cost_per_unit || 0)
        })
      }
      const sellers = Object.values(salesMap).map((s) => {
        const hasCost = s.type === "menu_item" && unitCostMap[s.itemId] !== undefined
        const cost = hasCost ? unitCostMap[s.itemId] * s.qty : null
        return { ...s, cost, margin: cost !== null ? s.revenue - cost : null }
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 15)
      setBestSellers(sellers)

      const debtMap = {}
      ;(debts || []).forEach((p) => {
        const name = p.suppliers?.name || "Fournisseur non renseigne"
        debtMap[name] = (debtMap[name] || 0) + Number(p.total)
      })
      setSupplierDebts(Object.entries(debtMap).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total))

      setLoading(false)
    }
    load()
  }, [activeBranchId, days])

  const totalWasteCost = waste.reduce((s, w) => s + w.cost, 0)
  const totalDebt = supplierDebts.reduce((s, d) => s + d.total, 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-serif text-3xl">Rapports{activeBranch && <span className="text-inkdim text-lg font-sans ml-2">— {activeBranch.name}</span>}</h1>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button key={p.days} onClick={() => setDays(p.days)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${days === p.days ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <p className="text-inkdim text-sm">Ventes et gaspillage sur la periode choisie · stock bas et dettes fournisseurs en instantane.</p>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="px-4 py-2 rounded-full text-xs font-semibold bg-bgsoft border border-line hover:border-gold transition">
            Imprimer / Exporter PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-inkdim text-sm">Chargement...</p>
      ) : (
        <div className="grid gap-10">
          {/* Stock bas */}
          <section>
            <h2 className="font-serif text-xl mb-3">Stock bas actuellement</h2>
            <div className="grid gap-2">
              {lowStock.map((i) => (
                <div key={i.id} className="bg-bgsoft border border-tomato/50 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                  <span>{i.name}</span>
                  <span className="text-inkdim">{i.current_stock} {i.unit} <span className="text-tomato">/ seuil {i.min_stock_alert}</span>{i.suppliers?.name ? ` · ${i.suppliers.name}` : ""}</span>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-inkdim text-sm">Aucun article sous le seuil d alerte.</p>}
            </div>
          </section>

          {/* Gaspillage */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl">Gaspillage / pertes ({days} j)</h2>
              {totalWasteCost > 0 && <span className="text-tomato font-mono text-sm">-{totalWasteCost.toFixed(2)} MAD</span>}
            </div>
            <div className="grid gap-2">
              {waste.map((w) => (
                <div key={w.name} className="bg-bgsoft border border-line rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                  <span>{w.name}</span>
                  <span className="text-inkdim">{w.qty} {w.unit} <span className="text-tomato">· -{w.cost.toFixed(2)} MAD</span></span>
                </div>
              ))}
              {waste.length === 0 && <p className="text-inkdim text-sm">Aucune perte enregistree sur la periode.</p>}
            </div>
          </section>

          {/* Meilleures ventes */}
          <section>
            <h2 className="font-serif text-xl mb-3">Meilleures ventes & marge reelle ({days} j)</h2>
            <div className="grid gap-2">
              {bestSellers.map((s) => (
                <div key={`${s.type}-${s.itemId}`} className="bg-bgsoft border border-line rounded-xl px-4 py-2.5 flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <span className="font-medium">{s.name}</span>
                    {s.type === "combo" && <span className="text-gold text-xs ml-2">(formule)</span>}
                    <p className="text-inkdim text-xs">{s.qty} vendus · CA {s.revenue.toFixed(2)} MAD</p>
                  </div>
                  <div className="text-right shrink-0">
                    {s.margin !== null ? (
                      <span className="text-basil font-mono">+{s.margin.toFixed(2)} MAD</span>
                    ) : (
                      <span className="text-inkdim text-xs">Recette non renseignee</span>
                    )}
                  </div>
                </div>
              ))}
              {bestSellers.length === 0 && <p className="text-inkdim text-sm">Aucune vente sur la periode.</p>}
            </div>
          </section>

          {/* Fournisseurs */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl">Du aux fournisseurs</h2>
              {totalDebt > 0 && <span className="text-tomato font-mono text-sm">{totalDebt.toFixed(2)} MAD</span>}
            </div>
            <div className="grid gap-2">
              {supplierDebts.map((d) => (
                <div key={d.name} className="bg-bgsoft border border-line rounded-xl px-4 py-2.5 flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="text-tomato font-mono">{d.total.toFixed(2)} MAD</span>
                </div>
              ))}
              {supplierDebts.length === 0 && <p className="text-inkdim text-sm">Aucune facture fournisseur en attente de paiement.</p>}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
