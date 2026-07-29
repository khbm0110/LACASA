// Supabase Edge Function - a deployer avec `supabase functions deploy notify-staff`
// Objectif : prevenir l equipe INSTANTANEMENT (meme si personne ne regarde
// le tableau de bord) quand une nouvelle reservation ou commande arrive.
//
// Cette fonction est concue pour etre appelee automatiquement par un
// Database Webhook Supabase (Dashboard > Database > Webhooks) configure sur :
//   - table "reservations", evenement INSERT
//   - table "orders", evenement INSERT
// -> Supabase POST alors le nouvel enregistrement directement a cette fonction.
//
// Deux canaux sont proposes ci-dessous (activez ceux que vous voulez) :
//   1) Email via Resend (https://resend.com) - le plus simple a mettre en place
//   2) WhatsApp via Twilio (https://twilio.com) - notification sur le telephone du gerant
//
// Variables d environnement a definir dans Supabase (Project Settings > Functions) :
//   RESEND_API_KEY, NOTIFY_EMAIL_TO, NOTIFY_EMAIL_FROM
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, NOTIFY_WHATSAPP_TO

Deno.serve(async (req) => {
  const payload = await req.json()
  const record = payload.record
  const table = payload.table // "reservations" ou "orders"

  const message = table === "reservations"
    ? `Nouvelle reservation : ${record.name}, ${record.guests} pers., le ${record.date} a ${record.time}.`
    : `Nouvelle commande (${record.order_type === "dine_in" ? "sur place" : "livraison"}) : ${record.total} MAD.`

  const results = { email: null, whatsapp: null }

  // --- 1) Email via Resend ---------------------------------------------
  const resendKey = Deno.env.get("RESEND_API_KEY")
  const emailTo = Deno.env.get("NOTIFY_EMAIL_TO")
  const emailFrom = Deno.env.get("NOTIFY_EMAIL_FROM")
  if (resendKey && emailTo && emailFrom) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: emailFrom,
        to: emailTo,
        subject: "La Casa Di Carta - " + (table === "reservations" ? "Nouvelle reservation" : "Nouvelle commande"),
        text: message
      })
    })
    results.email = res.ok
  }

  // --- 2) WhatsApp via Twilio --------------------------------------------
  const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID")
  const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN")
  const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") // ex: whatsapp:+14155238886
  const notifyWhatsapp = Deno.env.get("NOTIFY_WHATSAPP_TO") // ex: whatsapp:+212600000000
  if (twilioSid && twilioToken && twilioFrom && notifyWhatsapp) {
    const auth = btoa(`${twilioSid}:${twilioToken}`)
    const body = new URLSearchParams({ From: twilioFrom, To: notifyWhatsapp, Body: message })
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body
    })
    results.whatsapp = res.ok
  }

  return new Response(JSON.stringify({ ok: true, message, results }), { status: 200 })
})
