import { useEffect, useRef, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import Reveal from "../components/Reveal.jsx"

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

  // Hero reel state
  const [currentFrame, setCurrentFrame] = useState(0)
  const [reelProgress, setReelProgress] = useState(0)
  const reelTimerRef = useRef(null)
  const frameDuration = 5000

  // Stories carousel refs
  const storyTrackRef = useRef(null)
  const [currentStory, setCurrentStory] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragOffset = useRef(0)
  const currentTranslateX = useRef(0)
  const [trackTransform, setTrackTransform] = useState(0)
  const autoTimerRef = useRef(null)

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
      const { data } = await supabase.from("gallery_images").select("*").eq("show_on_home", true).order("sort_order").limit(10)
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

  // Hero reel timer
  useEffect(() => {
    let timer = 0
    const tick = () => {
      timer += 50
      const pct = (timer / frameDuration) * 100
      setReelProgress(pct)
      if (timer >= frameDuration) {
        timer = 0
        setCurrentFrame(prev => {
          const images = heroDishes.length > 0 ? heroDishes : galleryHome.slice(0, 5)
          return (prev + 1) % Math.max(images.length, 1)
        })
      }
      reelTimerRef.current = requestAnimationFrame(tick)
    }
    reelTimerRef.current = requestAnimationFrame(tick)
    return () => { if (reelTimerRef.current) cancelAnimationFrame(reelTimerRef.current) }
  }, [heroDishes, galleryHome])

  // Stories carousel auto-advance
  useEffect(() => {
    if (reviews.length <= 1) return
    autoTimerRef.current = setInterval(() => {
      if (!isDragging) {
        setCurrentStory(prev => (prev + 1) % reviews.length)
      }
    }, 4500)
    return () => { if (autoTimerRef.current) clearInterval(autoTimerRef.current) }
  }, [reviews.length, isDragging])

  const updateReservation = (key) => (e) => setReservation((f) => ({ ...f, [key]: e.target.value }))

  const submitReservation = async (e) => {
    e.preventDefault()
    setResStatus("loading")
    const { error } = await supabase.from("reservations").insert([{ ...reservation, customer_id: user ? user.id : null, status: "pending" }])
    setResStatus(error ? "error" : "success")
  }

  const reviewsCount = info?.home_reviews_count || 6
  const shownReviews = reviews.slice(0, reviewsCount)
  const heroImages = heroDishes.length > 0
    ? heroDishes
    : galleryHome.slice(0, 5).map((g) => ({ id: g.id, url: g.url, label: g.caption }))

  // Stories drag handlers
  const handleDragStart = useCallback((e) => {
    setIsDragging(true)
    const x = e.type.includes("touch") ? e.touches[0].pageX : e.pageX
    dragStartX.current = x
    dragOffset.current = currentTranslateX.current
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    if (e.cancelable) e.preventDefault()
    const x = e.type.includes("touch") ? e.touches[0].pageX : e.pageX
    const delta = x - dragStartX.current
    currentTranslateX.current = dragOffset.current + delta
    setTrackTransform(currentTranslateX.current)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const cardWidth = 416 // 400px card + 16px gap
    const snapIndex = Math.round(Math.abs(currentTranslateX.current) / cardWidth)
    const clamped = Math.max(0, Math.min(shownReviews.length - 1, snapIndex))
    setCurrentStory(clamped)
    currentTranslateX.current = -clamped * cardWidth
    setTrackTransform(currentTranslateX.current)
  }, [isDragging, shownReviews.length])

  // Snap story track when currentStory changes (from auto-advance or dots)
  useEffect(() => {
    const cardWidth = 416
    const target = -currentStory * cardWidth
    currentTranslateX.current = target
    setTrackTransform(target)
  }, [currentStory])

  const goToStory = (idx) => {
    setCurrentStory(Math.max(0, Math.min(shownReviews.length - 1, idx)))
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
  }

  return (
    <>
      {/* ============ GRAIN OVERLAY ============ */}
      

      {/* ============ HERO ============ */}
      <section className="relative h-screen min-h-[760px] w-full overflow-hidden">
        {/* Reel frames */}
        <div className="absolute inset-0">
          {heroImages.length > 0 ? heroImages.map((img, i) => (
            <div key={img.id} className={`reel-frame ${i === currentFrame ? "active" : ""}`}>
              <img src={img.url} alt={img.label || "La Casa Di Carta"} />
            </div>
          )) : (
            <div className={`reel-frame active`}>
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop" alt="Restaurant ambiance" />
            </div>
          )}
        </div>

        <div className="hero-overlay" />
        

        {/* Hero content */}
        <div className="relative z-10 h-full max-w-container mx-auto px-6 lg:px-10 flex flex-col justify-end pb-20 pt-32">

          {/* Reel control top right */}
          {heroImages.length > 1 && (
            <div className="absolute top-32 right-6 lg:right-10 flex items-center gap-4 z-20">
              <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-fg-dim">
                <span className="rec-dot w-2 h-2 bg-accent rounded-full" />
                <span className="tracking-[0.2em]">GALERIE · LIVE</span>
              </div>
            </div>
          )}

          {/* Main headline */}
          <div className="max-w-5xl">
            <div className="section-marker mb-6">
              <span>{t("hero.eyebrow")}</span>
            </div>
            <h1 className="font-display text-[14vw] md:text-[10vw] lg:text-[8.5vw] leading-[0.85] mb-8">
              {t("hero.title_pre")}
              <span className="text-accent">{t("hero.title_em")}</span>
              {t("hero.title_post")}
            </h1>
            <p className="max-w-xl text-fg-dim text-base md:text-lg leading-relaxed font-body">
              {t("hero.lede")}
            </p>
          </div>

          {/* Bottom hero strip */}
          <div className="mt-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            {/* Quick links */}
            <div className="flex items-center gap-4 flex-wrap">
              <Link to="/reserver" className="pulse-btn bg-accent text-black px-6 md:px-8 py-3.5 font-heading text-xs md:text-sm tracking-[0.2em] uppercase hover:bg-accent-bright transition-colors flex items-center gap-3 whitespace-nowrap">
                <span>{t("hero.cta_book")}</span>
                <i className="fas fa-arrow-right text-xs" />
              </Link>
              <Link to="/livraison" className="px-6 py-3.5 font-heading text-xs tracking-[0.2em] uppercase text-fg-dim border border-line-light hover:border-accent hover:text-fg transition-colors flex items-center gap-3 whitespace-nowrap">
                <span>{t("hero.cta_delivery")}</span>
                <i className="fas fa-motorcycle text-xs text-accent" />
              </Link>
            </div>

            {/* Reel progress */}
            {heroImages.length > 1 && (
              <div className="flex items-center gap-6 max-w-md w-full lg:w-auto">
                <div className="font-mono text-[10px] text-muted tracking-[0.2em]">
                  <span>{String(currentFrame + 1).padStart(2, "0")}</span> / {String(heroImages.length).padStart(2, "0")}
                </div>
                <div className="flex-1 progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${reelProgress}%` }} />
                </div>
                <div className="font-mono [10px] text-accent tracking-[0.2em]">
                  GALLERIE
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ============ REVIEWS (Stories Carousel) ============ */}
      <section className="relative py-28 lg:py-36 overflow-hidden border-t border-line">
        <div className="max-w-container mx-auto px-6 lg:px-10 mb-16">
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="section-marker mb-6"><span>02 — Avis</span></div>
                <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9]">
                  Ce qu'en pensent <span className="text-accent">nos clients.</span>
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end">
              {info && (
                <Reveal>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-display text-5xl">{info.google_rating}</span>
                    <div>
                      <div className="text-accent text-sm">{"★ ".repeat(Math.round(info.google_rating || 0))}</div>
                      <div className="text-muted text-xs font-mono">{info.google_review_count} avis Google</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[10px] text-muted tracking-[0.2em] uppercase">
                    <i className="fas fa-hand-pointer text-accent" />
                    <span>Glisser · Avancer automatique</span>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            ref={storyTrackRef}
            className="flex gap-6 cursor-grab user-select-none will-change-transform px-6 lg:px-10"
            style={{ transform: `translateX(${trackTransform}px)`, transition: isDragging ? "none" : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {shownReviews.map((r, i) => (
              <article key={r.id} className="story-card" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-2xl">{r.author_name}</h3>
                    <span className="font-mono text-[10px] text-muted tracking-[0.15em]">AVIS / {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="text-accent text-sm mb-3">{"★ ".repeat(r.rating)}{"☆ ".repeat(5 - r.rating)}</div>
                  <p className="text-fg-dim text-sm leading-relaxed mb-5 italic">
                    "{r.text}"
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-line-light">
                    <div>
                      <div className="font-display text-xl text-accent">{r.rating}/5</div>
                      <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase">Note</div>
                    </div>
                    <div>
                      <div className="font-display text-xl">Google</div>
                      <div className="font-mono text-[9px] text-muted tracking-[0.15em] uppercase">Source</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Carousel controls */}
          <div className="max-w-container mx-auto px-6 lg:px-10 mt-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shownReviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStory(i)}
                  className="transition-all"
                  style={{
                    width: i === currentStory ? "32px" : "8px",
                    height: "2px",
                    background: i === currentStory ? "#D2491F" : "#2a2a2a",
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => goToStory(currentStory - 1)}
                className="w-11 h-11 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center"
              >
                <i className="fas fa-arrow-left text-xs" />
              </button>
              <button
                onClick={() => goToStory(currentStory + 1)}
                className="w-11 h-11 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center"
              >
                <i className="fas fa-arrow-right text-xs" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      {galleryHome.length > 0 && (
        <section className="relative py-28 lg:py-36 border-t border-line">
          <div className="max-w-container mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <div className="lg:col-span-7">
                <Reveal>
                  <div className="section-marker mb-6"><span>03 — Ambiance</span></div>
                  <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9]">
                    Un apercu <span className="text-stroke">en images.</span>
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end">
                <Reveal>
                  <p className="text-fg-dim text-base leading-relaxed mb-6">
                    Decouvrez l'atmosphere unique de La Casa Di Carta. Un cadre chaleureux ou chaque repas devient un moment d'exception.
                  </p>
                  <Link to="/galerie" className="flex items-center justify-between font-heading text-sm tracking-[0.15em] uppercase link-underline text-fg-dim hover:text-fg">
                    <span>Toute la galerie</span>
                    <i className="fas fa-arrow-right text-accent" />
                  </Link>
                </Reveal>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {galleryHome.map((img, i) => (
                <Reveal key={img.id} delay={(i % 3) * 100}>
                  <div className="info-card overflow-hidden group aspect-[4/5]">
                    <img
                      src={img.url}
                      alt={img.caption || "La Casa Di Carta"}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ EVENTS & OFFERS ============ */}
      {events.length > 0 && (
        <section className="relative py-28 lg:py-36 border-t border-line bg-bg-darker">
          <div className="max-w-container mx-auto px-6 lg:px-10">
            <div className="mb-16">
              <Reveal>
                <div className="section-marker mb-6"><span>04 — Evenements</span></div>
                <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9]">
                  A ne pas <span className="text-accent">manquer.</span>
                </h2>
              </Reveal>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((e, i) => (
                <Reveal key={e.id} delay={i * 90}>
                  <div className="info-card overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 h-full flex flex-col sm:flex-row">
                    {e.image_url && (
                      <div className="sm:w-48 h-48 sm:h-auto shrink-0 overflow-hidden">
                        <img src={e.image_url} alt={e.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      {e.event_date && !e.is_offer && (
                        <p className="font-mono text-xs text-accent mb-2">
                          {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        </p>
                      )}
                      {e.is_offer && <p className="font-mono text-xs text-basil mb-2">Offre permanente</p>}
                      <h3 className="font-display text-2xl mb-2">{e.title}</h3>
                      <p className="text-fg-dim text-sm leading-relaxed">{e.description}</p>
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
        <section className="relative py-28 lg:py-36 border-t border-line">
          <div className="max-w-container mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <div className="lg:col-span-7">
                <Reveal>
                  <div className="section-marker mb-6"><span>05 — Actualites</span></div>
                  <h2 className="font-display text-6xl md:text-7xl lg:text-8xl leading-[0.9]">
                    Notre <span className="text-stroke">blog.</span>
                  </h2>
                </Reveal>
              </div>
              <div className="lg:col-span-4 lg:col-start-9 flex flex-col justify-end">
                <Reveal>
                  <Link to="/blog" className="flex items-center justify-between font-heading text-sm tracking-[0.15em] uppercase link-underline text-fg-dim hover:text-fg">
                    <span>Tous les articles</span>
                    <i className="fas fa-arrow-right text-accent" />
                  </Link>
                </Reveal>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {posts.map((p, i) => (
                <Reveal key={p.id} delay={i * 90}>
                  <Link to={`/blog/${p.slug}`} className="group block info-card overflow-hidden hover:-translate-y-1.5 transition-all duration-300 h-full">
                    {p.cover_image && (
                      <div className="h-48 overflow-hidden">
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="font-mono text-xs text-accent mb-2">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                      </p>
                      <h3 className="font-display text-2xl mb-2">{p.title}</h3>
                      <p className="text-fg-dim text-sm line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ RESERVATION & INFO ============ */}
      <section className="relative py-28 lg:py-36 border-t border-line bg-bg-darker" id="booking">
        <div className="max-w-container mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-8 mb-16">
            <div className="lg:col-span-8">
              <Reveal>
                <div className="section-marker mb-6"><span>06 — Reservation</span></div>
                <h2 className="font-display text-6xl md:text-7xl lg:text-[7rem] leading-[0.9]">
                  RESERVEZ. <span className="text-stroke">VENEZ</span> <span className="text-accent">GOUTER.</span>
                </h2>
              </Reveal>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Form panel */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="booking-frame p-8 lg:p-12">
                  <div className="font-mono text-[11px] text-accent tracking-[0.2em] uppercase mb-3">// Reservation rapide</div>
                  <h3 className="font-display text-4xl mb-2">RESERVEZ VOTRE TABLE</h3>
                  <p className="text-fg-dim text-sm mb-8">Confirmation par telephone. Aucune avance requise.</p>

                  {resStatus === "success" ? (
                    <div className="flex items-center gap-4 p-6 border border-accent/30">
                      <div className="w-10 h-10 bg-accent flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check text-black text-sm" />
                      </div>
                      <div>
                        <div className="font-heading text-sm tracking-wider uppercase">Demande recue</div>
                        <div className="text-fg-dim text-xs mt-1">Nous vous appelons pour confirmer.</div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={submitReservation} className="space-y-6">
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
                            <button
                              type="button"
                              key={n}
                              onClick={() => setReservation((r) => ({ ...r, guests: n }))}
                              className={`guest-pill ${reservation.guests === n ? "active" : ""}`}
                            >
                              {n === 8 ? "8+" : n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={resStatus === "loading"}
                        className="pulse-btn w-full bg-accent text-black py-5 font-display text-2xl tracking-wider hover:bg-accent-bright transition-colors flex items-center justify-center gap-4 mt-4 disabled:opacity-60"
                      >
                        <span>{resStatus === "loading" ? "Envoi..." : "RESERVER MA TABLE"}</span>
                        <i className="fas fa-arrow-right" />
                      </button>
                      {resStatus === "error" && <p className="text-center font-mono text-[10px] text-red-400 tracking-[0.15em] uppercase">Verifiez la configuration Supabase.</p>}
                    </form>
                  )}
                </div>
              </Reveal>
            </div>

            {/* Info panel */}
            <div className="lg:col-span-5">
              <div className="space-y-6">
                <Reveal style={{ "--delay": "0.1s" }}>
                  <div className="info-card p-7">
                    <div className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">/ Adresse</div>
                    <h4 className="font-display text-2xl mb-3">NOUS TROUVER</h4>
                    <p className="text-fg-dim text-sm leading-relaxed mb-4">
                      {info?.address || "Rue d'Oran, Rabat"}
                    </p>
                    <div className="flex items-center gap-3 font-mono text-[11px] text-silver">
                      <i className="fas fa-location-dot text-accent" />
                      <span>RABAT, MAROC</span>
                    </div>
                  </div>
                </Reveal>

                <Reveal style={{ "--delay": "0.2s" }}>
                  <div className="info-card p-7">
                    <div className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">/ Horaires</div>
                    <h4 className="font-display text-2xl mb-3">OUVERTURE</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-line-light pb-2">
                        <span className="text-fg-dim">Lundi — Dimanche</span>
                        <span className="font-mono text-silver">{info?.hours || "08:00 — 23:00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fg-dim">Couscous</span>
                        <span className="font-mono text-accent">VENDREDI</span>
                      </div>
                    </div>
                  </div>
                </Reveal>

                <Reveal style={{ "--delay": "0.3s" }}>
                  <div className="info-card p-7">
                    <div className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-2">/ Contact</div>
                    <h4 className="font-display text-2xl mb-3">NOUS APPELER</h4>
                    <div className="space-y-2.5 text-sm">
                      <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`} className="flex items-center gap-3 hover:text-accent transition-colors">
                        <i className="fas fa-phone text-accent w-4" />
                        <span className="font-mono">{info?.phone || "+212 5 37 26 26 58"}</span>
                      </a>
                      <p className="text-fg-dim text-xs mt-2 font-mono">Prix moyen : {info?.avg_price || "150 - 250 MAD"}</p>
                    </div>
                  </div>
                </Reveal>

                <Reveal style={{ "--delay": "0.4s" }} className="notch-corner overflow-hidden border border-line h-56">
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
        </div>
      </section>
    </>
  )
}
