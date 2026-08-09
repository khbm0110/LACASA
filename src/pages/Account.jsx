import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../lib/AuthContext.jsx"
import { supabase } from "../lib/supabaseClient"

export default function Account() {
  const { user, profile, signIn, signUp, signOut } = useAuth()

  if (user === undefined) return <div className="page-wrap" style={{ maxWidth: 480, textAlign: "center" }}><p className="text-inkdim">Chargement...</p></div>
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
    <section className="page-wrap" style={{ maxWidth: 480 }}>
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Mon compte</span></div>
      <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>{mode === "login" ? "SE CONNECTER." : "CREER UN COMPTE."}</h1>
      <p className="text-inkdim text-sm mb-8">
        Suivez vos commandes, cumulez des points de fidelite, reservez plus vite.
      </p>

      <form onSubmit={submit} className="booking-frame" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {mode === "signup" && (
          <>
            <input placeholder="Nom complet" value={form.name} onChange={update("name")} className="form-input" />
            <input placeholder="Telephone" value={form.phone} onChange={update("phone")} className="form-input" />
          </>
        )}
        <input required type="email" placeholder="Email" value={form.email} onChange={update("email")} className="form-input" />
        <input required type="password" placeholder="Mot de passe" value={form.password} onChange={update("password")} className="form-input" />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          style={{ background: "#D2491F", color: "#000", padding: "1rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", letterSpacing: "0.08em", border: "none", cursor: "pointer", marginTop: "0.25rem" }}
          className="disabled:opacity-60">
          {loading ? "..." : mode === "login" ? "Se connecter" : "Creer mon compte"}
        </button>
      </form>

      <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="link-underline text-sm text-inkdim mt-6">
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
    <section className="page-wrap-lg" style={{ maxWidth: 860 }}>
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="section-marker" style={{ marginBottom: "0.75rem" }}><span>Mon compte</span></div>
          <h1 className="page-title" style={{ margin: 0 }}>{profile?.name || "Mon compte"}</h1>
          <p className="text-inkdim text-sm mt-2">{user.email}</p>
        </div>
        <button onClick={signOut} className="link-underline text-sm text-inkdim">Se deconnecter</button>
      </div>

      <div className="info-card notch-corner p-6 mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-1">Points de fidelite</p>
          <p style={{ fontFamily: "'Bebas Neue', sans-serif" }} className="text-4xl">{profile?.loyalty_points ?? 0} pts</p>
        </div>
        <p className="text-inkdim text-sm max-w-[16ch] text-right">1 point tous les 10 MAD depenses, credites a la livraison.</p>
      </div>

      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Mes commandes</p>
      <div className="grid gap-2 mb-10">
        {orders.map((o) => (
          <Link key={o.id} to={`/suivi/${o.id}`} className="info-card px-4 py-3 flex justify-between text-sm">
            <span>{o.order_type === "dine_in" ? "Sur place" : "Livraison"} - {o.total} MAD</span>
            <span className="text-inkdim">{o.status}</span>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-inkdim text-sm">Aucune commande pour le moment.</p>}
      </div>

      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>Mes reservations</p>
      <div className="grid gap-2">
        {reservations.map((r) => (
          <div key={r.id} className="info-card px-4 py-3 flex justify-between text-sm">
            <span>{r.date} a {r.time} - {r.guests} pers.</span>
            <span className="text-inkdim">{r.status}</span>
          </div>
        ))}
        {reservations.length === 0 && <p className="text-inkdim text-sm">Aucune reservation pour le moment.</p>}
      </div>
    </section>
  )
}
