import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import MotionCarousel from "../components/MotionCarousel.jsx"
import Reveal from "../components/Reveal.jsx"

const DOCK = [
  { to: "/reserver", icon: "fa-utensils", title: "Reserver", sub: "Table rapide" },
  { to: "/livraison", icon: "fa-motorcycle", title: "Livraison", sub: "En 20 min" },
  { to: "/menu", icon: "fa-book-open", title: "Notre carte", sub: "Pizzas & plats" },
  { to: "/a-propos", icon: "fa-location-dot", title: "Nous trouver", sub: "Rue d'Oran" }
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

function Stars({ rating }) {
  return <>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</>
}

export default function Home() {
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
    async function loadFeatured() {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, price, category, image_url, description")
        .eq("is_featured", true)
        .limit(6)
      if (!error && data) setFeatured(data)
    }
    async function loadInfo() {
      const { data } = await supabase.from("restaurant_info").select("*").eq("id", 1).single()
      if (data) setInfo(data)
    }
    async function loadReviews() {
      const { data } = await supabase.from("google_reviews").select("*").order("time", { ascending: false }).limit(20)
      if (data && data.length > 0) setReviews(data)
    }
    async function loadGalleryHome() {
      const { data } = await supabase.from("gallery_images").select("*").eq("show_on_home", true).order("sort_order").limit(6)
      if (data) setGalleryHome(data)
    }
    async function loadEvents() {
      const { data } = await supabase.from("events").select("*").eq("active", true).order("event_date", { ascending: true }).limit(4)
      if (data) setEvents(data)
    }
    async function loadPosts() {
      const { data } = await supabase.from("blog_posts").select("*").eq("published", true).order("published_at", { ascending: false }).limit(3)
      if (data) setPosts(data)
    }
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
      {/* ============ HERO ============ */}
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
            <h1 className="font-serif leading-[0.85] mb-8 text-[14vw] md:text-[10vw] lg:text-[8.5vw]">
              LA CASA<br /><span className="text-tomato">DI CARTA</span>
            </h1>
            <p className="max-w-md text-inkdim text-lg leading-relaxed">
              Pizza au feu de bois, specialites italo-marocaines et couscous du vendredi. Un cadre chaleureux au coeur de Rabat.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-end justify-between gap-8">
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/reserver" className="pulse-btn bg-tomato text-black px-8 py-3.5 font-heading text-sm tracking-[0.2em] uppercase flex items-center gap-3 whitespace-nowrap">
                <span>Reserver</span><i className="fas fa-arrow-right text-xs" />
              </Link>
              <Link to="/livraison" className="px-6 py-3.5 font-heading text-xs tracking-[0.2em] uppercase text-inkdim border border-linelight hover:border-tomato hover:text-ink transition flex items-center gap-3 whitespace-nowrap">
                <span>Livraison</span><i className="fas fa-motorcycle text-xs text-tomato" />
              </Link>
            </div>
            {heroImages.length > 1 && (
              <div className="flex items-center gap-6 max-w-xs w-full">
                <div className="font-mono text-[10px] text-muted tracking-[0.2em] whitespace-nowrap">
                  {String(activeFrame + 1).padStart(2, "0")} / {String(heroImages.length).padStart(2, "0")}
                </div>
                <div className="progress-bar flex-1"><div className="progress-bar-fill" style={{ width: `${reelProgress}%` }} /></div>
                <div className="font-mono text-[10px] text-tomato tracking-[0.2em] whitespace-nowrap">GALERIE</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ QUICK DOCK ============ */}
      <div className="px-6 lg:px-10 relative z-10 -mt-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 bg-bgsoft border border-line rounded-sm p-3">
          {DOCK.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center gap-4 p-4 hover:bg-white/5 transition rounded-sm">
              <div className="w-10 h-10 border border-linelight flex items-center justify-center shrink-0">
                <i className={`fas ${item.icon} text-sm`} />
              </div>
              <div>
                <b className="font-heading text-sm tracking-[0.1em] block">{item.title}</b>
                <span className="font-mono text-xs text-muted">{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ============ A LA UNE ============ */}
      {featured.length > 0 && (
        <section>
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-28">
            <Reveal className="grid md:grid-cols-12 gap-8 mb-12 items-end">
              <div className="md:col-span-7">
                <div className="section-marker mb-6"><span>01 — Notre carte</span></div>
                <h2 className="font-serif text-5xl md:text-6xl leading-[0.9]">
                  A la une. <span className="text-stroke">Saveurs</span> du <span className="text-tomato">moment.</span>
                </h2>
              </div>
              <div className="md:col-span-4 md:col-start-9">
                <p className="text-inkdim mb-6">Nos plats signatures, prepares avec des ingredients frais et de saison. Chaque assiette raconte une histoire entre tradition italienne et heritage marocain.</p>
                <Link to="/menu" className="font-heading link-underline text-sm tracking-[0.15em] uppercase text-inkdim flex items-center justify-between">
                  <span>Voir tout le menu</span><i className="fas fa-arrow-right text-tomato" />
                </Link>
              </div>
            </Reveal>

            {/* 3 premiers plats : carte statique (survol = zoom + elevation) */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {featured.slice(0, 3).map((item, i) => (
                <Reveal key={item.id} delay={i * 90}>
                  <article className="program-card info-card notch-corner h-full flex flex-col">
                    <div className="relative h-36 md:h-72 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="program-img w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                          <span className="font-serif text-3xl text-gold/40">{item.name?.[0]}</span>
                        </div>
                      )}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #141414, transparent)" }} />
                      <div className="absolute top-3 md:top-4 left-3 md:left-4 font-mono text-[10px] text-tomato tracking-[0.2em]">/ {String(i + 1).padStart(2, "0")}</div>
                      <div className="absolute top-3 md:top-4 right-3 md:right-4 px-2 py-1 bg-black/60 backdrop-blur-sm font-mono text-[10px] text-ink tracking-[0.15em]">{item.category}</div>
                    </div>
                    <div className="p-3 md:p-6 flex-1 flex flex-col">
                      <div className="mb-2 md:mb-4">
                        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-2 md:mb-4">
                          <div>
                            <div className="font-mono text-[9px] md:text-[10px] text-muted tracking-[0.2em] uppercase">Prix</div>
                            <div className="font-heading text-xs md:text-base">{item.price} MAD</div>
                          </div>
                          <div>
                            <div className="font-mono text-[9px] md:text-[10px] text-muted tracking-[0.2em] uppercase">Categorie</div>
                            <div className="font-heading text-xs md:text-base truncate">{item.category}</div>
                          </div>
                        </div>
                        <p className="hidden md:block text-inkdim text-sm leading-relaxed line-clamp-3">
                          {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 md:pt-4 border-t border-linelight">
                        <span className="hidden md:inline font-mono text-[10px] text-muted tracking-[0.15em]">SUR COMMANDE</span>
                        <Link to="/menu" className="font-heading text-xs md:text-sm tracking-[0.15em] uppercase flex items-center gap-2">
                          Commander <i className="fas fa-arrow-right text-tomato text-xs" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* Plats suivants : cartes retournables */}
            {featured.length > 3 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
                {featured.slice(3).map((item, i) => (
                  <Reveal key={item.id} delay={i * 90}>
                    <div className="flip-card h-64 md:h-[420px]"
                      onClick={(e) => { if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped") }}>
                      <div className="flip-card-inner">
                        <div className="flip-face info-card flex flex-col">
                          <div className="dish-img-wrap">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(155deg,#2A1810,#1A1210 60%)" }}>
                                <span className="font-serif text-2xl text-gold/40">{item.name?.[0]}</span>
                              </div>
                            )}
                            <div className="absolute top-3 md:top-4 left-3 md:left-4 font-mono text-[10px] text-tomato tracking-[0.2em]">/ {String(i + 4).padStart(2, "0")}</div>
                            <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                              <div className="font-mono text-[10px] text-silverdim tracking-[0.2em] uppercase">{item.category}</div>
                            </div>
                          </div>
                          <div className="p-3 md:p-6 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-serif text-lg md:text-3xl leading-tight">{item.name}</h3>
                              <p className="font-heading text-muted text-[10px] md:text-xs mt-1 md:mt-2 tracking-[0.1em] uppercase">{item.category}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2 md:mt-4 pt-2 md:pt-4 border-t border-linelight">
                              <span className="font-mono text-[10px] text-muted tracking-[0.15em]">{item.price} MAD</span>
                              <span className="hidden md:inline font-mono text-[10px] text-tomato tracking-[0.15em]">SURVOLER &rarr;</span>
                            </div>
                          </div>
                        </div>
                        <div className="flip-face flip-back info-card p-4 md:p-7 flex flex-col">
                          <div className="font-mono text-[10px] text-tomato tracking-[0.2em] uppercase mb-2 md:mb-4">/ {item.name}</div>
                          <h3 className="font-serif text-lg md:text-2xl mb-2 md:mb-5">Description</h3>
                          <p className="text-inkdim text-xs md:text-sm leading-relaxed flex-1 line-clamp-4 md:line-clamp-none">
                            {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                          </p>
                          <div className="mt-auto pt-2 md:pt-5 border-t border-linelight">
                            <div className="flex items-center justify-between">
                              <div className="font-serif text-lg md:text-2xl text-tomato">{item.price} MAD</div>
                              <Link to="/menu" className="font-mono text-[10px] tracking-[0.15em] uppercase text-tomato">Commander &rarr;</Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ AVIS (carrousel) ============ */}
      <section className="border-t border-line overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-10 lg:mb-16 pt-14 lg:pt-28">
          <Reveal className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-7">
              <div className="section-marker mb-6"><span>02 — Avis</span></div>
              <h2 className="font-serif text-5xl md:text-6xl leading-[0.9]">Ce qu en pensent <span className="text-tomato">nos clients.</span></h2>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <div className="flex items-center gap-4 mb-3">
                <span className="font-serif text-5xl">{info?.google_rating ?? "4.5"}</span>
                <div>
                  <p className="text-gold text-sm"><Stars rating={Math.round(info?.google_rating || 4)} /></p>
                  <p className="font-mono text-muted text-xs">{info?.google_review_count ?? shownReviews.length} avis Google</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-muted tracking-[0.2em] uppercase">
                <i className="fas fa-hand-pointer text-tomato" />
                <span>Glisser &middot; Avancer automatique</span>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="pb-14 lg:pb-28">
          <MotionCarousel
            items={shownReviews}
            renderItem={(r, i) => (
              <div className="story-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-2xl">{r.author_name}</h3>
                  <span className="font-mono text-[10px] text-muted tracking-[0.15em] whitespace-nowrap">AVIS / {String(i + 1).padStart(2, "0")}</span>
                </div>
                <p className="text-gold text-sm mb-3"><Stars rating={r.rating} /></p>
                <p className="text-inkdim text-sm leading-relaxed mb-5 italic">&quot;{r.text}&quot;</p>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-linelight">
                  <div>
                    <div className="font-serif text-xl text-tomato">{r.rating}/5</div>
                    <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase">Note</div>
                  </div>
                  <div>
                    <div className="font-serif text-xl">Google</div>
                    <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase">Source</div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </section>

      {/* ============ GALERIE ============ */}
      {galleryHome.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-28">
            <Reveal className="grid md:grid-cols-12 gap-8 mb-10 lg:mb-16 items-end">
              <div className="md:col-span-7">
                <div className="section-marker mb-6"><span>03 — Ambiance</span></div>
                <h2 className="font-serif text-5xl md:text-6xl leading-[0.9]">Un apercu <span className="text-stroke">en images.</span></h2>
              </div>
              <div className="md:col-span-4 md:col-start-9">
                <p className="text-inkdim mb-6">Decouvrez l atmosphere unique de La Casa Di Carta. Un cadre chaleureux ou chaque repas devient un moment d exception.</p>
                <Link to="/galerie" className="font-heading link-underline text-sm tracking-[0.15em] uppercase text-inkdim flex items-center justify-between">
                  <span>Toute la galerie</span><i className="fas fa-arrow-right text-tomato" />
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryHome.map((img, i) => (
                <Reveal key={img.id} delay={(i % 3) * 100}>
                  <div className="info-card overflow-hidden aspect-[4/5] group">
                    <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ EVENEMENTS ============ */}
      {events.length > 0 && (
        <section className="border-t border-line" style={{ background: "#050505" }}>
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-28">
            <Reveal className="mb-10 lg:mb-16">
              <div className="section-marker mb-6"><span>04 — Evenements</span></div>
              <h2 className="font-serif text-5xl md:text-6xl leading-[0.9]">A ne pas <span className="text-tomato">manquer.</span></h2>
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((e, i) => (
                <Reveal key={e.id} delay={i * 90}>
                  <div className="info-card overflow-hidden flex flex-row h-full group">
                    {e.image_url && (
                      <div className="w-32 md:w-48 shrink-0 overflow-hidden">
                        <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-4 md:p-6 flex-1">
                      {e.event_date && !e.is_offer && (
                        <p className="font-mono text-xs text-tomato mb-2">
                          {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        </p>
                      )}
                      {e.is_offer && <p className="font-mono text-xs text-basil mb-2">Offre permanente</p>}
                      <h3 className="font-serif text-xl md:text-2xl mb-2">{e.title}</h3>
                      <p className="text-inkdim text-sm leading-relaxed">{e.description}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ BLOG ============ */}
      {posts.length > 0 && (
        <section className="border-t border-line">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-28">
            <Reveal className="grid md:grid-cols-12 gap-8 mb-10 lg:mb-16 items-end">
              <div className="md:col-span-7">
                <div className="section-marker mb-6"><span>05 — Actualites</span></div>
                <h2 className="font-serif text-5xl md:text-6xl leading-[0.9]">Notre <span className="text-stroke">blog.</span></h2>
              </div>
              <div className="md:col-span-4 md:col-start-9">
                <Link to="/blog" className="font-heading link-underline text-sm tracking-[0.15em] uppercase text-inkdim flex items-center justify-between">
                  <span>Tous les articles</span><i className="fas fa-arrow-right text-tomato" />
                </Link>
              </div>
            </Reveal>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <Link to={`/blog/${p.slug}`} className="info-card block overflow-hidden group h-full">
                    {p.cover_image && (
                      <div className="h-48 overflow-hidden">
                        <img src={p.cover_image} alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="font-mono text-xs text-tomato mb-2">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                      </p>
                      <h3 className="font-serif text-2xl mb-2">{p.title}</h3>
                      <p className="text-inkdim text-sm line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ RESERVATION & INFOS ============ */}
      <section className="border-t border-line" style={{ background: "#050505" }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-14 lg:py-28">
          <Reveal className="mb-10 lg:mb-16">
            <div className="section-marker mb-6"><span>06 — Reservation</span></div>
            <h2 className="font-serif text-6xl md:text-7xl leading-[0.9]">
              RESERVEZ. <span className="text-stroke">VENEZ</span> <span className="text-tomato">GOUTER.</span>
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Formulaire */}
            <Reveal className="lg:col-span-7">
              <div className="booking-frame p-8 md:p-12">
                <div className="font-mono text-[11px] text-tomato tracking-[0.2em] uppercase mb-3">// Reservation rapide</div>
                <h3 className="font-serif text-3xl md:text-4xl mb-2">RESERVEZ VOTRE TABLE</h3>
                <p className="text-inkdim text-sm mb-8">Confirmation par telephone. Aucune avance requise.</p>

                {resStatus === "success" ? (
                  <div className="flex items-center gap-4 p-6 border border-tomato/30">
                    <div className="w-10 h-10 bg-tomato flex items-center justify-center shrink-0">
                      <i className="fas fa-check text-black text-sm" />
                    </div>
                    <div>
                      <div className="font-heading text-sm tracking-[0.1em] uppercase">Demande recue</div>
                      <div className="text-inkdim text-xs mt-1">Nous vous appelons pour confirmer.</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitReservation} className="flex flex-col gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase">Nom complet</label>
                        <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")} className="form-input" />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase">Telephone</label>
                        <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")} className="form-input" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase">Date</label>
                        <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")} className="form-input" />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase">Heure</label>
                        <input required type="time" value={reservation.time} onChange={updateReservation("time")} className="form-input" />
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase block mb-3">Convives</label>
                      <div className="flex flex-wrap gap-2">
                        {[2, 4, 6, 8].map((n) => (
                          <button type="button" key={n} onClick={() => setReservation((r) => ({ ...r, guests: n }))}
                            className={`guest-pill ${reservation.guests === n ? "active" : ""}`}>
                            {n === 8 ? "8+" : n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={resStatus === "loading"}
                      className="pulse-btn bg-tomato text-black py-5 font-serif text-2xl tracking-[0.1em] flex items-center justify-center gap-4 mt-2 disabled:opacity-60">
                      <span>{resStatus === "loading" ? "ENVOI..." : "RESERVER MA TABLE"}</span>
                      <i className="fas fa-arrow-right" />
                    </button>
                    {resStatus === "error" && <p className="text-xs text-red-400">Verifiez la configuration Supabase.</p>}
                  </form>
                )}
              </div>
            </Reveal>

            {/* Infos pratiques */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <Reveal className="info-card p-7">
                <div className="font-mono text-[10px] text-tomato tracking-[0.2em] uppercase mb-2">/ Adresse</div>
                <h4 className="font-serif text-2xl mb-3">NOUS TROUVER</h4>
                <p className="text-inkdim text-sm leading-relaxed mb-4">{info?.address || "Rue d'Oran, Rabat"}</p>
                <div className="flex items-center gap-3 font-mono text-[11px] text-silver">
                  <i className="fas fa-location-dot text-tomato" />
                  <span>RABAT, MAROC</span>
                </div>
              </Reveal>

              <Reveal delay={100} className="info-card p-7">
                <div className="font-mono text-[10px] text-tomato tracking-[0.2em] uppercase mb-2">/ Horaires</div>
                <h4 className="font-serif text-2xl mb-3">OUVERTURE</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between border-b border-linelight pb-2">
                    <span className="text-inkdim">Lundi &mdash; Dimanche</span>
                    <span className="font-mono text-silver">{info?.hours || "08:00 — 23:00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-inkdim">Couscous</span>
                    <span className="font-mono text-tomato">VENDREDI</span>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={200} className="info-card p-7">
                <div className="font-mono text-[10px] text-tomato tracking-[0.2em] uppercase mb-2">/ Contact</div>
                <h4 className="font-serif text-2xl mb-3">NOUS APPELER</h4>
                <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`}
                  className="flex items-center gap-3 text-ink hover:text-tomato transition-colors">
                  <i className="fas fa-phone text-tomato w-4" />
                  <span className="font-mono">{info?.phone || "+212 5 37 26 26 58"}</span>
                </a>
                <p className="font-mono text-inkdim text-xs mt-2">Prix moyen : {info?.avg_price || "150 - 250 MAD"}</p>
              </Reveal>

              <Reveal delay={300} className="notch-corner overflow-hidden border border-line h-56">
                <iframe
                  title="Carte"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                  className="w-full h-full border-0"
                  style={{ filter: "grayscale(100%) contrast(1.2) brightness(0.7)" }}
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
