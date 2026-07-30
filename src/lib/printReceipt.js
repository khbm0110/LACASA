// Ouvre une fenetre de navigateur formatee pour l impression d une commande
// (ticket cuisine / ticket client) - aucune dependance ni imprimante
// specifique requise, utilise l impression standard du navigateur.
export function printOrderReceipt(order) {
  const win = window.open("", "_blank", "width=380,height=600")
  if (!win) return

  const itemsHtml = (order.items || [])
    .map((it) => `
      <tr>
        <td>${it.qty} x ${escapeHtml(it.name)}</td>
        <td style="text-align:right">${it.qty * it.price} MAD</td>
      </tr>
    `).join("")

  const typeLabel = order.order_type === "dine_in"
    ? `Sur place${order.table_number ? " - Table " + order.table_number : ""}`
    : "Livraison"

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
      <p class="total">Total : ${order.total} MAD</p>
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

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]))
}
