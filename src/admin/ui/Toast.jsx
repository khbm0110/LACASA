import { createContext, useCallback, useContext, useRef, useState } from "react"

const ToastContext = createContext(null)

// Fournit useToast() a tout l espace admin - remplace window.alert par de
// petites notifications qui s effacent seules, dans le style du site
// (au lieu de la boite native du navigateur).
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const push = useCallback((message, variant = "success") => {
    const id = ++counter.current
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3200)
  }, [])

  const toast = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error")
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-full text-sm font-medium shadow-2xl border flex items-center gap-2 animate-toast-in ${
              t.variant === "error"
                ? "bg-red-500/15 border-red-400/40 text-red-300"
                : "bg-basil/15 border-basil/40 text-basil"
            }`}
          >
            {t.variant === "error" ? "\u26A0" : "\u2713"} {t.message}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-toast-in { animation: toast-in .2s ease; }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast doit etre utilise a l interieur de ToastProvider")
  return ctx
}
