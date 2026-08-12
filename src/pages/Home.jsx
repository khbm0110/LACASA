import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { motion, useInView } from "framer-motion"
import Reveal from "../components/Reveal.jsx"

const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, l emince de boeuf est particulierement reussi." },
  { id: "r3", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, ambiance conviviale en soiree." },
  { id: "r4", author_name: "Client Google", rating: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
  { id: "r5", author_name: "Client Google", rating: 5, text: "Service tres attentionne, cadre chaleureux le soir." },
  { id: "r6", author_name: "Client Google", rating: 4, text: "Tres bon rapport qualite prix pour le quartier." }
]

const QUICK_LINKS = [
  { to: "/reserver", icon: "fa-solid fa-calendar-check", label: "Reserver", sub: "Votre table" },
  { to: "/livraison", icon: "fa-solid fa-motorcycle", label: "Livraison", sub: "En 20 min" },
  { to: "/menu", icon: "fa-solid fa-utensils", label: "La Carte", sub: "Nos plats" },
  { to: "/a-propos", icon: "fa-solid fa-map-location-dot", label: "Nous trouver", sub: "Rue d'Oran" }
]

function Stars({ rating }) {
  return <span className="text-terracotta text-sm tracking-wide">{"\u2605".repeat(rating)}{"\u2606".repeat(5 - rating)}</span>
}

function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [featured, setFeatured] = useState([])
  const [info, setInfo] = useState(null)
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS)
  const [galleryHome, setGalleryHome] = useState([])
  const [events, setEvents] = useState([])
  const [posts, setPosts] = useState([])
  const [heroDishes, setHeroDishes] = useState([])
  const [activeHero, setActiveHero] = useState(0)

  const [reservation, setReservation] = useState({ name: "", phone: "", date: "", time: "", guests: 2 })
  const [resStatus, setResStatus] = useState("idle")

  useEffect(() => {
    supabase.from("menu_items").select("id, name, price, category, image_url, description").eq("is_featured", true).limit(6).then(({ data }) => { if (data) setFeatured(data) })
    supabase.from("restaurant_info").select("*").eq("id", 1).single().then(({ data }) => { if (data) setInfo(data) })
    supabase.from("google_reviews").select("*").order("time", { ascending: false }).limit(20).then(({ data }) => { if (data?.length) setReviews(data) })
    supabase.from("gallery_images").select("*").eq("show_on_home", true).order("sort_order").limit(6).then(({ data }) => { if (data) setGalleryHome(data) })
    supabase.from("events").select("*").eq("active", true).order("event_date", { ascending: true }).limit(4).then(({ data }) => { if (data) setEvents(data) })
    supabase.from("blog_posts").select("id, slug, title, excerpt, cover_image, published_at").eq("published", true).order("published_at", { ascending: false }).limit(3).then(({ data }) => { if (data) setPosts(data) })
    supabase.from("menu_items").select("id, name, image_url").eq("is_hero", true).limit(6).then(({ data }) => { if (data?.length) setHeroDishes(data.map(d => ({ id: d.id, url: d.image_url, label: d.name }))) })
  }, [])

  const updateReservation = (key) => (e) => setReservation((f) => ({ ...f, [key]: e.target.value }))
  const submitReservation = async (e) => {
    e.preventDefault()
    setResStatus("loading")
    const { error } = await supabase.from("reservations").insert([{ ...reservation, customer_id: user ? user.id : null, status: "pending" }])
    setResStatus(error ? "error" : "success")
  }

  // Hero auto-rotate
  const heroImages = heroDishes.length > 0
    ? heroDishes
    : galleryHome.slice(0, 5).map((g) => ({ id: g.id, url: g.url, label: g.caption }))

  useEffect(() => {
    if (heroImages.length <= 1) return
    const timer = setInterval(() => setActiveHero((i) => (i + 1) % heroImages.length), 5000)
    return () => clearInterval(timer)
  }, [heroImages.length])

  const shownReviews = reviews.slice(0, info?.home_reviews_count || 6)

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="hero-section">
        {/* Background Images */}
        {heroImages.length > 0 ? (
          heroImages.map((img, i) => (
            <div
              key={img.id}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${i === activeHero ? "opacity-100" : "opacity-0"}`}
            >
              <img src={img.url} alt={img.label || ""} className="hero-bg-img" />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sandlight via-cream to-sandlight" />
        )}
        <div className="hero-gradient" />

        {/* Hero Content */}
        <div className="relative z-10 min-h-[100vh] min-h-[100dvh] flex flex-col justify-end pb-20 md:pb-28 section-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl"
          >
            <p className="section-label mb-5">Trattoria & Livraison</p>
            <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-bark mb-6">
              La Casa<br />
              <span className="text-terracotta italic">Di Carta</span>
            </h1>
            <p className="text-barklight text-base md:text-lg max-w-md leading-relaxed mb-10">
              Pizza au feu de bois, specialites italo-marocaines et couscous du vendredi. Un cadre chaleureux au coeur de Rabat.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/reserver" className="btn-primary">
                Reserver une table
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <Link to="/livraison" className="btn-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                Livraison
              </Link>
            </div>
          </motion.div>

          {/* Hero Dots */}
          {heroImages.length > 1 && (
            <div className="flex items-center gap-2 mt-10">
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveHero(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    i === activeHero ? "w-8 bg-terracotta" : "w-1.5 bg-bark/20 hover:bg-bark/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ QUICK LINKS BAR ============ */}
      <section className="relative -mt-10 z-20 section-full">
        <div className="max-w-4xl mx-auto bg-white rounded-organicXl shadow-softXl border border-border/30 p-2 grid grid-cols-2 md:grid-cols-4 gap-1">
          {QUICK_LINKS.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
            >
              <Link to={item.to} className="flex items-center gap-3 p-4 rounded-organic hover:bg-terracotta/5 transition-colors duration-200 group">
                <span className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta group-hover:bg-terracotta group-hover:text-white transition-all duration-300">
                  <i className={`${item.icon} text-sm`} />
                </span>
                <div>
                  <span className="font-semibold text-sm text-bark block">{item.label}</span>
                  <span className="text-xs text-stonelight">{item.sub}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ FEATURED DISHES ============ */}
      {featured.length > 0 && (
        <section className="py-20 md:py-28 section-full">
          <FadeIn className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="section-label mb-3">01 — Notre carte</p>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-bark leading-[0.95]">
                  Saveurs du <span className="text-terracotta italic">moment</span>
                </h2>
              </div>
              <Link to="/menu" className="btn-outline self-start md:self-auto">
                Voir tout le menu
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </FadeIn>

          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((item, i) => (
              <FadeIn key={item.id} delay={i}>
                <Link to="/menu" className="dish-card group block h-full">
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="dish-card-img" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-sandlight to-cream flex items-center justify-center">
                        <span className="font-serif text-4xl text-terracotta/30">{item.name?.[0]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-serif text-xl text-bark leading-tight">{item.name}</h3>
                      <span className="font-semibold text-terracotta whitespace-nowrap">{item.price} MAD</span>
                    </div>
                    <p className="text-barklight text-sm leading-relaxed line-clamp-2 mb-3">
                      {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <span className="text-xs font-medium text-stonelight uppercase tracking-wider">{item.category}</span>
                      <span className="text-xs font-semibold text-terracotta group-hover:translate-x-1 transition-transform duration-200 inline-flex items-center gap-1">
                        Commander <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* ============ REVIEWS ============ */}
      <section className="py-20 md:py-28 bg-creamdark">
        <div className="section-full">
          <FadeIn className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="section-label justify-center mb-3">02 — Avis</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-bark leading-[0.95] mb-4">
                Ce qu'en pensent <span className="text-terracotta italic">nos clients</span>
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="font-serif text-4xl text-bark">{info?.google_rating ?? "4.5"}</span>
                <div className="text-left">
                  <Stars rating={Math.round(info?.google_rating || 4)} />
                  <p className="text-xs text-stonelight mt-0.5">{info?.google_review_count ?? reviews.length} avis Google</p>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {shownReviews.map((r, i) => (
              <FadeIn key={r.id} delay={i}>
                <div className="review-card h-full flex flex-col">
                  <Stars rating={r.rating} />
                  <p className="text-bark text-sm leading-relaxed mt-4 mb-5 flex-1 italic">
                    &quot;{r.text}&quot;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <span className="w-8 h-8 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta font-serif font-bold text-sm">
                      {r.author_name?.[0] || "?"}
                    </span>
                    <span className="font-medium text-sm text-bark">{r.author_name}</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      {galleryHome.length > 0 && (
        <section className="py-20 md:py-28 section-full">
          <FadeIn className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="section-label mb-3">03 — Ambiance</p>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-bark leading-[0.95]">
                  Un apercu <span className="text-terracotta italic">en images</span>
                </h2>
              </div>
              <Link to="/galerie" className="btn-outline self-start md:self-auto">
                Toute la galerie
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </FadeIn>

          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
            {galleryHome.map((img, i) => (
              <FadeIn key={img.id} delay={i % 3}>
                <div className={`gallery-item ${i === 0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-[4/5]"}`}>
                  <img src={img.url} alt={img.caption || ""} loading="lazy" />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* ============ EVENTS ============ */}
      {events.length > 0 && (
        <section className="py-20 md:py-28 bg-creamdark">
          <div className="section-full">
            <FadeIn className="max-w-6xl mx-auto mb-12">
              <p className="section-label mb-3">04 — Evenements</p>
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-bark leading-[0.95]">
                A ne pas <span className="text-terracotta italic">manquer</span>
              </h2>
            </FadeIn>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
              {events.map((e, i) => (
                <FadeIn key={e.id} delay={i}>
                  <div className="organic-card flex flex-row h-full overflow-hidden">
                    {e.image_url && (
                      <div className="w-36 md:w-44 shrink-0">
                        <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      {e.event_date && !e.is_offer && (
                        <p className="text-xs font-medium text-terracotta mb-1.5">
                          {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        </p>
                      )}
                      {e.is_offer && <p className="text-xs font-medium text-olive mb-1.5">Offre permanente</p>}
                      <h3 className="font-serif text-lg text-bark mb-1.5">{e.title}</h3>
                      <p className="text-barklight text-sm leading-relaxed line-clamp-2">{e.description}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ BLOG ============ */}
      {posts.length > 0 && (
        <section className="py-20 md:py-28 section-full">
          <FadeIn className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="section-label mb-3">05 — Actualites</p>
                <h2 className="font-serif text-4xl md:text-5xl text-bark leading-[0.95]">
                  Notre <span className="text-terracotta italic">blog</span>
                </h2>
              </div>
              <Link to="/blog" className="btn-outline self-start md:self-auto">
                Tous les articles
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </FadeIn>

          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map((p, i) => (
              <FadeIn key={p.id} delay={i}>
                <Link to={`/blog/${p.slug}`} className="organic-card group overflow-hidden block h-full">
                  {p.cover_image && (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs text-terracotta font-medium mb-2">
                      {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                    </p>
                    <h3 className="font-serif text-lg text-bark mb-2 leading-tight">{p.title}</h3>
                    <p className="text-barklight text-sm line-clamp-2">{p.excerpt}</p>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* ============ RESERVATION SECTION ============ */}
      <section className="py-20 md:py-28 bg-creamdark">
        <div className="section-full">
          <FadeIn className="max-w-6xl mx-auto mb-12 text-center">
            <p className="section-label justify-center mb-3">06 — Reservation</p>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-bark leading-[0.95]">
              Reservez. <span className="text-terracotta italic">Venez gouter.</span>
            </h2>
          </FadeIn>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <FadeIn className="lg:col-span-3">
              <div className="bg-white rounded-organicXl shadow-softLg p-8 md:p-10">
                <h3 className="font-serif text-2xl text-bark mb-1">Reservez votre table</h3>
                <p className="text-barklight text-sm mb-8">Confirmation par telephone. Aucune avance requise.</p>

                {resStatus === "success" ? (
                  <div className="flex items-center gap-4 p-5 bg-olive/10 rounded-organic border border-olive/20">
                    <span className="w-10 h-10 rounded-full bg-olive flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </span>
                    <div>
                      <p className="font-semibold text-bark">Demande recue</p>
                      <p className="text-barklight text-xs">Nous vous appelons pour confirmer.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitReservation} className="flex flex-col gap-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-barklight mb-1.5">Nom complet</label>
                        <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")} className="form-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-barklight mb-1.5">Telephone</label>
                        <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")} className="form-field" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-barklight mb-1.5">Date</label>
                        <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")} className="form-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-barklight mb-1.5">Heure</label>
                        <input required type="time" value={reservation.time} onChange={updateReservation("time")} className="form-field" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-barklight mb-2">Nombre de convives</label>
                      <div className="flex flex-wrap gap-2">
                        {[2, 4, 6, 8].map((n) => (
                          <button
                            type="button" key={n}
                            onClick={() => setReservation((r) => ({ ...r, guests: n }))}
                            className={`guest-chip ${reservation.guests === n ? "selected" : ""}`}
                          >
                            {n === 8 ? "8+" : n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={resStatus === "loading"}
                      className="btn-primary w-full justify-center py-4 text-base mt-2 disabled:opacity-60"
                    >
                      {resStatus === "loading" ? "Envoi..." : "Reserver ma table"}
                    </button>
                    {resStatus === "error" && <p className="text-xs text-red-500">Verifiez la configuration Supabase.</p>}
                  </form>
                )}
              </div>
            </FadeIn>

            {/* Info Tiles */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <FadeIn delay={1} className="info-tile">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  <h4 className="font-serif text-lg text-bark">Nous trouver</h4>
                </div>
                <p className="text-barklight text-sm mb-2">{info?.address || "Rue d'Oran, Rabat"}</p>
                <p className="text-xs text-stonelight font-medium">RABAT, MAROC</p>
              </FadeIn>

              <FadeIn delay={2} className="info-tile">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  <h4 className="font-serif text-lg text-bark">Ouverture</h4>
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-barklight">Lundi — Dimanche</span>
                  <span className="font-medium text-bark">{info?.hours || "08:00 — 23:00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-barklight">Couscous special</span>
                  <span className="font-semibold text-terracotta">VENDREDI</span>
                </div>
              </FadeIn>

              <FadeIn delay={3} className="info-tile">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <h4 className="font-serif text-lg text-bark">Nous appeler</h4>
                </div>
                <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`} className="text-bark hover:text-terracotta transition-colors font-medium">
                  {info?.phone || "+212 5 37 26 26 58"}
                </a>
                <p className="text-xs text-stonelight mt-1">Prix moyen : {info?.avg_price || "150 - 250 MAD"}</p>
              </FadeIn>

              <FadeIn delay={4} className="map-frame h-48">
                <iframe
                  title="Carte"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                  className="w-full h-full border-0"
                />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
