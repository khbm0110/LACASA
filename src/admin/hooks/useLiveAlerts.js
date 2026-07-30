import { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

const REPEAT_EVERY_MS = 20000 // relance le son toutes les 20s tant qu une alerte n est pas fermee

// Ecoute en temps reel les nouvelles reservations et commandes via
// Supabase Realtime. Chaque alerte est liee a l id de son enregistrement
// (recordId) : si la reservation/commande est confirmee ou annulee avant
// que quelqu un ne ferme manuellement l alerte, elle disparait et arrete
// de sonner automatiquement - sinon le carillon continuerait de sonner
// pour une demande deja traitee, ce qui n a pas de sens.
export function useLiveAlerts() {
  const [alerts, setAlerts] = useState([])
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts

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
          recordId: payload.new.id,
          message: `Nouvelle reservation - ${payload.new.name} (${payload.new.guests} pers.)`
        })
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "reservations" }, (payload) => {
        if (payload.new.status !== "pending") clearAlertFor(payload.new.id)
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const label = payload.new.order_type === "dine_in" ? "Nouvelle commande a table" : "Nouvelle commande livraison"
        pushAlert({ type: "order", recordId: payload.new.id, message: `${label} - ${payload.new.total} MAD` })
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        if (payload.new.status !== "awaiting_confirmation") clearAlertFor(payload.new.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Relance le son toutes les 20s tant qu il reste au moins une alerte non
  // fermee (et donc pas encore traitee), pour etre sur que personne ne la
  // rate meme si l equipe est occupee ailleurs (en cuisine, au telephone...).
  useEffect(() => {
    const interval = setInterval(() => {
      if (alertsRef.current.length > 0) playChime()
    }, REPEAT_EVERY_MS)
    return () => clearInterval(interval)
  }, [])

  function pushAlert({ type, recordId, message }) {
    setAlerts((prev) => [{ id: Date.now(), recordId, type, message }, ...prev].slice(0, 20))
    playChime()

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("La Casa Di Carta", { body: message })
    }
  }

  function clearAlertFor(recordId) {
    setAlerts((prev) => prev.filter((a) => a.recordId !== recordId))
  }

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id))
  const dismissAll = () => setAlerts([])

  return { alerts, dismiss, dismissAll }
}

// Carillon a trois notes ascendantes, nettement plus fort et plus long que
// le simple bip precedent - pense pour etre entendu dans une cuisine bruyante.
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [660, 880, 1040]
    notes.forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.16
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(start); osc.stop(start + 0.32)
    })
  } catch { /* audio non disponible (autoplay bloque tant qu aucune interaction n a eu lieu), on ignore */ }
}
