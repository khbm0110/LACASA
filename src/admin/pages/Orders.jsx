import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function Orders() {
  const [rows, setRows] = useState([])

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
    setRows(data || [])
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id)
    load()
  }

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Commandes livraison</h1>
      <div className="grid gap-3">
        {rows.map((o) => (
          <div key={o.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <p className="font-medium">{o.phone} - {o.address}</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                o.status === "delivered" ? "bg-basil/20 text-basil" : o.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-gold/20 text-gold"
              }`}>{o.status}</span>
            </div>
            <ul className="text-inkdim text-xs mb-2">
              {(o.items || []).map((it, idx) => (
                <li key={idx}>{it.qty} x {it.name} - {it.price * it.qty} MAD</li>
              ))}
            </ul>
            <div className="flex items-center justify-between">
              <p className="font-mono text-gold">{o.total} MAD</p>
              <div className="flex gap-2">
                <button onClick={() => setStatus(o.id, "out_for_delivery")} className="text-xs text-inkdim">En livraison</button>
                <button onClick={() => setStatus(o.id, "delivered")} className="text-xs text-basil">Livree</button>
                <button onClick={() => setStatus(o.id, "cancelled")} className="text-xs text-red-400">Annuler</button>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-inkdim text-sm">Aucune commande pour le moment.</p>}
      </div>
    </div>
  )
}
