import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useBranch } from "../BranchContext.jsx"

export default function Shifts() {
  const { activeBranchId, activeBranch } = useBranch()
  const [shifts, setShifts] = useState([])

  useEffect(() => {
    async function load() {
      if (!activeBranchId) return
      const { data } = await supabase.from("shifts").select("*")
        .eq("branch_id", activeBranchId).order("opened_at", { ascending: false }).limit(60)
      setShifts(data || [])
    }
    load()
  }, [activeBranchId])

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Caisses (historique){activeBranch && <span className="text-inkdim text-lg font-sans ml-2">— {activeBranch.name}</span>}</h1>
      <p className="text-inkdim text-sm mb-8">Chaque ouverture/fermeture de caisse au point de vente, avec l ecart constate au comptage.</p>

      <div className="grid gap-2">
        {shifts.map((s) => (
          <div key={s.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {new Date(s.opened_at).toLocaleDateString("fr-FR")} · {new Date(s.opened_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  {s.closed_at && <> — {new Date(s.closed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>}
                </span>
                {s.status === "open" ? (
                  <span className="text-xs text-basil border border-basil/50 rounded-full px-2 py-0.5">En cours</span>
                ) : (
                  <span className="text-xs text-inkdim border border-line rounded-full px-2 py-0.5">Fermee</span>
                )}
              </div>
              {s.status === "closed" && (
                <span className={`text-xs font-mono ${s.cash_difference === 0 ? "text-basil" : "text-tomato"}`}>
                  Ecart : {s.cash_difference > 0 ? "+" : ""}{s.cash_difference} MAD
                </span>
              )}
            </div>
            {s.status === "closed" && (
              <p className="text-inkdim text-xs mt-1.5">
                Fond {s.opening_cash} MAD · attendu {s.expected_cash} MAD · compte {s.closing_cash} MAD
                {s.notes && <> · {s.notes}</>}
              </p>
            )}
          </div>
        ))}
        {shifts.length === 0 && <p className="text-inkdim text-sm">Aucune session de caisse pour le moment.</p>}
      </div>
    </div>
  )
}
