import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

// Lit les interrupteurs de service reglables depuis Admin > Contenu du
// site (restaurant_info). undefined tant que non charge, pour eviter
// d afficher un etat "active" trompeur pendant une fraction de seconde.
export function useServiceStatus() {
  const [status, setStatus] = useState({
    delivery_enabled: undefined,
    online_payment_enabled: undefined,
    reservations_enabled: undefined
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("restaurant_info")
        .select("delivery_enabled, online_payment_enabled, reservations_enabled")
        .eq("id", 1)
        .single()
      if (data) setStatus(data)
      else setStatus({ delivery_enabled: true, online_payment_enabled: true, reservations_enabled: true })
    }
    load()
  }, [])

  return status
}
