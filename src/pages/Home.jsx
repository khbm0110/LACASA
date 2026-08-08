import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import MotionCarousel from "../components/MotionCarousel.jsx"
import Reveal from "../components/Reveal.jsx"

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

  // Reel du hero : fondu automatique entre les photos toutes les 5s, avec
  // une barre de progression (meme logique que le gabarit fourni).
  const [activeFrame, setActiveFrame] = useState(0)
  const [reelProgress, setReelProgress] = useState(0)
  const heroImages = heroDishes.length > 0
    ? heroDishes
    : galleryHome.slice(0, 5).map((g) => ({ id: g.id, url: g.url, label: g.caption }))

  useEffect(() => {
    if (heroImages.length <= 1) return
    const frameDuration = 5000
    let start = performance.now()
    let raf
    function tick(ts) {
      const elapsed = ts - start
      setReelProgress(Math.min((elapsed / frameDuration) * 100, 100))
      if (elapsed >= frameDuration) {
        setActiveFrame((f) => (f + 1) % heroImages.length)
        start = ts
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroImages.length])

  const reviewsCount = info?.home_reviews_count || 6
  const shownReviews = reviews.slice(0, reviewsCount)

  return (
    <>
      {/* HERO — reel plein ecran (photos hero_dishes ou galerie), meme
          structure que le gabarit fourni : fondu entre photos, degrade
          sombre, bandeau CTA + progression en bas */}
      <section className="relative h-screen min-h-[760px] w-full overflow-hidden">
        <div className="absolute inset-0">
          {heroImages.length > 0 ? (
            heroImages.map((img, i) => (
              <div key={img.id} className={`reel-frame ${i === activeFrame ? "active" : ""}`}>
                <img src={img.url} alt={img.label || "La Casa Di Carta"} />
              </div>
            ))
          ) : (
            <div className="absolute inset-0" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }} />
          )}
        </div>
        <div className="hero-overlay" />
        <div className="scan-line" />

        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 lg:px-10 flex flex-col justify-end pb-16 md:pb-20 pt-32">
          {heroImages.length > 1 && (
            <div className="hidden md:flex items-center gap-3 absolute top-28 right-6 lg:right-10 font-mono text-[11px] text-inkdim">
              <span className="rec-dot w-2 h-2 bg-tomato rounded-full inline-block" />
              <span className="tracking-[0.2em]">GALERIE &middot; LIVE</span>
            </div>
          )}

          <div className="max-w-3xl">
            <div className="section-marker mb-6"><span>Trattoria &amp; Livraison</span></div>
            <h1 className="font-serif leading-[0.85] mb-8" style={{ fontSize: "clamp(3.2rem, 8.5vw, 7.5rem)" }}>
              LA CASA<br /><span className="text-tomato">DI CARTA</span>
            </h1>
            <p className="max-w-md text-inkdim text-lg leading-relaxed">
              Pizza au feu de bois, specialites italo-marocaines et couscous du vendredi. Un cadre chaleureux au coeur de Rabat.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/reserver" className="pulse-btn bg-tomato text-black px-8 py-3.5 font-heading text-sm tracking-[0.2em] uppercase flex items-center gap-3 whitespace-nowrap">
                <span>Reserver</span><span>&rarr;</span>
              </Link>
              <Link to="/livraison" className="px-6 py-3.5 font-heading text-xs tracking-[0.2em] uppercase text-inkdim border border-linelight hover:border-tomato hover:text-ink transition flex items-center gap-3 whitespace-nowrap">
                <span>Livraison</span>
              </Link>
            </div>
            {heroImages.length > 1 && (
              <div className="flex items-center gap-6 max-w-xs w-full">
                <div className="font-mono text-[10px] text-muted tracking-[0.2em] whitespace-nowrap">
                  {String(activeFrame + 1).padStart(2, "0")} / {String(heroImages.length).padStart(2, "0")}
                </div>
                <div className="progress-bar flex-1"><div className="progress-bar-fill" style={{ width: `${reelProgress}%` }} /></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dock d acces rapide */}
      <div className="px-6 lg:px-10 -mt-6 relative z-10">
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
        <section className="border-t-0">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="section-marker mb-2"><span>01 — Notre carte</span></div>
              <h2 className="font-serif text-4xl md:text-5xl leading-[0.9]">A la une</h2>
            </div>
            <Link to="/menu" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Voir tout le menu &rarr;
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featured.map((item, i) => (
              <Reveal key={item.id} delay={i * 90}>
                <div className="flip-card h-64 md:h-80"
                  onClick={(e) => {
                    if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped")
                  }}>
                  <div className="flip-card-inner">
                    {/* Face avant : photo + prix */}
                    <div className="flip-face bg-bgsoft border border-line rounded-2xl flex flex-col">
                      {item.image_url ? (
                        <div className="h-36 md:h-56 overflow-hidden rounded-t-2xl">
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-36 md:h-56 flex items-center justify-center rounded-t-2xl" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                          <span className="font-serif text-3xl text-gold/40">{item.name?.[0]}</span>
                        </div>
                      )}
                      <div className="p-3 md:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-inkdim mb-1">{item.category}</p>
                          <h3 className="font-serif text-base md:text-xl leading-tight">{item.name}</h3>
                        </div>
                        <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-line mt-2 md:mt-3">
                          <p className="font-mono text-gold text-sm md:text-base">{item.price} MAD</p>
                          <span className="hidden md:inline font-mono text-[10px] text-inkdim uppercase tracking-widest">Survoler &rarr;</span>
                        </div>
                      </div>
                    </div>
                    {/* Face arriere : description */}
                    <div className="flip-face flip-back bg-bgsoft border border-tomato/50 rounded-2xl p-4 md:p-7 flex flex-col">
                      <p className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gold mb-2 md:mb-3">/ {item.category}</p>
                      <h3 className="font-serif text-lg md:text-2xl mb-2 md:mb-4">{item.name}</h3>
                      <p className="text-inkdim text-xs md:text-sm leading-relaxed flex-1 line-clamp-4 md:line-clamp-none">
                        {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                      </p>
                      <div className="flex items-center justify-between pt-2 md:pt-4 border-t border-line mt-2 md:mt-4">
                        <p className="font-mono text-gold text-sm md:text-lg">{item.price} MAD</p>
                        <Link to="/menu" className="font-mono text-[9px] md:text-[10px] uppercase tracking-widest text-tomatoglow hover:text-gold transition-colors">
                          Voir la carte &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* Avis Google - slider anime, quantite reglable depuis Admin > Contenu */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="section-marker mb-2"><span>02 — Avis</span></div>
            <h2 className="font-serif text-4xl md:text-5xl leading-[0.9]">Ce qu en pensent nos clients</h2>
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
        </div>
      </section>

      {/* Galerie - grille 3 colonnes, apparition progressive au defilement */}
      {galleryHome.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="section-marker mb-2"><span>03 — Ambiance</span></div>
              <h2 className="font-serif text-4xl md:text-5xl leading-[0.9]">Un apercu en images</h2>
            </div>
            <Link to="/galerie" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Toute la galerie &rarr;
            </Link>
          </Reveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {galleryHome.map((img, i) => (
              <Reveal key={img.id} delay={(i % 3) * 100}>
                <div className="rounded-2xl overflow-hidden border border-line aspect-[4/5] group">
                  <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
              </Reveal>
            ))}
          </div>
          </div>
        </section>
      )}

      {/* Evenements & offres - grille 2 colonnes */}
      {events.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="section-marker mb-2"><span>04 — Evenements</span></div>
              <h2 className="font-serif text-4xl md:text-5xl leading-[0.9]">A ne pas manquer</h2>
            </div>
            <Link to="/evenements" className="text-sm text-inkdim hover:text-ink border-b border-transparent hover:border-tomato transition">
              Voir tout &rarr;
            </Link>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-5">
            {events.map((e, i) => (
              <Reveal key={e.id} delay={i * 90}>
                <div className="group bg-bgsoft border border-line rounded-2xl overflow-hidden hover:border-tomato hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col sm:flex-row">
                  {e.image_url && (
                    <div className="sm:w-40 h-40 sm:h-auto shrink-0 overflow-hidden">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
          </div>
        </section>
      )}

      {/* Blog & actualites - grille 3 colonnes */}
      {posts.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <div className="section-marker mb-2"><span>05 — Actualites</span></div>
              <h2 className="font-serif text-4xl md:text-5xl leading-[0.9]">Notre blog</h2>
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
          </div>
        </section>
      )}

      {/* Infos pratiques + carte + reservation rapide */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
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
                      <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")}
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
