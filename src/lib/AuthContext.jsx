import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

// Contexte d authentification CLIENT (distinct de l espace admin).
// Un client cree un compte pour suivre ses commandes, cumuler des
// points de fidelite et reserver plus vite la prochaine fois.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = chargement, null = deconnecte
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!user) { setProfile(null); return }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(data || null)
    }
    loadProfile()
  }, [user])

  const signUp = async ({ email, password, name, phone }) => {
    return supabase.auth.signUp({ email, password, options: { data: { name, phone } } })
  }
  const signIn = async ({ email, password }) => supabase.auth.signInWithPassword({ email, password })
  const signOut = async () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, profile, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
