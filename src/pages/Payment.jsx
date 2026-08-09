import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"

// Paiement en ligne de la commande (obligatoire pour la livraison, voir
// Delivery.jsx) via ChariBaaS. Cette page appelle la fonction Supabase
// "chari-init-payment" qui contacte l API ChariBaaS depuis le serveur (la
// cle API secrete n est jamais exposee au navigateur).
//
// !! IMPORTANT AVANT MISE EN PRODUCTION !!
// La documentation ChariBaaS pour le paiement marchand par carte prend en
// parametres le numero de carte (Pan), la date d expiration et le CVV
// directement dans l appel API. Avant d ouvrir ce formulaire a de vrais
// clients, confirmez avec ChariBaaS (WhatsApp +212 6 00 00 00 10 ou
// +212 6 32 64 64 64) s ils proposent une page de paiement hebergee /
// un widget (iframe) plutot que la saisie de la carte sur notre propre
// formulaire - c est le point qui determine vos obligations de
// conformite PCI-DSS. Ce formulaire ne stocke JAMAIS les donnees de
// carte (aucune ecriture en base, aucun log) : il les transmet une seule
// fois, directement, a la fonction serveur qui les relaie a ChariBaaS.
export default function Payment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(undefined)
  const [form, setForm] = useState({ firstName: "", lastName: "", pan: "", expiry: "", cvv: "" })
  const [status, setStatus] = useState(null) // null | "loading" | "error"
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc("get_order_tracking", { p_id: id })
      setOrder((data && data[0]) || null)
    }
    load()
  }, [id])

  useEffect(() => {
    if (order && order.payment_status === "paid") navigate(`/suivi/${id}?paiement=succes`, { replace: true })
  }, [order, id, navigate])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setStatus("loading")
    setError("")

    const [mm, yy] = form.expiry.split("/").map((s) => s.trim())
    const expiryDate = yy && mm ? `${yy}${mm}` : "" // format attendu par ChariBaaS : YYMM

    const { data, error: fnError } = await supabase.functions.invoke("chari-init-payment", {
      body: {
        orderId: id,
        firstName: form.firstName,
        lastName: form.lastName,
        pan: form.pan.replace(/\s+/g, ""),
        expiryDate,
        cvv: form.cvv
      }
    })

    if (fnError || !data || data.error) {
      setStatus("error")
      setError(data?.error || fnError?.message || "Le paiement n a pas pu etre initie. Reessayez.")
      return
    }
    if (data.redirectionURL) {
      window.location.href = data.redirectionURL
      return
    }
    // Deja confirme sans etape 3D Secure supplementaire
    navigate(`/suivi/${id}?paiement=succes`, { replace: true })
  }

  if (order === undefined) return <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}><p className="text-inkdim">Chargement...</p></div>
  if (!order) return <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}><p className="text-inkdim">Commande introuvable.</p></div>

  return (
    <section className="page-wrap" style={{ maxWidth: 480 }}>
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Paiement securise</span></div>
      <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>{order.total} MAD</h1>
      <p className="text-inkdim text-sm mb-8">
        Le paiement est requis pour confirmer votre commande en livraison.
      </p>

      <form onSubmit={submit} className="booking-frame" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <input required placeholder="Prenom" value={form.firstName} onChange={update("firstName")} className="form-input" />
          <input required placeholder="Nom" value={form.lastName} onChange={update("lastName")} className="form-input" />
        </div>
        <input required placeholder="Numero de carte" inputMode="numeric" value={form.pan} onChange={update("pan")} className="form-input" />
        <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <input required placeholder="MM/AA" value={form.expiry} onChange={update("expiry")} className="form-input" />
          <input required placeholder="CVV" inputMode="numeric" maxLength={3} value={form.cvv} onChange={update("cvv")} className="form-input" />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={status === "loading"}
          style={{ background: "#D2491F", color: "#000", padding: "1rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", letterSpacing: "0.08em", border: "none", cursor: "pointer", marginTop: "0.25rem" }}
          className="disabled:opacity-60">
          {status === "loading" ? "Verification..." : `Payer ${order.total} MAD`}
        </button>
        <p className="text-[11px] text-inkdim text-center">
          Paiement traite par ChariBaaS. Vos donnees bancaires ne sont jamais stockees sur notre site.
        </p>
      </form>
    </section>
  )
}
