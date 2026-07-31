import { createContext, useCallback, useContext, useRef, useState } from "react"

const ConfirmContext = createContext(null)

// Fournit useConfirm() a tout l espace admin - remplace window.confirm par
// une boite de dialogue dans le style du site. Usage :
//   const confirm = useConfirm()
//   const ok = await confirm({ title: "Supprimer ce plat ?", message: "..." })
//   if (!ok) return
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opts) => {
    const options = typeof opts === "string" ? { message: opts } : opts
    setDialog({
      title: options.title || "Confirmer",
      message: options.message || "",
      confirmLabel: options.confirmLabel || "Confirmer",
      cancelLabel: options.cancelLabel || "Annuler",
      danger: options.danger !== false
    })
    return new Promise((resolve) => { resolver.current = resolve })
  }, [])

  const close = (result) => {
    setDialog(null)
    if (resolver.current) { resolver.current(result); resolver.current = null }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60" onClick={() => close(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bgsoft border border-line rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <p className="font-serif text-xl mb-2">{dialog.title}</p>
            {dialog.message && <p className="text-inkdim text-sm mb-6">{dialog.message}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-full text-sm border border-line hover:bg-white/5"
              >
                {dialog.cancelLabel}
              </button>
              <button
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  dialog.danger ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05]"
                }`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm doit etre utilise a l interieur de ConfirmProvider")
  return ctx
}
