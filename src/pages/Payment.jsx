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

  if (order === undefined) return <div className="max-w-md mx-auto px-6 py-24 text-inkdim">Chargement...</div>
  if (!order) return <div className="max-w-md mx-auto px-6 py-24 text-inkdim">Commande introuvable.</div>

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Paiement securise</p>
      <h1 className="font-serif text-3xl mb-1">{order.total} MAD</h1>
      <p className="text-inkdim text-sm mb-8">
        Le paiement est requis pour confirmer votre commande en livraison.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-5 grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="Prenom" value={form.firstName} onChange={update("firstName")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required placeholder="Nom" value={form.lastName} onChange={update("lastName")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        </div>
        <input required placeholder="Numero de carte" inputMode="numeric" value={form.pan} onChange={update("pan")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <div className="grid grid-cols-2 gap-3">
          <input required placeholder="MM/AA" value={form.expiry} onChange={update("expiry")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
          <input required placeholder="CVV" inputMode="numeric" maxLength={3} value={form.cvv} onChange={update("cvv")}
            className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button disabled={status === "loading"}
          className="mt-1 px-5 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60">
          {status === "loading" ? "Verification..." : `Payer ${order.total} MAD`}
        </button>
        <p className="text-[11px] text-inkdim text-center">
          Paiement traite par ChariBaaS. Vos donnees bancaires ne sont jamais stockees sur notre site.
        </p>
      </form>
    </section>
  )
}
