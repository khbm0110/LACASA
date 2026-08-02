// Ticket cuisine : ce que voit le cuisinier - noms des plats, quantites,
// modificateurs choisis et table/type de commande. Volontairement SANS
// prix ni total ni mode de paiement (ce n est pas un document commercial,
// juste une liste de preparation).
export function printKitchenTicket(order) {
  const win = window.open("", "_blank", "width=380,height=600")
  if (!win) return

  const itemsHtml = (order.items || [])
    .map((it) => `
      <tr>
        <td style="font-size:16px;font-weight:bold;padding:6px 0">${it.qty} x ${escapeHtml(it.name)}</td>
      </tr>
      ${it.modifiers?.length ? `<tr><td style="font-size:13px;color:#333;padding-bottom:6px">↳ ${escapeHtml(it.modifiers.join(", "))}</td></tr>` : ""}
    `).join("")

  const typeLabel = order.order_type === "delivery"
    ? "LIVRAISON"
    : order.order_type === "takeaway"
      ? "A EMPORTER"
      : "SUR PLACE"

  win.document.write(`
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Ticket cuisine</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 16px; color: #111; }
        h1 { font-size: 18px; text-align: center; margin-bottom: 2px; letter-spacing: 1px; }
        .sub { text-align: center; font-size: 13px; color: #333; margin-bottom: 14px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        td { border-bottom: 1px dashed #ccc; }
      </style>
    </head>
    <body onload="window.print()">
      <h1>*** CUISINE ***</h1>
      <p class="sub">${typeLabel}${order.table_number ? " · Table " + escapeHtml(order.table_number) : ""} — ${new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
      <table>${itemsHtml}</table>
      ${order.address && order.order_type !== "dine_in" ? `<p style="font-size:12px;margin-top:10px">Adresse : ${escapeHtml(order.address)}</p>` : ""}
    </body>
    </html>
  `)
  win.document.close()
}

// Ouvre une fenetre de navigateur formatee pour l impression d une commande
// (ticket cuisine / ticket client) - aucune dependance ni imprimante
// specifique requise, utilise l impression standard du navigateur.
export function printOrderReceipt(order) {
  const win = window.open("", "_blank", "width=380,height=600")
  if (!win) return

  const itemsHtml = (order.items || [])
    .map((it) => `
      <tr>
        <td>${it.qty} x ${escapeHtml(it.name)}${it.modifiers?.length ? `<br/><span style="font-size:11px;color:#666">${escapeHtml(it.modifiers.join(", "))}</span>` : ""}</td>
        <td style="text-align:right">${it.qty * it.price} MAD</td>
      </tr>
    `).join("")

  const typeLabel = order.order_type === "delivery"
    ? "Livraison"
    : order.order_type === "takeaway"
      ? "A emporter"
      : `Sur place${order.address ? " - " + order.address : ""}`

  win.document.write(`
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Ticket commande</title>
      <style>
        body { font-family: 'Courier New', monospace; padding: 16px; color: #111; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; font-size: 12px; color: #555; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        td { padding: 4px 0; border-bottom: 1px dashed #ccc; }
        .total { font-weight: bold; font-size: 15px; margin-top: 10px; text-align: right; }
        .meta { font-size: 12px; margin-top: 14px; color: #333; }
      </style>
    </head>
    <body>
      <h1>La Casa Di Carta</h1>
      <p class="sub">${typeLabel} - ${new Date(order.created_at).toLocaleString("fr-FR")}</p>
      <table>${itemsHtml}</table>
      ${order.discount_amount > 0 ? `
        <p style="font-size:12px;text-align:right;color:#555">Sous-total : ${order.subtotal} MAD</p>
        <p style="font-size:12px;text-align:right;color:#b45309">Remise${order.discount_reason ? " (" + escapeHtml(order.discount_reason) + ")" : ""} : -${order.discount_amount} MAD</p>
      ` : ""}
      <p class="total">Total : ${order.total} MAD</p>
      <p style="font-size:12px;color:#444">${paymentLine(order)}</p>
      ${order.discount > 0 ? `<p class="meta">Remise appliquee : -${order.discount} MAD (${order.promo_code || ""})</p>` : ""}
      ${order.address ? `<p class="meta">Adresse : ${escapeHtml(order.address)}</p>` : ""}
      ${order.phone ? `<p class="meta">Telephone : ${escapeHtml(order.phone)}</p>` : ""}
      ${order.notes ? `<p class="meta">Notes : ${escapeHtml(order.notes)}</p>` : ""}
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

function paymentLine(order) {
  const labels = { cash: "Especes", card_tpe: "Carte (TPE)" }
  if (order.payments && order.payments.length > 0) {
    return "Paiement : " + order.payments.map((p) => `${p.amount} MAD ${labels[p.method] || p.method}`).join(" + ")
  }
  return "Paiement : " + (labels[order.payment_provider] || order.payment_provider || "—")
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]))
}

// Imprime la fiche QR d une seule table (a poser/coller sur la table).
export function printTableQr(table, qrImageUrl) {
  const win = window.open("", "_blank", "width=420,height=560")
  if (!win) return
  win.document.write(`
    <html>
    <head>
      <meta charset="utf-8" />
      <title>QR Table ${escapeHtml(table.number)}</title>
      <style>${qrCardStyle}</style>
    </head>
    <body>
      ${qrCardHtml(table, qrImageUrl)}
    </body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

// Imprime toutes les fiches QR d un coup, une par page (mise en place
// initiale de toutes les tables du restaurant).
export function printAllTableQrs(tablesWithQr) {
  const win = window.open("", "_blank", "width=420,height=560")
  if (!win) return
  const pages = tablesWithQr.map((t) => `<div class="page">${qrCardHtml(t.table, t.qrImageUrl)}</div>`).join("")
  win.document.write(`
    <html>
    <head>
      <meta charset="utf-8" />
      <title>QR codes - toutes les tables</title>
      <style>
        ${qrCardStyle}
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>${pages}</body>
    </html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

const qrCardStyle = `
  body { font-family: 'Georgia', serif; text-align: center; padding: 24px; color: #111; }
  .brand { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #B5651D; margin-bottom: 4px; }
  h1 { font-size: 22px; margin: 0 0 18px; }
  .qr { padding: 10px; background: #fff; display: inline-block; border: 1px solid #ddd; }
  .table-num { font-size: 34px; font-weight: bold; margin-top: 18px; }
  .hint { font-size: 13px; color: #555; margin-top: 6px; }
`

function qrCardHtml(table, qrImageUrl) {
  return `
    <p class="brand">La Casa Di Carta</p>
    <h1>Scannez pour commander</h1>
    <div class="qr"><img src="${qrImageUrl}" width="220" height="220" /></div>
    <p class="table-num">Table ${escapeHtml(table.number)}</p>
    <p class="hint">Consultez le menu et commandez directement depuis votre telephone</p>
  `
}

