import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { motion, useInView, useScroll, useTransform } from "framer-motion"

const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, l emince de boeuf est particulierement reussi." },
  { id: "r3", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, ambiance conviviale en soiree." },
  { id: "r4", author_name: "Client Google", rating: 5, text: "Service tres attentionne, cadre chaleureux le soir." },
  { id: "r5", author_name: "Client Google", rating: 4, text: "Tres bon rapport qualite prix pour le quartier." },
]

/* =========== ANIMATION HELPERS =========== */
const ease = [0.16, 1, 0.3, 1]

function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: delay * 0.08, ease }}
      className={className}
    >{children}</motion.div>
  )
}

function FadeIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6, delay: delay * 0.06, ease }}
      className={className}
    >{children}</motion.div>
  )
}

function ScaleIn({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.7, delay: delay * 0.08, ease }}
      className={className}
    >{children}</motion.div>
  )
}

function Stars({ rating }) {
  return <span className="text-goldBright text-sm tracking-widest">{"\u2605".repeat(rating)}{"\u2606".repeat(5 - rating)}</span>
}

function SectionNum({ num, label }) {
  return (
    <FadeUp>
      <div className="flex items-center gap-4 mb-6">
        <span className="font-mono text-[11px] tracking-[0.3em] text-gold/50">{String(num).padStart(2, '0')}</span>
        <span className="w-8 h-px bg-gold/30" />
        <span className="t-label">{label}</span>
      </div>
    </FadeUp>
  )
}

