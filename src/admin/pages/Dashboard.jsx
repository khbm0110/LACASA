import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

export default function Dashboard() {
  const [counts, setCounts] = useState({ reservations: 0, orders: 0, menuItems: 0 })

  useEffect(() => {
    async function load() {
      const [{ count: r }, { count: o }, { count: m }] = await Promise.all([
        supabase.from("reservations").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("menu_items").select("*", { count: "exact", head: true })
      ])
      setCounts({ reservations: r || 0, orders: o || 0, menuItems: m || 0 })
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Tableau de bord</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card label="Reservations" value={counts.reservations} />
        <Card label="Commandes livraison" value={counts.orders} />
        <Card label="Plats au menu" value={counts.menuItems} />
      </div>
      <p className="text-inkdim text-sm mt-10">
        Gerez le menu, les reservations, les commandes, le contenu de la page d accueil
        et les fichiers de traduction depuis le menu de gauche.
      </p>
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="bg-bgsoft border border-line rounded-2xl p-6">
      <p className="text-inkdim text-sm mb-2">{label}</p>
      <p className="font-serif text-4xl">{value}</p>
    </div>
  )
}
