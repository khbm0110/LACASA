import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { motion, AnimatePresence } from "framer-motion"

export default function WhatsAppButton() {
  const [number, setNumber] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    supabase.from("restaurant_info").select("whatsapp").eq("id", 1).single().then(({ data }) => { if (data?.whatsapp) setNumber(data.whatsapp) })
    const t1 = setTimeout(() => setShowTooltip(true), 3000)
    const t2 = setTimeout(() => setShowTooltip(false), 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!number) return null
  const message = encodeURIComponent("Bonjour, je souhaite avoir des informations sur La Casa Di Carta.")
  const href = `https://wa.me/${number.replace(/\D/g, "")}?text=${message}`

  return (
    <motion.div
      className="fixed bottom-5 left-5 z-50"
      initial={{ opacity: 0, scale: 0, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.9 }}
            className="absolute bottom-full left-0 mb-3 bg-white border border-border rounded-organic px-4 py-3 whitespace-nowrap shadow-softLg"
          >
            <p className="text-bark text-sm font-medium">Besoin d'aide ?</p>
            <p className="text-barklight text-xs">Ecrivez-nous sur WhatsApp</p>
            <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.a
        href={href} target="_blank" rel="noreferrer"
        aria-label="Contacter sur WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-warmLg block cursor-pointer"
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <svg viewBox="0 0 32 32" width="26" height="26" fill="white">
          <path d="M16 3C9.4 3 4 8.4 4 15c0 2.2.6 4.3 1.7 6.2L4 29l8-1.7C13.7 28.4 14.8 28.6 16 28.6c6.6 0 12-5.4 12-13S22.6 3 16 3zm0 23.6c-1.1 0-2.2-.2-3.2-.6l-.4-.2-4.3 1.1 1.1-4.2-.3-.4C7.7 20.4 7 17.8 7 15c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm5-6.7c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
        </svg>
        <motion.span
          className="absolute inset-0 rounded-full bg-[#25D366]"
          animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      </motion.a>
    </motion.div>
  )
}