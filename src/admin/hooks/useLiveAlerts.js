import { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

// Ecoute en temps reel les nouvelles reservations et commandes via
// Supabase Realtime (aucune cle API externe necessaire - fonctionne
// des que Supabase est configure). Tant que le tableau de bord admin
// reste ouvert dans un onglet, chaque nouvel evenement declenche :
//  - un son d alerte
//  - une notification systeme (si l utilisateur a autorise les notifications)
//  - un badge visible dans le menu de gauche
export function useLiveAlerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel("admin-live-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservations" }, (payload) => {
        pushAlert({
          type: "reservation",
          message: `Nouvelle reservation - ${payload.new.name} (${payload.new.guests} pers.)`
        })
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const label = payload.new.order_type === "dine_in" ? "Nouvelle commande a table" : "Nouvelle commande livraison"
        pushAlert({ type: "order", message: `${label} - ${payload.new.total} MAD` })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushAlert({ type, message }) {
    setAlerts((prev) => [{ id: Date.now(), type, message }, ...prev].slice(0, 20))

    // Son d alerte discret (genere en JS, aucun fichier audio a heberger)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + 0.18)
    } catch { /* audio non disponible, on ignore */ }

    // Notification systeme (fonctionne aussi PWA installee, tab en arriere-plan)
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("La Casa Di Carta", { body: message })
    }
  }

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id))

  return { alerts, dismiss }
}
