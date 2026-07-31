import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { printTableQr, printAllTableQrs } from "../../lib/printReceipt"
import { useConfirm } from "../ui/ConfirmDialog.jsx"
import { useToast } from "../ui/Toast.jsx"

const EMPTY = { number: "", capacity: 2, zone: "" }

// Genere l URL de QR code via l API publique qrserver.com (aucune
// dependance a installer). Le QR pointe vers /table/{id} du site public,
// ou le client peut voir le menu et commander directement depuis sa table.
function qrUrl(targetUrl) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(targetUrl)}`
}

export default function Tables() {
  const [tables, setTables] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [siteUrl, setSiteUrl] = useState("")
  const confirm = useConfirm()
  const toast = useToast()

  useEffect(() => {
    setSiteUrl(window.location.origin)
  }, [])

  const load = async () => {
    const { data } = await supabase.from("restaurant_tables").select("*").order("number")
    setTables(data || [])
  }
  useEffect(() => { load() }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from("restaurant_tables").insert([{ ...form, capacity: Number(form.capacity) }])
    if (error) { toast.error("Echec de l ajout de la table."); return }
    setForm(EMPTY)
    load()
    toast.success("Table ajoutee.")
  }

  const remove = async (id) => {
    const ok = await confirm({ title: "Supprimer cette table ?", message: "Son QR code ne fonctionnera plus." })
    if (!ok) return
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id)
    if (error) { toast.error("Echec de la suppression."); return }
    load()
    toast.success("Table supprimee.")
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <h1 className="font-serif text-3xl">Tables & QR codes</h1>
        {tables.length > 0 && (
          <button
            onClick={() => printAllTableQrs(tables.map((t) => ({ table: t, qrImageUrl: qrUrl(`${siteUrl}/table/${t.id}`) })))}
            className="px-4 py-2 rounded-full text-xs font-semibold border border-line hover:bg-white/5"
          >
            Tout imprimer
          </button>
        )}
      </div>
      <p className="text-inkdim text-sm mb-8">
        Chaque table a son propre QR code. Le client le scanne, voit le menu et peut commander
        directement depuis sa table (page publique <code>/table/ID</code>). Imprimez la fiche
        et posez-la sur la table.
      </p>

      <form onSubmit={submit} className="bg-bgsoft border border-line rounded-2xl p-6 grid sm:grid-cols-4 gap-3 mb-10">
        <input required placeholder="N° table (ex: T1)" value={form.number} onChange={update("number")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input required type="number" min="1" placeholder="Capacite" value={form.capacity} onChange={update("capacity")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <input placeholder="Zone (terrasse, salle...)" value={form.zone} onChange={update("zone")}
          className="bg-bg border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-tomato" />
        <button className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]">
          Ajouter la table
        </button>
      </form>

      <div className="grid sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((t) => {
          const targetUrl = `${siteUrl}/table/${t.id}`
          return (
            <div key={t.id} className="bg-bgsoft border border-line rounded-2xl p-4 text-center">
              <p className="font-serif text-xl mb-1">Table {t.number}</p>
              <p className="text-inkdim text-xs mb-3">{t.capacity} places {t.zone ? `- ${t.zone}` : ""}</p>
              {siteUrl && (
                <img src={qrUrl(targetUrl)} alt={`QR code table ${t.number}`} className="mx-auto rounded-lg bg-white p-2" />
              )}
              <div className="flex justify-center gap-3 mt-3 text-xs">
                <a href={targetUrl} target="_blank" rel="noreferrer" className="text-gold">Ouvrir</a>
                <button onClick={() => printTableQr(t, qrUrl(targetUrl))} className="text-inkdim hover:text-ink">Imprimer</button>
                <button onClick={() => remove(t.id)} className="text-red-400">Supprimer</button>
              </div>
            </div>
          )
        })}
        {tables.length === 0 && <p className="text-inkdim text-sm">Aucune table enregistree.</p>}
      </div>
    </div>
  )
}
