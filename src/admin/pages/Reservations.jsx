import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Deux onglets : "En attente" (les seules qu on peut encore confirmer ou
// annuler) et "Historique" (confirmees ou annulees, lecture seule) - une
// reservation deja traitee ne doit plus proposer de bouton confirmer/annuler,
// pour eviter les etats incoherents (annuler une reservation deja confirmee...).
export default function Reservations() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)
  const [tab, setTab] = useState("pending")

  const load = async () => {
    const { data } = await supabase.from("reservations").select("*").order("created_at", { ascending: false })
    setRows(data || [])
  }
  useEffect(() => {
    load()
    const channel = supabase
      .channel("admin-reservations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const setStatus = async (id, status) => {
    setError(null)
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id)
    if (error?.code === "23505") {
      setError("Impossible : une autre reservation active occupe deja cette table sur ce creneau.")
    } else if (error) {
      setError("Une erreur est survenue.")
    }
    load()
  }

  const pending = rows.filter((r) => r.status === "pending")
  const history = rows.filter((r) => r.status !== "pending")
  const list = tab === "pending" ? pending : history

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Reservations</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("pending")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono border ${tab === "pending" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          En attente ({pending.length})
        </button>
        <button onClick={() => setTab("history")}
          className={`px-4 py-1.5 rounded-full text-xs font-mono border ${tab === "history" ? "bg-tomato border-tomato text-paper" : "border-line text-inkdim"}`}>
          Historique ({history.length})
        </button>
      </div>

      <div className="grid gap-2">
        {list.map((r) => (
          <div key={r.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{r.name} - {r.guests} pers.</p>
              <p className="text-inkdim text-xs">{r.date} a {r.time} - {r.phone}</p>
              {r.notes && <p className="text-inkdim text-xs mt-1">{r.notes}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                r.status === "confirmed" ? "bg-basil/20 text-basil" : r.status === "cancelled" ? "bg-red-500/20 text-red-400" : "bg-gold/20 text-gold"
              }`}>{r.status}</span>
              {tab === "pending" && (
                <>
                  <button onClick={() => setStatus(r.id, "confirmed")} className="text-basil text-xs">Confirmer</button>
                  <button onClick={() => setStatus(r.id, "cancelled")} className="text-red-400 text-xs">Annuler</button>
                </>
              )}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-inkdim text-sm">
            {tab === "pending" ? "Aucune reservation en attente." : "Aucun historique pour le moment."}
          </p>
        )}
      </div>
    </div>
  )
}
