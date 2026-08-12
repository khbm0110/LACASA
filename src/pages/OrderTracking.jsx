import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"

// Suivi de commande en direct, accessible sans compte via le lien recu
// apres validation d une commande : /suivi/{id}
//
// NOTE : la table "orders" n a volontairement aucune regle de lecture
// publique (pour ne pas exposer toutes les commandes de tous les clients
// via l API). On relit donc la commande via la fonction get_order_tracking
// (voir supabase/schema.sql), qui ne renvoie que la commande dont l id
// exact est connu - et on interroge par polling (au lieu du temps reel,
// qui suit les memes regles de securite et ne verrait donc rien).
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

const POLL_MS = 6000

export default function OrderTracking() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase.rpc("get_order_tracking", { p_id: id })
      if (!cancelled) setOrder((data && data[0]) || null)
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [id])

  if (order === undefined) return <div className="max-w-md mx-auto px-6 py-24 text-barklight">Chargement...</div>
  if (!order) return <div className="max-w-md mx-auto px-6 py-24 text-barklight">Commande introuvable.</div>
  if (order.status === "cancelled") {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="font-serif text-2xl mb-2">Commande annulee</p>
        <p className="text-barklight text-sm">Contactez-nous si vous avez une question : +212 5 37 26 26 58</p>
      </div>
    )
  }

  const steps = STEPS[order.order_type === "dine_in" ? "dine_in" : "delivery"]
  const currentIndex = steps.findIndex((s) => s.keys.includes(order.status))
  const isDelivery = order.order_type !== "dine_in"
  const paymentJustSucceeded = searchParams.get("paiement") === "succes"

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <p className="font-mono text-[11px] uppercase tracking-widest text-clay mb-2">Suivi de commande</p>
      <h1 className="font-serif text-3xl mb-4">{order.total} MAD</h1>

      {isDelivery && (
        <div className="mb-8">
          {order.payment_status === "paid" && (
            <p className="text-sm text-olive bg-basil/10 border border-basil/30 rounded-xl px-4 py-3">
              Paiement confirme{paymentJustSucceeded ? " - merci !" : ""}. Votre commande part en cuisine.
            </p>
          )}
          {order.payment_status === "pending" && (
            <p className="text-sm text-clay bg-gold/10 border border-gold/30 rounded-xl px-4 py-3">
              Paiement en cours de verification...
            </p>
          )}
          {order.payment_status === "failed" && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3">
              Le paiement a echoue. Contactez-nous au +212 5 37 26 26 58 pour reessayer.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-0 mb-10">
        {steps.map((s, i) => (
          <div key={s.keys[0]} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full ${i <= currentIndex ? "bg-terracotta" : "bg-line"}`} />
              {i < steps.length - 1 && <div className={`w-0.5 h-8 ${i < currentIndex ? "bg-terracotta" : "bg-line"}`} />}
            </div>
            <p className={`text-sm pb-8 ${i <= currentIndex ? "text-ink" : "text-barklight"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-barklight mb-3">Details</p>
        <ul className="text-sm grid gap-1">
          {(order.items || []).map((it, idx) => (
            <li key={idx} className="flex justify-between">
              <span className="text-barklight">{it.qty} x {it.name}</span>
              <span>{it.qty * it.price} MAD</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
