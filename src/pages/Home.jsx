import { useEffect, useRef, useState, useCallback } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import Reveal from "../components/Reveal.jsx"

const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, l'emince de boeuf est particulierement reussi." },
  { id: "r3", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, ambiance conviviale en soiree." },
  { id: "r4", author_name: "Client Google", rating: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
  { id: "r5", author_name: "Client Google", rating: 5, text: "Service tres attentionne, cadre chaleureux le soir." },
  { id: "r6", author_name: "Client Google", rating: 4, text: "Tres bon rapport qualite prix pour le quartier." }
]

const S = {
  maxW: { maxWidth: 1600, margin: "0 auto" },
  px: { padding: "0 1.5rem" },
  sectionPad: { padding: "7rem 0" },
  sectionPadDark: { padding: "7rem 0", borderTop: "1px solid #1f1f1f", background: "#050505" },
  sectionBorder: { padding: "7rem 0", borderTop: "1px solid #1f1f1f" },
}

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
      const { data } = await supabase.from("menu_items").select("id, name, image_url").eq("show_on_hero", true).limit(5)
      if (data && data.length > 0) setHeroDishes(data)
    }
    loadFeatured(); loadInfo(); loadReviews(); loadGalleryHome(); loadEvents(); loadPosts(); loadHeroDishes()
  }, [])

  // Hero reel animation
  useEffect(() => {
    const totalFrames = heroImages.length
    if (totalFrames <= 1) return
    let start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const pct = Math.min((elapsed / frameDuration) * 100, 100)
      setReelProgress(pct)
      if (elapsed >= frameDuration) {
        setCurrentFrame(f => (f + 1) % totalFrames)
        start = now
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

  const cardWidth = typeof window !== "undefined" && window.innerWidth <= 768 ? 316 : 416

  const goToStory = (idx) => {
    const clamped = Math.max(0, Math.min(shownReviews.length - 1, idx))
    setCurrentStory(clamped)
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
  }

  const handleDragStart = useCallback((e) => {
    setIsDragging(true)
    const x = e.type.includes("touch") ? e.touches[0].pageX : e.pageX
    dragStartX.current = x
    dragOffset.current = currentTranslateX.current
    if (autoTimerRef.current) clearInterval(autoTimerRef.current)
  }, [])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    const x = e.type.includes("touch") ? e.touches[0].pageX : e.pageX
    const diff = x - dragStartX.current
    currentTranslateX.current = dragOffset.current + diff
    setTrackTransform(currentTranslateX.current)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    const snapIndex = Math.round(Math.abs(currentTranslateX.current) / cardWidth)
    const clamped = Math.max(0, Math.min(shownReviews.length - 1, snapIndex))
    setCurrentStory(clamped)
    currentTranslateX.current = -clamped * cardWidth
    setTrackTransform(currentTranslateX.current)
  }, [isDragging, shownReviews.length, cardWidth])

  useEffect(() => {
    const target = -currentStory * cardWidth
    currentTranslateX.current = target
    setTrackTransform(target)
  }, [currentStory, cardWidth])

  const selectGuest = (n) => setReservation((r) => ({ ...r, guests: n }))

  const sectionHeading = { fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)", lineHeight: 0.9, whiteSpace: "nowrap" }
  const mono = { fontFamily: "'JetBrains Mono', monospace" }
  const heading = { fontFamily: "'Oswald', sans-serif" }

  return (
    <>
      {/* ============ HERO ============ */}
      <section style={{ position: "relative", height: "100vh", minHeight: 760, width: "100%", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          {heroImages.length > 0 ? heroImages.map((img, i) => (
            <div key={img.id} className={`reel-frame ${i === currentFrame ? "active" : ""}`}>
              <img src={img.url} alt={img.label || "La Casa Di Carta"} />
            </div>
          )) : (
            <div className="reel-frame active">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop" alt="Restaurant ambiance" />
            </div>
          )}
        </div>
        <div className="hero-overlay" />

        <div style={{ position: "relative", zIndex: 10, height: "100%", ...S.maxW, padding: "8rem 1.5rem 5rem", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {heroImages.length > 1 && (
            <div style={{ position: "absolute", top: "8rem", right: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", zIndex: 20 }} className="hide-mobile">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", ...mono, fontSize: 11, color: "#c0c0c0" }}>
                <span className="rec-dot" style={{ width: 8, height: 8, background: "#D2491F", borderRadius: "50%", display: "inline-block" }} />
                <span style={{ letterSpacing: "0.2em" }}>GALERIE &middot; LIVE</span>
              </div>
            </div>
          )}

          <div style={{ maxWidth: "64rem" }}>
            <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>{t("hero.eyebrow")}</span></div>
            <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(2.75rem, 9vw, 7.5rem)", lineHeight: 0.85, marginBottom: "2rem" }}>
              {t("hero.title_pre")}<span style={{ color: "#D2491F" }}>{t("hero.title_em")}</span>{t("hero.title_post")}
            </h1>
            <p style={{ maxWidth: "36rem", color: "#c0c0c0", fontSize: "1.125rem", lineHeight: 1.625, fontFamily: "'Archivo', sans-serif" }}>
              {t("hero.lede")}
            </p>
          </div>

          <div style={{ marginTop: "3rem", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/reserver" className="pulse-btn" style={{ background: "#D2491F", color: "#000", padding: "0.875rem 2rem", ...heading, fontSize: "0.875rem", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.75rem", whiteSpace: "nowrap" }}>
                <span>{t("hero.cta_book")}</span>
                <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
              </Link>
              <Link to="/livraison" style={{ padding: "0.875rem 1.5rem", ...heading, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c0c0c0", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", gap: "0.75rem", whiteSpace: "nowrap", transition: "all 0.3s" }}>
                <span>{t("hero.cta_delivery")}</span>
                <i className="fas fa-motorcycle" style={{ fontSize: "0.75rem", color: "#D2491F" }} />
              </Link>
            </div>

            {heroImages.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", maxWidth: "16rem", width: "100%" }}>
                <div style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em" }}>
                  <span>{String(currentFrame + 1).padStart(2, "0")}</span> / <span>{String(heroImages.length).padStart(2, "0")}</span>
                </div>
                <div className="progress-bar" style={{ flex: 1 }}>
                  <div className="progress-bar-fill" style={{ width: `${reelProgress}%` }} />
                </div>
                <div style={{ ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em" }}>GALLERIE</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ QUICK DOCK ============ */}
      <div style={{ padding: "0 1.5rem", position: "relative", zIndex: 10, marginTop: "-1.5rem" }}>
        <div className="rg-quick-dock" style={{ ...S.maxW, gap: "0.75rem", background: "#141414", border: "1px solid #1f1f1f", borderRadius: 2, padding: "0.75rem" }}>
          {[
            { to: "/reserver", icon: "fa-utensils", label: t("dock.book"), sub: t("dock.book_sub") },
            { to: "/livraison", icon: "fa-motorcycle", label: t("dock.delivery"), sub: t("dock.delivery_sub") },
            { to: "/menu", icon: "fa-book-open", label: t("dock.menu"), sub: t("dock.menu_sub") },
            { to: "/a-propos", icon: "fa-location-dot", label: t("dock.directions"), sub: t("dock.directions_sub") },
          ].map((item) => (
            <Link key={item.to} to={item.to} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", transition: "background 0.3s" }} onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ width: "2.5rem", height: "2.5rem", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`fas ${item.icon}`} style={{ fontSize: "0.875rem" }} />
              </div>
              <div>
                <b style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.1em", display: "block" }}>{item.label}</b>
                <span style={{ ...mono, fontSize: "0.75rem", color: "#6a6a6a" }}>{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ============ FEATURED MENU ============ */}
      {featured.length > 0 && (
        <section id="menu" className="section-pad-fix" style={S.sectionPad}>
          <div style={{ ...S.maxW, ...S.px }}>
            <Reveal>
              <div className="rg-split-header" style={{ gap: "2rem", marginBottom: "5rem", alignItems: "flex-end" }}>
                <div>
                  <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>01 — Notre carte</span></div>
                  <h2 style={sectionHeading}>
                    A la une. <span className="text-stroke">Saveurs</span> du <span style={{ color: "#D2491F" }}>moment.</span>
                  </h2>
                </div>
                <div style={{ gridColumnStart: 9 }}>
                  <p style={{ color: "#c0c0c0", fontSize: "1rem", lineHeight: 1.625, marginBottom: "1.5rem" }}>
                    Nos plats signatures, prepares avec des ingredients frais et de saison. Chaque assiette raconte une histoire entre tradition italienne et heritage marocain.
                  </p>
                  <Link to="/menu" className="link-underline" style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c0c0c0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Voir tout le menu</span>
                    <i className="fas fa-arrow-right" style={{ color: "#D2491F" }} />
                  </Link>
                </div>
              </div>
            </Reveal>

            {/* Program cards (first 3) */}
            <div className="rg-grid-3" style={{ gap: "1.5rem" }}>
              {featured.slice(0, 3).map((item, i) => (
                <Reveal key={item.id} delay={i * 120}>
                  <article className="program-card info-card notch-corner" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ position: "relative", height: "11rem", overflow: "hidden" }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="program-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "#1a1a1a" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414, transparent)" }} />
                      <div style={{ position: "absolute", top: "1rem", left: "1rem", ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em" }}>/ {String(i + 1).padStart(2, "0")}</div>
                      <div style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.25rem 0.5rem", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", ...mono, fontSize: 10, color: "#f5f5f5", letterSpacing: "0.15em" }}>{item.category}</div>
                    </div>
                    <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ marginBottom: "1rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                          <div>
                            <div style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Prix</div>
                            <div style={{ ...heading, fontSize: "1rem" }}>{item.price} MAD</div>
                          </div>
                          <div>
                            <div style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Categorie</div>
                            <div style={{ ...heading, fontSize: "1rem" }}>{item.category}</div>
                          </div>
                        </div>
                        <p style={{ color: "#c0c0c0", fontSize: "0.875rem", lineHeight: 1.625, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #2a2a2a" }}>
                        <span style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.15em" }}>SUR COMMANDE</span>
                        <Link to="/menu" style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                          Commander <i className="fas fa-arrow-right" style={{ color: "#D2491F", marginLeft: "0.5rem", fontSize: "0.75rem" }} />
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            {/* Flip cards (next 3) */}
            {featured.length > 3 && (
              <div className="rg-grid-3" style={{ gap: "1.5rem", marginTop: "1.5rem" }}>
                {featured.slice(3, 6).map((item, i) => (
                  <Reveal key={item.id} delay={i * 90}>
                    <div className="flip-card" onClick={(e) => { if (window.matchMedia("(hover: none)").matches) e.currentTarget.classList.toggle("flipped") }}>
                      <div className="flip-card-inner">
                        <div className="flip-face info-card" style={{ display: "flex", flexDirection: "column" }}>
                          <div className="dish-img-wrap">
                            {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div style={{ width: "100%", height: "100%", background: "#1a1a1a" }} />}
                            <div style={{ position: "absolute", top: "1rem", left: "1rem", ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em" }}>/ {String(i + 4).padStart(2, "0")}</div>
                            <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                              <div style={{ ...mono, fontSize: 10, color: "#5a5a5a", letterSpacing: "0.2em", textTransform: "uppercase" }}>{item.category}</div>
                            </div>
                          </div>
                          <div style={{ padding: "0.85rem", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", lineHeight: 1 }}>{item.name}</h3>
                              <p style={{ ...heading, color: "#6a6a6a", fontSize: "0.65rem", marginTop: "0.3rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{item.category}</p>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #2a2a2a" }}>
                              <span style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.1em" }}>{item.price} MAD</span>
                              <span style={{ ...mono, fontSize: 9, color: "#D2491F", letterSpacing: "0.1em" }}>SURVOLER &rarr;</span>
                            </div>
                          </div>
                        </div>
                        <div className="flip-face flip-back info-card" style={{ padding: "1rem", display: "flex", flexDirection: "column", background: "#141414" }}>
                          <div style={{ ...mono, fontSize: 9, color: "#D2491F", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.5rem" }}>/ {item.category}</div>
                          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", marginBottom: "0.5rem" }}>{item.name}</h3>
                          <p style={{ color: "#c0c0c0", fontSize: "0.75rem", lineHeight: 1.5, flex: 1, overflow: "hidden" }}>{item.description || "Prepare avec des ingredients frais, selon la tradition de la maison."}</p>
                          <div style={{ marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid #2a2a2a" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#D2491F" }}>{item.price} MAD</div>
                              <Link to="/menu" style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D2491F" }}>Commander &rarr;</Link>
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

      {/* ============ REVIEWS ============ */}
      <section id="reviews" style={{ ...S.sectionBorder, overflow: "hidden" }}>
        <div style={{ ...S.maxW, ...S.px, marginBottom: "4rem" }}>
          <Reveal>
            <div className="rg-split-header" style={{ gap: "2rem", alignItems: "flex-end" }}>
              <div>
                <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>02 — Avis</span></div>
                <h2 style={sectionHeading}>
                  Ce qu'en pensent <span style={{ color: "#D2491F" }}>nos clients.</span>
                </h2>
              </div>
              <div style={{ gridColumnStart: 9 }}>
                {info && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "3rem" }}>{info.google_rating}</span>
                      <div>
                        <div style={{ color: "#D2491F", fontSize: "0.875rem" }}>{"★ ".repeat(Math.round(info.google_rating || 0))}</div>
                        <div style={{ ...mono, color: "#6a6a6a", fontSize: "0.75rem" }}>{info.google_review_count} avis Google</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                      <i className="fas fa-hand-pointer" style={{ color: "#D2491F" }} />
                      <span>Glisser &middot; Avancer automatique</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        <div style={{ position: "relative", overflow: "hidden" }}>
          <div
            ref={storyTrackRef}
            style={{ display: "flex", gap: "1.5rem", cursor: "grab", userSelect: "none", willChange: "transform", padding: "0 1.5rem", transform: `translateX(${trackTransform}px)`, transition: isDragging ? "none" : "transform 700ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
          >
            {shownReviews.map((r, i) => (
              <article key={r.id} className="story-card" style={{ pointerEvents: isDragging ? "none" : "auto" }}>
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem" }}>{r.author_name}</h3>
                    <span style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.15em" }}>AVIS / {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div style={{ color: "#D2491F", fontSize: "0.875rem", marginBottom: "0.75rem" }}>{"★ ".repeat(r.rating)}{"☆ ".repeat(5 - r.rating)}</div>
                  <p style={{ color: "#c0c0c0", fontSize: "0.875rem", lineHeight: 1.625, marginBottom: "1.25rem", fontStyle: "italic" }}>
                    &ldquo;{r.text}&rdquo;
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #2a2a2a" }}>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem", color: "#D2491F" }}>{r.rating}/5</div>
                      <div style={{ ...mono, fontSize: 9, color: "#6a6a6a", letterSpacing: "0.15em", textTransform: "uppercase" }}>Note</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem" }}>Google</div>
                      <div style={{ ...mono, fontSize: 9, color: "#6a6a6a", letterSpacing: "0.15em", textTransform: "uppercase" }}>Source</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div style={{ ...S.maxW, ...S.px, marginTop: "2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {shownReviews.map((_, i) => (
                <button key={i} onClick={() => goToStory(i)} style={{ width: i === currentStory ? 32 : 8, height: 2, background: i === currentStory ? "#D2491F" : "#2a2a2a", border: "none", cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button onClick={() => goToStory(currentStory - 1)} style={{ width: "2.75rem", height: "2.75rem", border: "1px solid #2a2a2a", background: "transparent", color: "#f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                <i className="fas fa-arrow-left" style={{ fontSize: "0.75rem" }} />
              </button>
              <button onClick={() => goToStory(currentStory + 1)} style={{ width: "2.75rem", height: "2.75rem", border: "1px solid #2a2a2a", background: "transparent", color: "#f5f5f5", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                <i className="fas fa-arrow-right" style={{ fontSize: "0.75rem" }} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GALLERY ============ */}
      {galleryHome.length > 0 && (
        <section id="gallery" className="section-pad-fix" style={S.sectionBorder}>
          <div style={{ ...S.maxW, ...S.px }}>
            <Reveal>
              <div className="rg-split-header" style={{ gap: "2rem", marginBottom: "4rem", alignItems: "flex-end" }}>
                <div>
                  <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>03 — Ambiance</span></div>
                  <h2 style={sectionHeading}>
                    Un apercu <span className="text-stroke">en images.</span>
                  </h2>
                </div>
                <div style={{ gridColumnStart: 9 }}>
                  <p style={{ color: "#c0c0c0", fontSize: "1rem", lineHeight: 1.625, marginBottom: "1.5rem" }}>
                    Decouvrez l'atmosphere unique de La Casa Di Carta. Un cadre chaleureux ou chaque repas devient un moment d'exception.
                  </p>
                  <Link to="/galerie" className="link-underline" style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c0c0c0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Toute la galerie</span>
                    <i className="fas fa-arrow-right" style={{ color: "#D2491F" }} />
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="rg-grid-3" style={{ gap: "1rem" }}>
                {galleryHome.map((img, i) => (
                  <div key={img.id} className="info-card" style={{ overflow: "hidden", aspectRatio: "4/5" }}>
                    <img src={img.url} alt={img.caption || "La Casa Di Carta"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.7s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ EVENTS ============ */}
      {events.length > 0 && (
        <section className="section-pad-fix" style={S.sectionPadDark}>
          <div style={{ ...S.maxW, ...S.px }}>
            <Reveal style={{ marginBottom: "4rem" }}>
              <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>04 — Evenements</span></div>
              <h2 style={sectionHeading}>A ne pas <span style={{ color: "#D2491F" }}>manquer.</span></h2>
            </Reveal>
            <Reveal>
              <div className="rg-grid-2" style={{ gap: "1.5rem" }}>
                {events.map((e) => (
                  <div key={e.id} className="info-card rg-event-card" style={{ overflow: "hidden", height: "100%" }}>
                    {e.image_url && (
                      <div className="rg-event-img" style={{ overflow: "hidden" }}>
                        <img src={e.image_url} alt={e.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} onMouseEnter={e2 => e2.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e2 => e2.currentTarget.style.transform = "scale(1)"} />
                      </div>
                    )}
                    <div style={{ padding: "1.5rem", flex: 1 }}>
                      {e.event_date && !e.is_offer && (
                        <p style={{ ...mono, fontSize: "0.75rem", color: "#D2491F", marginBottom: "0.5rem" }}>
                          {new Date(e.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        </p>
                      )}
                      {e.is_offer && <p style={{ ...mono, fontSize: "0.75rem", color: "#7C9A5C", marginBottom: "0.5rem" }}>Offre permanente</p>}
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", marginBottom: "0.5rem" }}>{e.title}</h3>
                      <p style={{ color: "#c0c0c0", fontSize: "0.875rem", lineHeight: 1.625 }}>{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ BLOG ============ */}
      {posts.length > 0 && (
        <section className="section-pad-fix" style={S.sectionBorder}>
          <div style={{ ...S.maxW, ...S.px }}>
            <Reveal>
              <div className="rg-split-header" style={{ gap: "2rem", marginBottom: "4rem", alignItems: "flex-end" }}>
                <div>
                  <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>05 — Actualites</span></div>
                  <h2 style={sectionHeading}>Notre <span className="text-stroke">blog.</span></h2>
                </div>
                <div style={{ gridColumnStart: 9 }}>
                  <Link to="/blog" className="link-underline" style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c0c0c0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Tous les articles</span>
                    <i className="fas fa-arrow-right" style={{ color: "#D2491F" }} />
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="rg-grid-3" style={{ gap: "1.5rem" }}>
                {posts.map((p) => (
                  <Link key={p.id} to={`/blog/${p.slug}`} className="info-card" style={{ display: "block", overflow: "hidden" }}>
                    {p.cover_image && (
                      <div style={{ height: "12rem", overflow: "hidden" }}>
                        <img src={p.cover_image} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"} />
                      </div>
                    )}
                    <div style={{ padding: "1.5rem" }}>
                      <p style={{ ...mono, fontSize: "0.75rem", color: "#D2491F", marginBottom: "0.5rem" }}>
                        {p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}
                      </p>
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", marginBottom: "0.5rem" }}>{p.title}</h3>
                      <p style={{ color: "#c0c0c0", fontSize: "0.875rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ RESERVATION & INFO ============ */}
      <section id="booking" className="section-pad-fix" style={S.sectionPadDark}>
        <div style={{ ...S.maxW, ...S.px }}>
          <Reveal style={{ marginBottom: "4rem" }}>
            <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>06 — Reservation</span></div>
            <h2 style={{ ...sectionHeading, fontSize: "clamp(3rem, 6vw, 7rem)" }}>
              RESERVEZ. <span className="text-stroke">VENEZ</span> <span style={{ color: "#D2491F" }}>GOUTER.</span>
            </h2>
          </Reveal>

          <div className="rg-split-booking" style={{ gap: "2rem 3rem" }}>
            {/* Form */}
            <Reveal>
              <div className="booking-frame" style={{ padding: "2rem 3rem" }}>
                <div style={{ ...mono, fontSize: 11, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.75rem" }}>// Reservation rapide</div>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.25rem", marginBottom: "0.5rem" }}>RESERVEZ VOTRE TABLE</h3>
                <p style={{ color: "#c0c0c0", fontSize: "0.875rem", marginBottom: "2rem" }}>Confirmation par telephone. Aucune avance requise.</p>

                {resStatus === "success" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.5rem", border: "1px solid rgba(210,73,31,0.3)" }}>
                    <div style={{ width: "2.5rem", height: "2.5rem", background: "#D2491F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className="fas fa-check" style={{ color: "#000", fontSize: "0.875rem" }} />
                    </div>
                    <div>
                      <div style={{ ...heading, fontSize: "0.875rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Demande recue</div>
                      <div style={{ color: "#c0c0c0", fontSize: "0.75rem", marginTop: "0.25rem" }}>Nous vous appelons pour confirmer.</div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitReservation} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Nom complet</label>
                        <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")} className="form-input" />
                      </div>
                      <div>
                        <label style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Telephone</label>
                        <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")} className="form-input" />
                      </div>
                    </div>
                    <div className="rg-form-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div>
                        <label style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Date</label>
                        <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")} className="form-input" />
                      </div>
                      <div>
                        <label style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase" }}>Heure</label>
                        <input required type="time" value={reservation.time} onChange={updateReservation("time")} className="form-input" />
                      </div>
                    </div>
                    <div>
                      <label style={{ ...mono, fontSize: 10, color: "#6a6a6a", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.75rem" }}>Convives</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {[2, 4, 6, 8].map((n) => (
                          <button type="button" key={n} onClick={() => selectGuest(n)} className={`guest-pill ${reservation.guests === n ? "active" : ""}`}>
                            {n === 8 ? "8+" : n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={resStatus === "loading"} style={{ background: "#D2491F", color: "#000", padding: "1.25rem 0", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: "0.1em", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginTop: "1rem", width: "100%" }}>
                      <span>{resStatus === "loading" ? "Envoi..." : "RESERVER MA TABLE"}</span>
                      <i className="fas fa-arrow-right" />
                    </button>
                    {resStatus === "error" && <p style={{ textAlign: "center", ...mono, fontSize: 10, color: "#f87171", letterSpacing: "0.15em", textTransform: "uppercase" }}>Verifiez la configuration Supabase.</p>}
                  </form>
                )}
              </div>
            </Reveal>

            {/* Info panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <Reveal style={{ "--delay": "0.1s" }}>
                <div className="info-card" style={{ padding: "1.75rem" }}>
                  <div style={{ ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>/ Adresse</div>
                  <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", marginBottom: "0.75rem" }}>NOUS TROUVER</h4>
                  <p style={{ color: "#c0c0c0", fontSize: "0.875rem", lineHeight: 1.625, marginBottom: "1rem" }}>{info?.address || "Rue d'Oran, Rabat"}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", ...mono, fontSize: 11, color: "#C8C8C8" }}>
                    <i className="fas fa-location-dot" style={{ color: "#D2491F" }} />
                    <span>RABAT, MAROC</span>
                  </div>
                </div>
              </Reveal>

              <Reveal style={{ "--delay": "0.2s" }}>
                <div className="info-card" style={{ padding: "1.75rem" }}>
                  <div style={{ ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>/ Horaires</div>
                  <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", marginBottom: "0.75rem" }}>OUVERTURE</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #2a2a2a", paddingBottom: "0.5rem" }}>
                      <span style={{ color: "#c0c0c0" }}>Lundi &mdash; Dimanche</span>
                      <span style={{ ...mono, color: "#C8C8C8" }}>{info?.hours || "08:00 — 23:00"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#c0c0c0" }}>Couscous</span>
                      <span style={{ ...mono, color: "#D2491F" }}>VENDREDI</span>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal style={{ "--delay": "0.3s" }}>
                <div className="info-card" style={{ padding: "1.75rem" }}>
                  <div style={{ ...mono, fontSize: 10, color: "#D2491F", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>/ Contact</div>
                  <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", marginBottom: "0.75rem" }}>NOUS APPELER</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", fontSize: "0.875rem" }}>
                    <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#f5f5f5" }}>
                      <i className="fas fa-phone" style={{ color: "#D2491F", width: "1rem" }} />
                      <span style={{ ...mono }}>{info?.phone || "+212 5 37 26 26 58"}</span>
                    </a>
                    <p style={{ ...mono, color: "#c0c0c0", fontSize: "0.75rem", marginTop: "0.5rem" }}>Prix moyen : {info?.avg_price || "150 - 250 MAD"}</p>
                  </div>
                </div>
              </Reveal>

              <Reveal style={{ "--delay": "0.4s" }} className="notch-corner" >
                <div style={{ overflow: "hidden", border: "1px solid #1f1f1f", height: "14rem" }}>
                  <iframe title="Carte" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                    src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                    style={{ width: "100%", height: "100%", border: 0, filter: "grayscale(100%) contrast(1.2) brightness(0.7)" }} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
