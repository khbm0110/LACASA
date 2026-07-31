// Supabase Edge Function - a deployer avec `supabase functions deploy chari-init-payment`
// Appelee par la page de paiement (src/pages/Payment.jsx) pour lancer un
// paiement carte via l API ChariBaaS. La cle API secrete ne quitte jamais
// le serveur.
//
// !! A CONFIRMER AVANT MISE EN PRODUCTION !!
// L endpoint ChariBaaS "paiement marchand par carte" prend le numero de
// carte/CVV/expiration directement en parametres API. Avant d ouvrir ce
// flux a de vrais clients, demandez a ChariBaaS s ils proposent plutot une
// page de paiement hebergee / un widget - cela change vos obligations de
// conformite PCI-DSS. Cette fonction ne stocke JAMAIS les donnees de carte
// (ni en base, ni en log) : elle les relaie une seule fois a ChariBaaS.
//
// Variables d environnement a definir dans Supabase (Project Settings > Functions):
//   CHARI_API_KEY        - cle API ChariBaaS (sandbox puis production)
//   CHARI_MERCHANT_PHONE - numero de telephone du wallet marchand ChariBaaS, format +212XXXXXXXXX
//   CHARI_BASE_URL        - https://sandbox.charimoney.com en test, puis l URL de production fournie par Chari
//   SITE_URL              - URL publique du site (ex: https://lacasadicarta.ma), sans slash final
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - fournis automatiquement par Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  const apiKey = Deno.env.get("CHARI_API_KEY")
  const merchantPhone = Deno.env.get("CHARI_MERCHANT_PHONE")
  const baseUrl = Deno.env.get("CHARI_BASE_URL") || "https://sandbox.charimoney.com"
  const siteUrl = Deno.env.get("SITE_URL")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!apiKey || !merchantPhone || !siteUrl || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Configuration serveur incomplete (variables d environnement manquantes)." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Requete invalide." }), { status: 400, headers: corsHeaders })
  }

  const { orderId, firstName, lastName, pan, expiryDate, cvv } = body
  if (!orderId || !firstName || !lastName || !pan || !expiryDate || !cvv) {
    return new Response(JSON.stringify({ error: "Champs manquants." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const { data: order, error: orderError } = await supabase
    .from("orders").select("id, total, payment_status, order_type").eq("id", orderId).single()

  if (orderError || !order) {
    return new Response(JSON.stringify({ error: "Commande introuvable." }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
  if (order.payment_status === "paid") {
    return new Response(JSON.stringify({ error: "Cette commande est deja payee." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const chariRes = await fetch(`${baseUrl}/api/operations/merchant/payment/card?PhoneNumber=${encodeURIComponent(merchantPhone)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Chari-Api-Key": apiKey,
      // Sert a retrouver la commande a la reception du webhook (voir chari-webhook)
      "C-Request-Id": orderId
    },
    body: JSON.stringify({
      FirstName: firstName,
      LastName: lastName,
      Cvv: cvv,
      Amount: order.total,
      Currency: "MAD",
      Pan: pan,
      ExpiryDate: expiryDate, // format YYMM
      KeepAlive: false,
      "3dSecure": true,
      AutoCapture: true,
      NotificationUrl: `${supabaseUrl}/functions/v1/chari-webhook`,
      AcceptUrl: `${siteUrl}/suivi/${orderId}?paiement=succes`,
      DeclineUrl: `${siteUrl}/paiement/${orderId}?paiement=echec`,
      ExternalReference: orderId
    })
  })

  const chariJson = await chariRes.json().catch(() => null)

  if (!chariRes.ok || !chariJson || chariJson.errorCode) {
    return new Response(JSON.stringify({ error: chariJson?.errorDescription || "Paiement refuse par la banque." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const data = chariJson.data || chariJson
  const operationId = data.OperationId || data.operationId || null
  const redirectionURL = data.redirectionURL || data.RedirectionURL || null

  await supabase.from("orders").update({
    payment_status: "pending",
    payment_provider: "chari",
    payment_reference: orderId,
    payment_operation_id: operationId ? String(operationId) : null
  }).eq("id", orderId)

  return new Response(JSON.stringify({ redirectionURL, operationId }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } })
})
