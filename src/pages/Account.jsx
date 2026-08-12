import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../lib/AuthContext.jsx"
import { supabase } from "../lib/supabaseClient"

export default function Account() {
  const { user, profile, signIn, signUp, signOut } = useAuth()

  if (user === undefined) return <div className="max-w-md mx-auto px-6 py-24 text-inkdim">Chargement...</div>
  if (!user) return <AuthForms signIn={signIn} signUp={signUp} />
  return <Dashboard user={user} profile={profile} signOut={signOut} />
}

function AuthForms({ signIn, signUp }) {
  const [mode, setMode] = useState("login") // 'login' | 'signup'
  const [form, setForm] = useState({ email: "", password: "", name: "", phone: "" })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = mode === "login" ? await signIn(form) : await signUp(form)
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <section className="max-w-md mx-auto px-6 py-24">
      <h1 className="font-serif text-3xl mb-1">{mode === "login" ? "Se connecter" : "Creer un compte"}</h1>
      <p className="text-inkdim text-sm mb-8">
        Suivez vos commandes, cumulez des points de fidelite, reservez plus vite.
      </p>

      <form onSubmit={submit} className="grid gap-3">
        {mode === "signup" && (
          <>
            <input placeholder="Nom complet" value={form.name} onChange={update("name")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
            <input placeholder="Telephone" value={form.phone} onChange={update("phone")}
              className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
          </>
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={update("email")}
          className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
        <input required type="password" placeholder="Mot de passe" value={form.password} onChange={update("password")}
          className="bg-bgsoft border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-tomato" />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button disabled={loading}
          className="mt-2 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#2C1810] disabled:opacity-60">
          {loading ? "..." : mode === "login" ? "Se connecter" : "Creer mon compte"}
        </button>
      </form>

      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-sm text-inkdim mt-6 underline">
        {mode === "login" ? "Pas encore de compte ? Inscrivez-vous" : "Deja un compte ? Connectez-vous"}
      </button>
    </section>
  )
}

function Dashboard({ user, profile, signOut }) {
  const [orders, setOrders] = useState([])
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    async function load() {
      const [{ data: o }, { data: r }] = await Promise.all([
        supabase.from("orders").select("*").eq("customer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reservations").select("*").eq("customer_id", user.id).order("created_at", { ascending: false })
      ])
      setOrders(o || [])
      setReservations(r || [])
    }
    load()
  }, [user.id])

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl">{profile?.name || "Mon compte"}</h1>
          <p className="text-inkdim text-sm">{user.email}</p>
        </div>
        <button onClick={signOut} className="text-sm text-inkdim underline">Se deconnecter</button>
      </div>

      <div className="bg-gradient-to-br from-bgsoft to-[#241b14] border border-line rounded-2xl p-6 mb-10 flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-1">Points de fidelite</p>
          <p className="font-serif text-4xl">{profile?.loyalty_points ?? 0} pts</p>
        </div>
        <p className="text-inkdim text-sm max-w-[16ch] text-right">1 point tous les 10 MAD depenses, credites a la livraison.</p>
      </div>

      <h2 className="font-serif text-xl mb-4">Mes commandes</h2>
      <div className="grid gap-2 mb-10">
        {orders.map((o) => (
          <Link key={o.id} to={`/suivi/${o.id}`} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex justify-between text-sm hover:border-tomato transition">
            <span>{o.order_type === "dine_in" ? "Sur place" : "Livraison"} - {o.total} MAD</span>
            <span className="text-inkdim">{o.status}</span>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-inkdim text-sm">Aucune commande pour le moment.</p>}
      </div>

      <h2 className="font-serif text-xl mb-4">Mes reservations</h2>
      <div className="grid gap-2">
        {reservations.map((r) => (
          <div key={r.id} className="bg-bgsoft border border-line rounded-xl px-4 py-3 flex justify-between text-sm">
            <span>{r.date} a {r.time} - {r.guests} pers.</span>
            <span className="text-inkdim">{r.status}</span>
          </div>
        ))}
        {reservations.length === 0 && <p className="text-inkdim text-sm">Aucune reservation pour le moment.</p>}
      </div>
    </section>
  )
}
