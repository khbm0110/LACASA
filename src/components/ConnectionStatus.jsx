import { useEffect, useState } from "react"

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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-terracotta text-white text-sm text-center py-2.5 px-4 font-medium">
      Vous etes hors ligne — les mises a jour en direct sont en pause.
    </div>
  )
}