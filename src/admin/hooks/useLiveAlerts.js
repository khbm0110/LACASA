import { useEffect, useRef, useState } from "react"
import { supabase } from "../../lib/supabaseClient"

const REPEAT_EVERY_MS = 20000 // relance le son toutes les 20s tant qu une alerte n est pas fermee

// Ecoute en temps reel les nouvelles reservations et commandes via
// Supabase Realtime (aucune cle API externe necessaire - fonctionne
// des que Supabase est configure). Tant que le tableau de bord admin
// reste ouvert dans un onglet, chaque nouvel evenement declenche :
//  - un son d alerte (nettement audible, et qui se repete tant que
//    personne n a ferme l alerte - pour ne pas rater une commande si
//    l equipe est occupee en cuisine)
//  - une notification systeme (si l utilisateur a autorise les notifications)
//  - un badge visible dans le menu de gauche
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

  // Relance le son toutes les 20s tant qu il reste au moins une alerte non
  // fermee, pour etre sur que personne ne la rate meme si l equipe est
  // occupee ailleurs (en cuisine, au telephone...).
  useEffect(() => {
    const interval = setInterval(() => {
      if (alertsRef.current.length > 0) playChime()
    }, REPEAT_EVERY_MS)
    return () => clearInterval(interval)
  }, [])

  function pushAlert({ type, message }) {
    setAlerts((prev) => [{ id: Date.now(), type, message }, ...prev].slice(0, 20))
    playChime()

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("La Casa Di Carta", { body: message })
    }
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
