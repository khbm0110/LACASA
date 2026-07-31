// Supabase Edge Function - a deployer avec `supabase functions deploy chari-webhook`
// Recoit les notifications temps reel de ChariBaaS quand un paiement est
// confirme, echoue ou annule. C est CETTE fonction (pas le retour du
// navigateur, qui peut etre falsifie) qui fait foi : une commande ne
// passe "payee" + "en cuisine" que lorsque ce webhook confirme le
// paiement cote serveur.
//
// A configurer dans le tableau de bord ChariBaaS : URL de notification =
//   https://VOTRE-PROJET.supabase.co/functions/v1/chari-webhook
// (cette URL est aussi transmise dynamiquement via NotificationUrl a
// chaque appel, voir chari-init-payment)
//
// Variables d environnement a definir dans Supabase (Project Settings > Functions):
//   CHARI_WEBHOOK_SECRET  - cle secrete que VOUS choisissez et communiquez a
//                           ChariBaaS ; ils la renvoient dans l en-tete
//                           X-Api-Key de chaque webhook, ce qui permet de
//                           verifier que la requete vient bien d eux.
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - fournis automatiquement par Supabase

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Statuts d operation ChariBaaS (voir documentation "Types et references")
const STATUS_COMPLETED = 2
const STATUS_FAILED = 3
const STATUS_CANCELED = 4

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get("CHARI_WEBHOOK_SECRET")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceKey) {
    return new Response("Configuration serveur incomplete", { status: 500 })
  }

  // Verifie que la requete vient bien de ChariBaaS avant de faire quoi que ce soit
  if (webhookSecret) {
    const incomingKey = req.headers.get("X-Api-Key") || req.headers.get("x-api-key")
    if (incomingKey !== webhookSecret) {
      return new Response("Non autorise", { status: 401 })
    }
  }

  let payload
  try {
    payload = await req.json()
  } catch {
    return new Response("Corps invalide", { status: 400 })
  }

  const d = payload?.data || payload
  if (!d) return new Response("OK", { status: 200 })

  const supabase = createClient(supabaseUrl, serviceKey)

  // On retrouve la commande par la reference qu on a envoyee a l ouverture
  // du paiement : d abord via CRequestId (l en-tete C-Request-Id qu on avait
  // envoye = l id de la commande), sinon via CustomData/ExternalReference,
  // sinon via l id d operation deja enregistre (second appel webhook).
  const candidateIds = [d.CRequestId, d.CustomData, d.ExternalReference].filter(Boolean)
  const operationId = d.OperationId ? String(d.OperationId) : null

  let order = null
  for (const candidate of candidateIds) {
    const { data } = await supabase.from("orders").select("id, payment_status").eq("id", candidate).maybeSingle()
    if (data) { order = data; break }
  }
  if (!order && operationId) {
    const { data } = await supabase.from("orders").select("id, payment_status").eq("payment_operation_id", operationId).maybeSingle()
    if (data) order = data
  }

  if (!order) {
    console.error("chari-webhook: commande introuvable pour", { candidateIds, operationId })
    return new Response("OK", { status: 200 }) // on repond quand meme 200 pour eviter des reessais inutiles
  }

  const status = Number(d.OperationStatus)

  if (status === STATUS_COMPLETED) {
    // Paiement confirme cote serveur : la commande peut partir en cuisine.
    await supabase.from("orders").update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      payment_operation_id: operationId,
      status: "new"
    }).eq("id", order.id).neq("payment_status", "paid") // evite un double traitement si le webhook est envoye plusieurs fois
  } else if (status === STATUS_FAILED || status === STATUS_CANCELED) {
    if (order.payment_status !== "paid") {
      await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order.id)
    }
  }

  return new Response("OK", { status: 200 })
})
