import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"

// Suivi de commande en direct (Supabase Realtime), accessible sans compte
// via le lien recu apres validation d une commande : /suivi/{id}
const STEPS = {
  delivery: [
    { keys: ["awaiting_confirmation"], label: "En cours de confirmation" },
    { keys: ["new", "preparing"], label: "En preparation" },
    { keys: ["out_for_delivery"], label: "En livraison" },
    { keys: ["delivered"], label: "Livree" }
  ],
  dine_in: [
    { keys: ["new", "preparing"], label: "En preparation" },
    { keys: ["delivered"], label: "Servie" }
  ]
}

export default function OrderTracking() {
  const { id } = useParams()
  const [order, setOrder] = useState(undefined)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("orders").select("*").eq("id", id).single()
      setOrder(data || null)
    }
    load()

    // Ecoute les mises a jour de statut en direct (le client voit sa
    // commande avancer sans avoir a rafraichir la page)
    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, (payload) => {
        setOrder(payload.new)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (order === undefined) return <div className="max-w-md mx-auto px-6 py-24 text-inkdim">Chargement...</div>
  if (!order) return <div className="max-w-md mx-auto px-6 py-24 text-inkdim">Commande introuvable.</div>
  if (order.status === "cancelled") {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="font-serif text-2xl mb-2">Commande annulee</p>
        <p className="text-inkdim text-sm">Contactez-nous si vous avez une question : +212 5 37 26 26 58</p>
      </div>
    )
  }

  const steps = STEPS[order.order_type === "dine_in" ? "dine_in" : "delivery"]
  const currentIndex = steps.findIndex((s) => s.keys.includes(order.status))

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Suivi de commande</p>
      <h1 className="font-serif text-3xl mb-8">{order.total} MAD</h1>

      <div className="grid gap-0 mb-10">
        {steps.map((s, i) => (
          <div key={s.keys[0]} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${i <= currentIndex ? "bg-tomato" : "bg-line"}`} />
              {i < steps.length - 1 && <div className={`w-0.5 h-8 ${i < currentIndex ? "bg-tomato" : "bg-line"}`} />}
            </div>
            <p className={`text-sm pb-8 ${i <= currentIndex ? "text-ink" : "text-inkdim"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-bgsoft border border-line rounded-2xl p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-inkdim mb-3">Details</p>
        <ul className="text-sm grid gap-1">
          {(order.items || []).map((it, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="text-inkdim">{it.qty} x {it.name}</span>
              <span>{it.qty * it.price} MAD</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
