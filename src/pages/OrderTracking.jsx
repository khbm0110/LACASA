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

  if (order === undefined) return <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}><p className="text-inkdim">Chargement...</p></div>
  if (!order) return <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}><p className="text-inkdim">Commande introuvable.</p></div>
  if (order.status === "cancelled") {
    return (
      <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}>
        <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.75rem", marginBottom: "0.5rem" }}>Commande annulee</p>
        <p className="text-inkdim text-sm">Contactez-nous si vous avez une question : +212 5 37 26 26 58</p>
      </div>
    )
  }

  const steps = STEPS[order.order_type === "dine_in" ? "dine_in" : "delivery"]
  const currentIndex = steps.findIndex((s) => s.keys.includes(order.status))
  const isDelivery = order.order_type !== "dine_in"
  const paymentJustSucceeded = searchParams.get("paiement") === "succes"

  return (
    <section className="page-wrap" style={{ maxWidth: 480 }}>
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Suivi de commande</span></div>
      <h1 className="page-title" style={{ marginBottom: "2rem" }}>{order.total} MAD</h1>

      {isDelivery && (
        <div className="mb-8">
          {order.payment_status === "paid" && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#6fbf73", background: "rgba(111,191,115,0.08)", border: "1px solid rgba(111,191,115,0.3)", padding: "1rem 1.25rem" }}>
              Paiement confirme{paymentJustSucceeded ? " - merci !" : ""}. Votre commande part en cuisine.
            </p>
          )}
          {order.payment_status === "pending" && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#D4A84B", background: "rgba(212,168,75,0.08)", border: "1px solid rgba(212,168,75,0.3)", padding: "1rem 1.25rem" }}>
              Paiement en cours de verification...
            </p>
          )}
          {order.payment_status === "failed" && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", padding: "1rem 1.25rem" }}>
              Le paiement a echoue. Contactez-nous au +212 5 37 26 26 58 pour reessayer.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-0 mb-10">
        {steps.map((s, i) => (
          <div key={s.keys[0]} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4" style={{ background: i <= currentIndex ? "#D2491F" : "#2a2a2a" }} />
              {i < steps.length - 1 && <div className="w-0.5 h-8" style={{ background: i < currentIndex ? "#D2491F" : "#2a2a2a" }} />}
            </div>
            <p className="text-sm pb-8" style={{ color: i <= currentIndex ? "#f5f5f5" : "#6a6a6a" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="info-card p-5">
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
