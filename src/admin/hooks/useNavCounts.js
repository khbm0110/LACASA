import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Alimente les petites pastilles chiffrees affichees a cote de certains
// liens du menu lateral (Commandes, Ecran cuisine, Reservations,
// Livraisons, Messages). Se met a jour en direct via Supabase Realtime.
export function useNavCounts() {
  const [counts, setCounts] = useState({
    confirmation: 0, // commandes livraison en attente de validation
    kitchen: 0, // commandes actives en cuisine (new/preparing/ready)
    reservations: 0, // reservations en attente
    deliveries: 0, // commandes actives cote livraison (hors attente de confirmation)
    messages: 0 // messages de contact non lus
  })

  const load = async () => {
    const [conf, kitchen, res, deliv, msg] = await Promise.all([
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "awaiting_confirmation"),
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["new", "preparing", "ready"]),
      supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("*", { count: "exact", head: true }).in("status", ["new", "preparing", "ready", "out_for_delivery"]),
      supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new")
    ])
    setCounts({
      confirmation: conf.count || 0,
      kitchen: kitchen.count || 0,
      reservations: res.count || 0,
      deliveries: deliv.count || 0,
      messages: msg.count || 0
    })
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel("admin-nav-counts")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_messages" }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return counts
}
