import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

const STORAGE_KEY = "lcdc_active_branch"
const BranchContext = createContext(null)

// Fournit la liste des etablissements et l etablissement "actif" choisi
// dans l admin (persiste dans localStorage). Tant qu un seul etablissement
// existe, activeBranchId pointe simplement dessus et aucun selecteur
// n est affiche - ce contexte ne change rien a l usage actuel.
export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([])
  const [activeBranchId, setActiveBranchIdState] = useState(localStorage.getItem(STORAGE_KEY) || null)
  const [loaded, setLoaded] = useState(false)

  const reload = async () => {
    const { data } = await supabase.from("branches").select("*").order("created_at")
    setBranches(data || [])
    setLoaded(true)
    setActiveBranchIdState((current) => {
      if (current && (data || []).some((b) => b.id === current)) return current
      const fallback = data && data.length > 0 ? data[0].id : null
      if (fallback) localStorage.setItem(STORAGE_KEY, fallback)
      return fallback
    })
  }

  useEffect(() => { reload() }, [])

  const setActiveBranchId = (id) => {
    setActiveBranchIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const activeBranch = branches.find((b) => b.id === activeBranchId) || null

  return (
    <BranchContext.Provider value={{ branches, activeBranchId, setActiveBranchId, activeBranch, loaded, reload }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  return useContext(BranchContext)
}
