import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Comptabilite simple : chiffre d affaires (livraison + sur place),
// regroupe par jour, avec liste des transactions et un recap exportable.
// Pour une vraie comptabilite (TVA, charges, bilan), il faudra brancher
// un outil dedie (ex: Restaurant365, ou export vers votre comptable).
export default function Accounting() {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])
  const [range, setRange] = useState("7") // jours

  useEffect(() => {
    async function load() {
      const since = new Date()
      since.setDate(since.getDate() - Number(range))
      const [{ data: o }, { data: r }] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
        supabase.from("reservations").select("*").gte("created_at", since.toISOString())
      ])
      setOrders(o || [])
      setReservations(r || [])
    }
    load()
  }, [range])

  const paidOrders = orders.filter((o) => o.status !== "cancelled")
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const deliveryRevenue = paidOrders.filter((o) => o.order_type !== "dine_in").reduce((s, o) => s + Number(o.total || 0), 0)
  const dineInRevenue = paidOrders.filter((o) => o.order_type === "dine_in").reduce((s, o) => s + Number(o.total || 0), 0)
  const avgTicket = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0

  const byDay = {}
  paidOrders.forEach((o) => {
    const day = (o.created_at || "").slice(0, 10)
    byDay[day] = (byDay[day] || 0) + Number(o.total || 0)
  })
  const days = Object.keys(byDay).sort().reverse()

  const exportCsv = () => {
    const rows = [["Date", "Type", "Table/Adresse", "Total (MAD)", "Statut"]]
    paidOrders.forEach((o) => {
      rows.push([
        (o.created_at || "").slice(0, 10),
        o.order_type === "dine_in" ? "Sur place" : "Livraison",
        o.address || "",
        o.total,
        o.status
      ])
    })
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ventes_${range}jours.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-serif text-3xl">Comptabilite & Ventes</h1>
        <div className="flex items-center gap-2">
          <select value={range} onChange={(e) => setRange(e.target.value)}
            className="bg-bgsoft border border-line rounded-xl px-3 py-2 text-sm">
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
          <button onClick={exportCsv} className="px-4 py-2 rounded-xl text-sm border border-line">
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        <Card label="Chiffre d affaires" value={`${totalRevenue} MAD`} />
        <Card label="Livraison" value={`${deliveryRevenue} MAD`} />
        <Card label="Sur place (tables)" value={`${dineInRevenue} MAD`} />
        <Card label="Panier moyen" value={`${avgTicket} MAD`} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-serif text-xl mb-4">Ventes par jour</h2>
          <div className="grid gap-2">
            {days.map((day) => (
              <div key={day} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-inkdim">{day}</span>
                <span className="font-mono text-gold">{byDay[day]} MAD</span>
              </div>
            ))}
            {days.length === 0 && <p className="text-inkdim text-sm">Aucune vente sur cette periode.</p>}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-xl mb-4">Reservations recues</h2>
          <div className="grid gap-2">
            {reservations.slice(0, 8).map((r) => (
              <div key={r.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm flex justify-between">
                <span>{r.name} - {r.guests} pers.</span>
                <span className="text-inkdim">{r.date}</span>
              </div>
            ))}
            {reservations.length === 0 && <p className="text-inkdim text-sm">Aucune reservation sur cette periode.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="bg-bgsoft border border-line rounded-2xl p-6">
      <p className="text-inkdim text-sm mb-2">{label}</p>
      <p className="font-serif text-2xl">{value}</p>
    </div>
  )
}
