import { useEffect, useState } from "react"

// Bandeau visible des que le navigateur perd la connexion internet - utile
// autant pour un client en train de commander que pour l equipe en admin,
// puisque sans connexion : les alertes en direct, le suivi de commande et
// tout envoi de formulaire s arretent silencieusement sinon.
export default function ConnectionStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-tomato text-paper text-sm text-center py-2 px-4">
      Vous etes hors ligne - les mises a jour en direct sont en pause. Reconnexion automatique des que possible.
    </div>
  )
}
