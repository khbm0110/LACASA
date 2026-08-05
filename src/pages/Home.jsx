import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import MotionCarousel from "../components/MotionCarousel.jsx"
import Reveal from "../components/Reveal.jsx"
import HeroDishRotator from "../components/HeroDishRotator.jsx"

const DOCK = [
  { to: "/reserver", icon: "book" },
  { to: "/livraison", icon: "delivery" },
  { to: "/menu", icon: "menu" },
  { to: "/a-propos", icon: "directions" }
]

// Avis affiches tant que la table google_reviews (alimentee par la
// synchronisation Google Places, voir supabase/functions) n est pas
// encore remplie - a remplacer par vos vrais avis.
const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, l emince de boeuf est particulierement reussi." },
  { id: "r3", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, ambiance conviviale en soiree." },
  { id: "r4", author_name: "Client Google", rating: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
  { id: "r5", author_name: "Client Google", rating: 5, text: "Service tres attentionne, cadre chaleureux le soir." },
  { id: "r6", author_name: "Client Google", rating: 4, text: "Tres bon rapport qualite prix pour le quartier." }
]

export default function Home() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const cardRef = useRef(null)
  const [featured, setFeatured] = useState([])
  const [heroDishes, setHeroDishes] = useState([])
  const [info, setInfo] = useState(null)
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS)
  const [galleryHome, setGalleryHome] = useState([])
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [reservation, setReservation] = useState({ name: "", phone: "", date: "", time: "", guests: 2 })
  const [resStatus, setResStatus] = useState(null)

  useEffect(() => {
    // Charge quelques plats mis en avant depuis Supabase (table menu_items,
    // colonne is_featured = true). Si Supabase n est pas configure,
    // la liste reste vide sans faire planter la page.
    async function loadFeatured() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, category, image_url, description")
        .eq("is_featured", true)
        .limit(6)
      if (!error && data) setFeatured(data)
    }
    // Infos pratiques (adresse, telephone, horaires, note Google, reglages accueil)
    async function loadInfo() {
      const { data } = await supabase.from("restaurant_info").select("*").eq("id", 1).single()
      if (data) setInfo(data)
    }
    // Avis Google reels : voir supabase/functions/sync-google-reviews
    // Cette fonction (a deployer sur Supabase Edge Functions) appelle l API
    // Google Places avec votre cle secrete et ecrit le resultat dans la
    // table "google_reviews", que l on relit ici cote client (aucune cle
    // API n est jamais exposee au navigateur). On recupere large (20) puis
    // on limite a l affichage selon le reglage "home_reviews_count".
    async function loadReviews() {
      const { data } = await supabase.from("google_reviews").select("*").order("time", { ascending: false }).limit(20)
      if (data && data.length > 0) setReviews(data)
    }
    // Photos de galerie choisies par l administrateur pour l accueil
    async function loadGalleryHome() {
      const { data } = await supabase.from("gallery_images").select("*").eq("show_on_home", true).order("sort_order").limit(10)
      if (data) setGalleryHome(data)
    }
    // Evenements & offres actifs
    async function loadEvents() {
      const { data } = await supabase.from("events").select("*").eq("active", true).order("event_date", { ascending: true }).limit(4)
      if (data) setEvents(data)
    }
    // Derniers articles publies
    async function loadPosts() {
      const { data } = await supabase.from("blog_posts").select("*").eq("published", true).order("published_at", { ascending: false }).limit(3)
      if (data) setPosts(data)
    }
    // Photo(s) du visuel principal (accueil), choisies par la cuisine
    // depuis Admin > Contenu du site.
    async function loadHeroDishes() {
      const { data } = await supabase.from("hero_dishes").select("*").order("sort_order")
      if (data) setHeroDishes(data)
    }
    loadFeatured()
    loadInfo()
    loadReviews()
    loadGalleryHome()
    loadEvents()
    loadPosts()
    loadHeroDishes()
  }, [])

  const updateReservation = (key) => (e) => setReservation((f) => ({ ...f, [key]: e.target.value }))

  const submitReservation = async (e) => {
    e.preventDefault()
    setResStatus("loading")
    const { error } = await supabase.from("reservations").insert([{ ...reservation, customer_id: user ? user.id : null, status: "pending" }])
    setResStatus(error ? "error" : "success")
  }

  const handleTilt = (e) => {
    const card = cardRef.current
    if (!card) return
    const r = card.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    card.style.transform = `rotateX(${(-y * 14 + 6).toFixed(2)}deg) rotateY(${(x * 18 - 10).toFixed(2)}deg)`
  }
  const resetTilt = () => {
    if (cardRef.current) cardRef.current.style.transform = "rotateX(6deg) rotateY(-10deg)"
  }

  const reviewsCount = info?.home_reviews_count || 6
  const shownReviews = reviews.slice(0, reviewsCount)

  return (
    <>
      <section className="relative min-h-screen flex items-center px-6 md:px-8 pt-24 pb-10" style={{ perspective: "1400px" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold mb-4">
              {t("hero.eyebrow")}
            </p>
            <h1 className="font-serif font-semibold text-5xl md:text-7xl leading-none">
              {t("hero.title_pre")}
              <em className="italic text-tomatoglow font-medium">{t("hero.title_em")}</em>
              {t("hero.title_post")}
            </h1>
            <p className="mt-6 text-inkdim text-lg font-light max-w-md">{t("hero.lede")}</p>

            <div className="flex gap-4 mt-9 flex-wrap">
              <Link
                to="/reserver"
                className="px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] shadow-lg shadow-tomato/30 hover:-translate-y-1 transition"
              >
                {t("hero.cta_book")}
              </Link>
              <Link
                to="/livraison"
                className="px-6 py-3.5 rounded-full text-sm font-semibold border border-line hover:bg-white/5 hover:-translate-y-1 transition"
              >
                {t("hero.cta_delivery")}
              </Link>
            </div>
          </div>

          <div
            ref={cardRef}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
            className="relative rounded-[28px] h-[420px] border border-line overflow-hidden shadow-2xl transition-transform duration-150"
            style={{
              background: "linear-gradient(155deg,#2A1810,#1A1210 60%)",
              transform: "rotateX(6deg) rotateY(-10deg)",
              transformStyle: "preserve-3d"
            }}
          >
            {heroDishes.length > 0 ? (
              <HeroDishRotator images={heroDishes} />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-64 h-64 rounded-full shadow-2xl"
                    style={{
                      background: "conic-gradient(from 200deg, #D2491F, #D4A84B, #7C9A5C, #D2491F)",
                      transform: "translateZ(60px)",
                      animation: "spin 22s linear infinite"
                    }}
                  />
                </div>
                <div
                  className="absolute top-6 left-6 font-mono text-xs rounded-xl border border-line px-4 py-3 backdrop-blur"
                  style={{ background: "rgba(20,18,16,0.75)", transform: "translateZ(90px)" }}
                >
                  Specialite
                  <b className="block font-serif text-lg font-semibold text-gold">Pizza al Forno</b>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Dock d acces rapide */}
      <div className="px-6 md:px-8 -mt-6 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 bg-bgsoft border border-line rounded-3xl p-3">
          {DOCK.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col gap-1.5 p-4 rounded-2xl hover:bg-white/5 hover:-translate-y-0.5 transition"
            >
              <b className="text-sm font-semibold">{t(`dock.${item.icon}`)}</b>
              <span className="text-xs text-inkdim">{t(`dock.${item.icon}_sub`)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Menu - selection mise en avant, cartes retournables */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-px bg-gold" />
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold">Notre carte</p>
              </div>
              <h2 className="font-serif text-3xl">A la une</h2>
            </div>
            <Link to="/menu" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Voir tout le menu &rarr;
            </Link>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {featured.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <div className="flip-card h-80"
                  onClick={(e) => {
                    if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped")
                  }}>
                  <div className="flip-card-inner">
                    {/* Face avant : photo + prix */}
                    <div className="flip-face bg-bgsoft border border-line rounded-2xl flex flex-col">
                      {item.image_url ? (
                        <div className="h-56 overflow-hidden rounded-t-2xl">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-56 flex items-center justify-center rounded-t-2xl" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                          <span className="font-serif text-3xl text-gold/40">{item.name?.[0]}</span>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-inkdim mb-1">{item.category}</p>
                          <h3 className="font-serif text-xl">{item.name}</h3>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-line mt-3">
                          <p className="font-mono text-gold">{item.price} MAD</p>
                          <span className="font-mono text-[10px] text-inkdim uppercase tracking-widest">Survoler &rarr;</span>
                        </div>
                      </div>
                    </div>
                    {/* Face arriere : description */}
                    <div className="flip-face flip-back bg-bgsoft border border-tomato/50 rounded-2xl p-7 flex flex-col">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-3">/ {item.category}</p>
                      <h3 className="font-serif text-2xl mb-4">{item.name}</h3>
                      <p className="text-inkdim text-sm leading-relaxed flex-1">
                        {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-line mt-4">
                        <p className="font-mono text-gold text-lg">{item.price} MAD</p>
                        <Link to="/menu" className="font-mono text-[10px] uppercase tracking-widest text-tomatoglow hover:text-gold transition-colors">
                          Voir la carte &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Avis Google - slider anime, quantite reglable depuis Admin > Contenu */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Avis Google</p>
            <h2 className="font-serif text-3xl">Ce qu en pensent nos clients</h2>
          </div>
          {info && (
            <div className="flex items-center gap-3">
              <span className="font-serif text-4xl">{info.google_rating}</span>
              <div>
                <p className="text-gold text-sm">{"* ".repeat(Math.round(info.google_rating || 0))}</p>
                <p className="text-inkdim text-xs">{info.google_review_count} avis</p>
              </div>
            </div>
          )}
        </Reveal>
        <MotionCarousel
          items={shownReviews}
          renderItem={(r) => (
            <div className="bg-bgsoft border border-line rounded-2xl p-5 h-full flex flex-col">
              <p className="text-gold text-sm mb-2">{"* ".repeat(r.rating)}</p>
              <p className="text-sm text-inkdim flex-1">{r.text}</p>
              <p className="text-xs text-inkdim mt-3 opacity-70">{r.author_name}</p>
            </div>
          )}
        />
      </section>

      {/* Galerie - slider anime, photos choisies par l administrateur */}
      {galleryHome.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Ambiance</p>
              <h2 className="font-serif text-3xl">Un apercu en images</h2>
            </div>
            <Link to="/galerie" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Toute la galerie &rarr;
            </Link>
          </Reveal>
          <MotionCarousel
            items={galleryHome}
            renderItem={(img) => (
              <div className="rounded-2xl overflow-hidden border border-line aspect-[4/5] group">
                <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
            )}
          />
        </section>
      )}

      {/* Evenements & offres - grille 2 colonnes */}
      {events.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">A ne pas manquer</p>
              <h2 className="font-serif text-3xl">Evenements & offres</h2>
            </div>
            <Link to="/evenements" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Voir tout &rarr;
            </Link>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={i * 90}>
                <div className="bg-bgsoft border border-line rounded-2xl overflow-hidden hover:border-tomato transition h-full flex flex-col sm:flex-row">
                  {e.image_url && (
                    <div className="sm:w-40 h-40 sm:h-auto shrink-0 overflow-hidden">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    {e.event_date && !e.is_offer && (
                      <p className="font-mono text-xs text-gold mb-2">
                        {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    )}
                    {e.is_offer && <p className="font-mono text-xs text-basil mb-2">Offre permanente</p>}
                    <h3 className="font-serif text-xl mb-1">{e.title}</h3>
                    <p className="text-inkdim text-sm">{e.description}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Blog & actualites - grille 3 colonnes */}
      {posts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Actualites</p>
              <h2 className="font-serif text-3xl">Blog</h2>
            </div>
            <Link to="/blog" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Tous les articles &rarr;
            </Link>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {posts.map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <Link to={`/blog/${p.slug}`} className="group block bg-bgsoft border border-line rounded-2xl overflow-hidden hover:border-tomato hover:-translate-y-1.5 transition-all duration-300 h-full">
                  {p.cover_image && (
                    <div className="h-36 overflow-hidden">
                      <img src={p.cover_image} alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-mono text-xs text-gold mb-2">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                    </p>
                    <h3 className="font-serif text-lg mb-1">{p.title}</h3>
                    <p className="text-inkdim text-sm line-clamp-2">{p.excerpt}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Infos pratiques + carte + reservation rapide */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 mt-20">
        <Reveal>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-7 h-px bg-gold" />
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-gold">Venez nous voir</p>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] mb-12">
            Horaires, adresse<br className="hidden md:block" /> & reservation rapide
          </h2>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Formulaire de reservation */}
          <Reveal delay={0} className="lg:col-span-7">
            <div className="frame-corners bg-bgsoft border border-line rounded-2xl p-7 md:p-10 h-full">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-gold mb-2">// Reservation rapide</p>
              <h3 className="font-serif text-2xl md:text-3xl mb-2">Reservez votre table</h3>
              <p className="text-inkdim text-sm mb-8">Confirmation par telephone. Aucune avance requise.</p>

              {resStatus === "success" ? (
                <p className="text-sm text-inkdim">Demande recue ! Nous vous appelons pour confirmer.</p>
              ) : (
                <form onSubmit={submitReservation} className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field label="Nom">
                      <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")}
                        className="form-underline" />
                    </Field>
                    <Field label="Telephone">
                      <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")}
                        className="form-underline" />
                    </Field>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Field label="Date">
                      <input required type="date" value={reservation.date} onChange={updateReservation("date")}
                        className="form-underline" />
                    </Field>
                    <Field label="Heure">
                      <input required type="time" value={reservation.time} onChange={updateReservation("time")}
                        className="form-underline" />
                    </Field>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-inkdim mb-3">Convives</p>
                    <div className="flex flex-wrap gap-2">
                      {[2, 4, 6, 8].map((n) => (
                        <button type="button" key={n}
                          onClick={() => setReservation((r) => ({ ...r, guests: n }))}
                          className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-widest border transition-colors ${
                            reservation.guests === n
                              ? "bg-tomato border-tomato text-[#1a0d05] font-semibold"
                              : "border-line text-inkdim hover:border-gold hover:text-paper"
                          }`}>
                          {n === 8 ? "8+" : n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button disabled={resStatus === "loading"}
                    className="mt-1 px-6 py-3.5 rounded-full text-sm font-semibold bg-gradient-to-br from-tomatoglow to-tomato text-[#1a0d05] disabled:opacity-60">
                    {resStatus === "loading" ? "Envoi..." : "Reserver ma table"}
                  </button>
                  {resStatus === "error" && <p className="text-xs text-red-400">Verifiez la configuration Supabase.</p>}
                </form>
              )}
            </div>
          </Reveal>

          {/* Infos pratiques + carte, dans la meme ligne que le formulaire */}
          <div className="lg:col-span-5 grid gap-4">
            <Reveal delay={120}>
              <div className="grid sm:grid-cols-2 gap-4">
                <InfoCard label="/ Adresse" title="Nous trouver">
                  <p className="text-inkdim text-sm leading-relaxed">{info?.address || "Rue d'Oran, Rabat"}</p>
                </InfoCard>
                <InfoCard label="/ Horaires" title="Ouverture">
                  <p className="text-inkdim text-sm leading-relaxed">{info?.hours || "Tous les jours, 8h - 23h"}</p>
                </InfoCard>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <InfoCard label="/ Contact" title="Nous appeler">
                <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`}
                  className="block text-paper text-sm font-medium hover:text-tomatoglow transition-colors">
                  {info?.phone || "+212 5 37 26 26 58"}
                </a>
                <p className="text-inkdim text-xs mt-2">Prix moyen : {info?.avg_price || "150 - 250 MAD"}</p>
              </InfoCard>
            </Reveal>

            <Reveal delay={200} className="frame-corners rounded-2xl overflow-hidden border border-line flex-1">
              <iframe
                title="Carte"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                className="w-full h-full min-h-[160px] border-0"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <style>{`@keyframes spin { from { transform: translateZ(60px) rotate(0deg); } to { transform: translateZ(60px) rotate(360deg); } }`}</style>
    </>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-inkdim">{label}</span>
      {children}
    </label>
  )
}

function InfoCard({ label, title, children }) {
  return (
    <div className="frame-corners bg-bgsoft border border-line rounded-2xl p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold mb-2">{label}</p>
      <h4 className="font-serif text-xl mb-3">{title}</h4>
      {children}
    </div>
  )
}
