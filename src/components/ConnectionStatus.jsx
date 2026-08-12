import { useEffect, useState } from "react"
export default function ConnectionStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true)
  useEffect(() => {
    const a=()=>setOnline(true), b=()=>setOnline(false)
    window.addEventListener("online",a); window.addEventListener("offline",b)
    return ()=>{window.removeEventListener("online",a);window.removeEventListener("offline",b)}
  }, [])
  if (online) return null
  return <div className="fixed top-0 inset-x-0 z-[100] bg-ink text-white text-sm text-center py-2.5 font-medium">Hors ligne — reconnexion automatique.</div>
}