/* =========== MAIN COMPONENT =========== */
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

  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.08])
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 60])

  useEffect(() => {
    supabase.from("menu_items").select("id,name,price,category,image_url,description").eq("is_featured",true).limit(6).then(({data})=>{if(data)setFeatured(data)})
    supabase.from("restaurant_info").select("*").eq("id",1).single().then(({data})=>{if(data)setInfo(data)})
    supabase.from("google_reviews").select("*").order("time",{ascending:false}).limit(20).then(({data})=>{if(data?.length)setReviews(data)})
    supabase.from("gallery_images").select("*").eq("show_on_home",true).order("sort_order").limit(8).then(({data})=>{if(data)setGalleryHome(data)})
    supabase.from("events").select("*").eq("active",true).order("event_date",{ascending:true}).limit(4).then(({data})=>{if(data)setEvents(data)})
    supabase.from("blog_posts").select("id,slug,title,excerpt,cover_image,published_at").eq("published",true).order("published_at",{ascending:false}).limit(3).then(({data})=>{if(data)setPosts(data)})
    supabase.from("menu_items").select("id,name,image_url").eq("is_hero",true).limit(6).then(({data})=>{if(data?.length)setHeroDishes(data.map(d=>({id:d.id,url:d.image_url,label:d.name})))})
  }, [])

  const updateReservation = (key) => (e) => setReservation((f) => ({ ...f, [key]: e.target.value }))
  const submitReservation = async (e) => {
    e.preventDefault(); setResStatus("loading")
    const { error } = await supabase.from("reservations").insert([{ ...reservation, customer_id: user?.id || null, status: "pending" }])
    setResStatus(error ? "error" : "success")
  }

  const heroImages = heroDishes.length > 0 ? heroDishes : galleryHome.slice(0,5).map(g=>({id:g.id,url:g.url,label:g.caption}))
  useEffect(() => {
    if (heroImages.length <= 1) return
    const t = setInterval(() => setActiveHero(i => (i+1) % heroImages.length), 6000)
    return () => clearInterval(t)
  }, [heroImages.length])

  const shownReviews = reviews.slice(0, info?.home_reviews_count || 5)

  return (
    <>
      {/* =========== AMBIENT BG =========== */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--gold" />
        <div className="ambient-orb ambient-orb--warm" />
      </div>

      {/* =========== HERO — Cinematic Full-screen =========== */}
      <section ref={heroRef} className="relative w-full h-screen min-h-[700px] overflow-hidden">
        {/* BG Images with parallax */}
        {heroImages.length > 0 ? (
          <motion.div className="absolute inset-0" style={{ scale: heroScale, y: heroY }}>
            {heroImages.map((img, i) => (
              <div key={img.id} className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out ${i===activeHero ? "opacity-100" : "opacity-0"}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" style={{filter:"brightness(0.35) contrast(1.15) saturate(0.8)"}} />
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-void via-abyss to-surface" />
        )}

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-void/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-void/60 via-transparent to-transparent" />

        {/* Subtle grain overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")'}} />

        {/* Content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 h-full flex flex-col justify-end max-w-wide mx-auto px-5 md:px-10 pb-16 md:pb-24">
          <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{duration:1,delay:0.3,ease}}>
            <div className="divider-gold mb-6" />
            <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-goldBright/70 mb-6">
              Trattoria & Livraison — Rabat
            </p>
            <h1 className="font-display text-[clamp(3rem,9vw,8rem)] leading-[0.88] text-ivory font-normal tracking-tight mb-8">
              La Casa<br/><em className="text-goldBright">Di Carta</em>
            </h1>
            <p className="text-ivory/50 text-sm md:text-base max-w-md leading-relaxed font-light mb-10">
              Pizza au feu de bois, specialites italo-marocaines et couscous du vendredi.
            </p>
          </motion.div>

          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.9,ease}} className="flex flex-wrap gap-4">
            <Link to="/reserver" className="btn-gold">Reserver</Link>
            <Link to="/menu" className="btn-ghost">La Carte</Link>
          </motion.div>

          {heroImages.length > 1 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.3}} className="flex items-center gap-2 mt-14">
              {heroImages.map((_,i) => (
                <button key={i} onClick={()=>setActiveHero(i)} className={`h-px transition-all duration-700 cursor-pointer ${i===activeHero ? "w-10 bg-goldBright" : "w-4 bg-white/20 hover:bg-white/40"}`} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* =========== FEATURED DISHES =========== */}
      {featured.length > 0 && (
        <section className="sec">
          <div className="sec-inner">
            <SectionNum num={1} label="La Carte" />
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-gap">
              <FadeUp><h2 className="t-display">Saveurs du<br/><em className="text-goldBright">moment</em></h2></FadeUp>
              <FadeUp delay={2}><Link to="/menu" className="btn-link">Voir tout le menu <span className="arrow">→</span></Link></FadeUp>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {featured.slice(0,3).map((item, i) => (
                <ScaleIn key={item.id} delay={i+1}>
                  <Link to="/menu" className="glass-card glow-border group block">
                    <div className="aspect-[4/3] overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-surface flex items-center justify-center">
                          <span className="font-display text-6xl text-smoke/20">{item.name?.[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 md:p-8">
                      <p className="t-small mb-2">{item.category}</p>
                      <h3 className="font-display text-xl md:text-2xl text-ivory mb-3">{item.name}</h3>
                      <p className="t-muted line-clamp-2 mb-5">{item.description || ""}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                        <span className="font-display text-xl text-goldBright">{item.price} MAD</span>
                        <span className="text-xs tracking-widest uppercase text-smoke group-hover:text-goldBright transition-colors duration-300">Commander</span>
                      </div>
                    </div>
                  </Link>
                </ScaleIn>
              ))}
            </div>

            {featured.length > 3 && (
              <div className="grid md:grid-cols-3 gap-5 mt-5">
                {featured.slice(3).map((item, i) => (
                  <ScaleIn key={item.id} delay={i+1}>
                    <Link to="/menu" className="glass-card glow-border group block">
                      <div className="aspect-[4/3] overflow-hidden">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                        )}
                      </div>
                      <div className="p-6 md:p-8">
                        <p className="t-small mb-2">{item.category}</p>
                        <h3 className="font-display text-xl md:text-2xl text-ivory mb-3">{item.name}</h3>
                        <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                          <span className="font-display text-xl text-goldBright">{item.price} MAD</span>
                          <span className="text-xs tracking-widest uppercase text-smoke group-hover:text-goldBright transition-colors duration-300">Commander</span>
                        </div>
                      </div>
                    </Link>
                  </ScaleIn>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========== REVIEWS =========== */}
      <section className="sec--alt">
        <div className="sec-inner">
          <SectionNum num={2} label="Temoignages" />
          <div className="grid md:grid-cols-12 gap-8 md:items-end mb-gap">
            <div className="md:col-span-7">
              <FadeUp><h2 className="t-display">Ce qu en pensent<br/><em className="text-goldBright">nos clients</em></h2></FadeUp>
            </div>
            <FadeUp delay={2} className="md:col-span-4 md:col-start-9 flex items-center gap-4">
              <span className="font-display text-5xl text-ivory">{info?.google_rating ?? "4.5"}</span>
              <div>
                <Stars rating={Math.round(info?.google_rating || 4)} />
                <p className="text-smoke/50 text-xs mt-1">{info?.google_review_count ?? reviews.length} avis</p>
              </div>
            </FadeUp>
          </div>

          <div className="divider-line" />

          <div>
            {shownReviews.map((r, i) => (
              <FadeIn key={r.id} delay={i}>
                <div className="review-row grid md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    <Stars rating={r.rating} />
                    <p className="font-display text-xl md:text-2xl text-ivory/90 mt-4 leading-relaxed italic">
                      &quot;{r.text}&quot;
                    </p>
                  </div>
                  <div className="md:col-span-3 md:col-start-10 flex md:flex-col md:items-end md:justify-center">
                    <span className="font-display text-lg text-ivory/70">{r.author_name}</span>
                    <span className="t-small mt-1">Google</span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* =========== GALLERY =========== */}
      {galleryHome.length > 0 && (
        <section className="sec">
          <div className="sec-inner">
            <SectionNum num={3} label="Ambiance" />
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-gap">
              <FadeUp><h2 className="t-display">Un apercu<em className="text-goldBright"> en images</em></h2></FadeUp>
              <FadeUp delay={2}><Link to="/galerie" className="btn-link">Toute la galerie <span className="arrow">→</span></Link></FadeUp>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {galleryHome.map((img, i) => (
                <ScaleIn key={img.id} delay={i} className={`${i===0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                  <div className={`img-reveal cursor-pointer ${i===0 ? "aspect-square" : "aspect-[3/4]"}`}>
                    <img src={img.url} alt={img.caption || ""} loading="lazy" />
                  </div>
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========== EVENTS =========== */}
      {events.length > 0 && (
        <section className="sec--alt">
          <div className="sec-inner">
            <SectionNum num={4} label="Evenements" />
            <FadeUp className="mb-gap"><h2 className="t-display">A ne pas<em className="text-goldBright"> manquer</em></h2></FadeUp>
            <div className="divider-line" />
            {events.map((e, i) => (
              <FadeIn key={e.id} delay={i}>
                <div className="review-row grid md:grid-cols-12 gap-6 items-center">
                  {e.image_url && (
                    <div className="md:col-span-3 img-reveal aspect-square">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={e.image_url ? "md:col-span-7" : "md:col-span-9"}>
                    {e.event_date && !e.is_offer && (
                      <p className="t-small mb-2">{new Date(e.event_date).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p>
                    )}
                    {e.is_offer && <p className="t-small mb-2 text-goldBright">Offre permanente</p>}
                    <h3 className="font-display text-2xl md:text-3xl text-ivory">{e.title}</h3>
                    <p className="t-muted mt-2">{e.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* =========== BLOG =========== */}
      {posts.length > 0 && (
        <section className="sec">
          <div className="sec-inner">
            <SectionNum num={5} label="Actualites" />
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-gap">
              <FadeUp><h2 className="t-display">Notre<em className="text-goldBright"> blog</em></h2></FadeUp>
              <FadeUp delay={2}><Link to="/blog" className="btn-link">Tous les articles <span className="arrow">→</span></Link></FadeUp>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {posts.map((p, i) => (
                <ScaleIn key={p.id} delay={i}>
                  <Link to={`/blog/${p.slug}`} className="glass-card glow-border group block">
                    {p.cover_image && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      </div>
                    )}
                    <div className="p-6 md:p-8">
                      <p className="t-small mb-3">{p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}</p>
                      <h3 className="font-display text-xl text-ivory mb-2 leading-tight">{p.title}</h3>
                      <p className="t-muted line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========== RESERVATION =========== */}
      <section className="sec--alt">
        <div className="sec-inner">
          <SectionNum num={6} label="Reservation" />
          <FadeUp className="mb-gap"><h2 className="t-display">Reservez.<br/><em className="text-goldBright">Venez gouter.</em></h2></FadeUp>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <FadeUp className="lg:col-span-7">
              {resStatus === "success" ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-goldBright" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="font-display text-2xl text-ivory mb-2">Demande recue</p>
                  <p className="t-muted">Nous vous appelons pour confirmer.</p>
                </div>
              ) : (
                <form onSubmit={submitReservation} className="flex flex-col gap-6">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="t-small block mb-3">Nom complet</label>
                      <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")} className="field-input" />
                    </div>
                    <div>
                      <label className="t-small block mb-3">Telephone</label>
                      <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")} className="field-input" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="t-small block mb-3">Date</label>
                      <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")} className="field-input" />
                    </div>
                    <div>
                      <label className="t-small block mb-3">Heure</label>
                      <input required type="time" value={reservation.time} onChange={updateReservation("time")} className="field-input" />
                    </div>
                  </div>
                  <div>
                    <label className="t-small block mb-4">Convives</label>
                    <div className="flex gap-3">
                      {[2,4,6,8].map(n => (
                        <button type="button" key={n} onClick={() => setReservation(r=>({...r,guests:n}))} className={`w-12 h-12 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 ${reservation.guests===n ? "bg-gold text-white shadow-[0_0_20px_rgba(161,98,7,0.3)]" : "bg-surface/50 text-ghost border border-white/[0.06] hover:border-gold/30 hover:text-ivory"}`}>{n===8?"8+":n}</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={resStatus==="loading"} className="btn-gold mt-2 self-start disabled:opacity-50">
                    {resStatus==="loading"?"Envoi...":"Reserver"}
                  </button>
                  {resStatus==="error" && <p className="text-xs text-danger">Erreur de configuration.</p>}
                </form>
              )}
            </FadeUp>

            {/* Info Side */}
            <div className="lg:col-span-4 lg:col-start-9">
              <FadeUp delay={1}>
                <div className="info-block">
                  <p className="t-small mb-3">Adresse</p>
                  <p className="font-display text-xl text-ivory mb-1">Rue d'Oran</p>
                  <p className="t-muted">Rabat, Maroc</p>
                </div>
              </FadeUp>
              <FadeUp delay={2}>
                <div className="info-block">
                  <p className="t-small mb-3">Horaires</p>
                  <p className="text-ivory/70 text-sm">Lundi — Dimanche</p>
                  <p className="text-ivory text-sm font-medium mt-1">{info?.hours || "08:00 — 23:00"}</p>
                  <p className="text-goldBright text-xs mt-3 font-medium">Couscous — Vendredi</p>
                </div>
              </FadeUp>
              <FadeUp delay={3}>
                <div className="info-block">
                  <p className="t-small mb-3">Telephone</p>
                  <a href={`tel:${(info?.phone||"+212537262658").replace(/\s/g,"")}`} className="font-display text-xl text-ivory/70 hover:text-goldBright transition-colors duration-300">
                    {info?.phone || "+212 5 37 26 26 58"}
                  </a>
                  <p className="text-smoke/40 text-xs mt-2">Prix moyen : {info?.avg_price || "150-250 MAD"}</p>
                </div>
              </FadeUp>
              <FadeUp delay={4} className="aspect-video overflow-hidden rounded-xl border border-white/[0.04]">
                <iframe title="Carte" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                  className="w-full h-full border-0" style={{filter:'invert(90%) hue-rotate(180deg)'}} />
              </FadeUp>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
