import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabaseClient"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    // Authentification via Supabase Auth (email/mot de passe).
    // Creez les comptes admin depuis Supabase > Authentication > Users.
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate("/admin")
  }

  return (
    <div className="min-h-screen bg-bg text-ink flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm bg-bgsoft border border-line rounded-2xl p-8">
        <h1 className="font-serif text-2xl mb-1">Administration</h1>
        <p className="text-inkdim text-sm mb-6">La Casa Di Carta</p>
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 bg-bg border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
        <input required type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 bg-bg border border-line rounded-xl px-4 py-3 outline-none focus:border-tomato" />
        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
        <button className="w-full px-5 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#0E0C0A]">
          Se connecter
        </button>
      </form>
    </div>
  )
}
