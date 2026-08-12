import { useEffect, useState, useRef } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext.jsx"
import { motion, useInView } from "framer-motion"

const FALLBACK_REVIEWS = [
  { id: "r1", author_name: "Client Google", rating: 5, text: "Le poisson recommande par le serveur etait parfait." },
  { id: "r2", author_name: "Client Google", rating: 4, text: "Bel endroit, l emince de boeuf est particulierement reussi." },
  { id: "r3", author_name: "Client Google", rating: 4, text: "Jus frais tres bons, ambiance conviviale en soiree." },
  { id: "r4", author_name: "Client Google", rating: 5, text: "Service tres attentionne, cadre chaleureux le soir." },
  { id: "r5", author_name: "Client Google", rating: 4, text: "Tres bon rapport qualite prix pour le quartier." },
]

function Stars({ rating }) {
  return <span className="text-gold text-sm tracking-widest">{"\u2605".repeat(rating)}{"\u2606".repeat(5 - rating)}</span>
}

function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: delay * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
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
    supabase.from("menu_items").select("id,name,price,category,image_url,description").eq("is_featured",true).limit(6).then(({data})=>{if(data)setFeatured(data)})
    supabase.from("restaurant_info").select("*").eq("id",1).single().then(({data})=>{if(data)setInfo(data)})
    supabase.from("google_reviews").select("*").order("time",{ascending:false}).limit(20).then(({data})=>{if(data?.length)setReviews(data)})
    supabase.from("gallery_images").select("*").eq("show_on_home",true).order("sort_order").limit(6).then(({data})=>{if(data)setGalleryHome(data)})
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
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative w-full h-screen min-h-[700px] overflow-hidden">
        {heroImages.length > 0 ? (
          <div className="absolute inset-0">
            {heroImages.map((img, i) => (
              <div key={img.id} className={`absolute inset-0 transition-opacity duration-[2500ms] ease-in-out ${i===activeHero ? "opacity-100" : "opacity-0"}`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" style={{filter:"brightness(0.55) contrast(1.1)"}} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/30" />

        <div className="relative z-10 h-full flex flex-col justify-end max-w-wide mx-auto px-5 md:px-10 pb-16 md:pb-24">
          <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.9,delay:0.2,ease:[0.22,1,0.36,1]}}>
            <p className="ed-label mb-6">Trattoria & Livraison — Rabat</p>
            <h1 className="font-display text-[clamp(3rem,9vw,8rem)] leading-[0.88] text-white font-light tracking-tight mb-8">
              La Casa<br/><em className="text-goldLight">Di Carta</em>
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-md leading-relaxed font-light mb-10">
              Pizza au feu de bois, specialites italo-marocaines et couscous du vendredi.
            </p>
          </motion.div>

          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.8}} className="flex flex-wrap gap-8">
            <Link to="/reserver" className="ed-cta">Reserver</Link>
            <Link to="/menu" className="inline-flex items-center gap-3 px-10 py-4 border border-white/30 text-white font-body text-xs font-semibold tracking-[0.2em] uppercase hover:border-white hover:bg-white/10 transition-all duration-300 cursor-pointer">
              La Carte
            </Link>
          </motion.div>

          {heroImages.length > 1 && (
            <div className="flex items-center gap-2 mt-12">
              {heroImages.map((_,i) => (
                <button key={i} onClick={()=>setActiveHero(i)} className={`h-px transition-all duration-700 cursor-pointer ${i===activeHero ? "w-10 bg-gold" : "w-4 bg-white/30 hover:bg-white/60"}`} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ FEATURED DISHES ═══════════ */}
      {featured.length > 0 && (
        <section className="ed-section">
          <div className="max-w-wide mx-auto px-5 md:px-10">
            <FadeUp className="mb-gap">
              <p className="ed-label mb-4">01 — La Carte</p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <h2 className="ed-h1">Saveurs du<br/><em className="text-gold">moment</em></h2>
                <Link to="/menu" className="ed-btn">Voir tout le menu</Link>
              </div>
            </FadeUp>

            <div className="mt-gap grid md:grid-cols-3 gap-px bg-border">
              {featured.slice(0,3).map((item, i) => (
                <FadeUp key={item.id} delay={i+1}>
                  <Link to="/menu" className="ed-card group block">
                    <div className="aspect-[4/3] overflow-hidden bg-bgAlt">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="font-display text-6xl text-inkFaint/30">{item.name?.[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 md:p-8">
                      <p className="ed-small mb-2">{item.category}</p>
                      <h3 className="font-display text-2xl text-ink mb-3">{item.name}</h3>
                      <p className="text-inkMuted text-sm leading-relaxed line-clamp-2 mb-4">{item.description || ""}</p>
                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <span className="font-display text-xl text-gold">{item.price} MAD</span>
                        <span className="text-xs tracking-widest uppercase text-inkMuted group-hover:text-ink transition-colors">Commander</span>
                      </div>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>

            {featured.length > 3 && (
              <div className="mt-px grid md:grid-cols-3 gap-px bg-border">
                {featured.slice(3).map((item, i) => (
                  <FadeUp key={item.id} delay={i+1}>
                    <Link to="/menu" className="ed-card group block">
                      <div className="aspect-[4/3] overflow-hidden bg-bgAlt">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                        ) : null}
                      </div>
                      <div className="p-6 md:p-8">
                        <p className="ed-small mb-2">{item.category}</p>
                        <h3 className="font-display text-2xl text-ink mb-3">{item.name}</h3>
                        <div className="flex justify-between items-center pt-4 border-t border-border">
                          <span className="font-display text-xl text-gold">{item.price} MAD</span>
                          <span className="text-xs tracking-widest uppercase text-inkMuted group-hover:text-ink transition-colors">Commander</span>
                        </div>
                      </div>
                    </Link>
                  </FadeUp>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════ REVIEWS ═══════════ */}
      <section className="ed-section--alt">
        <div className="max-w-wide mx-auto px-5 md:px-10">
          <FadeUp className="mb-gap">
            <div className="grid md:grid-cols-12 gap-8 md:items-end">
              <div className="md:col-span-7">
                <p className="ed-label mb-4">02 — Temoignages</p>
                <h2 className="ed-h1">Ce qu en pensent<br/><em className="text-gold">nos clients</em></h2>
              </div>
              <div className="md:col-span-4 md:col-start-9 flex items-center gap-4">
                <span className="font-display text-5xl text-ink">{info?.google_rating ?? "4.5"}</span>
                <div>
                  <Stars rating={Math.round(info?.google_rating || 4)} />
                  <p className="text-inkFaint text-xs mt-1">{info?.google_review_count ?? reviews.length} avis</p>
                </div>
              </div>
            </div>
          </FadeUp>

          <div className="ed-divider-full" />

          <div>
            {shownReviews.map((r, i) => (
              <FadeUp key={r.id} delay={i}>
                <div className="ed-review grid md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    <Stars rating={r.rating} />
                    <p className="font-display text-xl md:text-2xl text-ink mt-4 leading-relaxed italic">
                      &quot;{r.text}&quot;
                    </p>
                  </div>
                  <div className="md:col-span-3 md:col-start-10 flex md:flex-col md:items-end md:justify-center">
                    <span className="font-display text-lg text-ink">{r.author_name}</span>
                    <span className="ed-small mt-1">Google</span>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ GALLERY ═══════════ */}
      {galleryHome.length > 0 && (
        <section className="ed-section">
          <div className="max-w-wide mx-auto px-5 md:px-10">
            <FadeUp className="mb-gap">
              <p className="ed-label mb-4">03 — Ambiance</p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <h2 className="ed-h1">Un apercu<em className="text-gold"> en images</em></h2>
                <Link to="/galerie" className="ed-btn">Toute la galerie</Link>
              </div>
            </FadeUp>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
              {galleryHome.map((img, i) => (
                <FadeUp key={img.id} delay={i}>
                  <div className={`ed-img-full cursor-pointer bg-bgAlt ${i===0 ? "md:col-span-2 md:row-span-2 aspect-square" : "aspect-[3/4]"}`}>
                    <img src={img.url} alt={img.caption || ""} loading="lazy" />
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ EVENTS ═══════════ */}
      {events.length > 0 && (
        <section className="ed-section--alt">
          <div className="max-w-wide mx-auto px-5 md:px-10">
            <FadeUp className="mb-gap">
              <p className="ed-label mb-4">04 — Evenements</p>
              <h2 className="ed-h1">A ne pas<em className="text-gold"> manquer</em></h2>
            </FadeUp>
            <div className="ed-divider-full" />
            {events.map((e, i) => (
              <FadeUp key={e.id} delay={i}>
                <div className="ed-review grid md:grid-cols-12 gap-6 items-center">
                  {e.image_url && (
                    <div className="md:col-span-3 ed-img-full aspect-square">
                      <img src={e.image_url} alt={e.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={e.image_url ? "md:col-span-7" : "md:col-span-9"}>
                    {e.event_date && !e.is_offer && (
                      <p className="ed-small mb-2">{new Date(e.event_date).toLocaleDateString("fr-FR",{day:"numeric",month:"long"})}</p>
                    )}
                    {e.is_offer && <p className="ed-small mb-2 text-gold">Offre permanente</p>}
                    <h3 className="font-display text-2xl md:text-3xl text-ink">{e.title}</h3>
                    <p className="text-inkMuted text-sm mt-2 leading-relaxed">{e.description}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════ BLOG ═══════════ */}
      {posts.length > 0 && (
        <section className="ed-section">
          <div className="max-w-wide mx-auto px-5 md:px-10">
            <FadeUp className="mb-gap">
              <p className="ed-label mb-4">05 — Actualites</p>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <h2 className="ed-h1">Notre<em className="text-gold"> blog</em></h2>
                <Link to="/blog" className="ed-btn">Tous les articles</Link>
              </div>
            </FadeUp>
            <div className="grid md:grid-cols-3 gap-px bg-border">
              {posts.map((p, i) => (
                <FadeUp key={p.id} delay={i}>
                  <Link to={`/blog/${p.slug}`} className="ed-card group block">
                    {p.cover_image && (
                      <div className="aspect-[16/10] overflow-hidden bg-bgAlt">
                        <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    )}
                    <div className="p-6 md:p-8">
                      <p className="ed-small mb-3">{p.published_at ? new Date(p.published_at).toLocaleDateString("fr-FR") : ""}</p>
                      <h3 className="font-display text-xl text-ink mb-2 leading-tight">{p.title}</h3>
                      <p className="text-inkMuted text-sm line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ RESERVATION ═══════════ */}
      <section className="ed-section--alt">
        <div className="max-w-wide mx-auto px-5 md:px-10">
          <FadeUp className="mb-gap">
            <p className="ed-label mb-4">06 — Reservation</p>
            <h2 className="ed-h1">Reservez.<br/><em className="text-gold">Venez gouter.</em></h2>
          </FadeUp>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Form */}
            <FadeUp className="lg:col-span-7">
              {resStatus === "success" ? (
                <div className="py-12 border-y border-border text-center">
                  <p className="font-display text-2xl text-ink mb-2">Demande recue</p>
                  <p className="text-inkMuted text-sm">Nous vous appelons pour confirmer.</p>
                </div>
              ) : (
                <form onSubmit={submitReservation} className="flex flex-col gap-8">
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="ed-small block mb-3">Nom complet</label>
                      <input required placeholder="Votre nom" value={reservation.name} onChange={updateReservation("name")} className="ed-input" />
                    </div>
                    <div>
                      <label className="ed-small block mb-3">Telephone</label>
                      <input required placeholder="+212 6 00 00 00 00" value={reservation.phone} onChange={updateReservation("phone")} className="ed-input" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                      <label className="ed-small block mb-3">Date</label>
                      <input required type="date" min={new Date().toISOString().split("T")[0]} value={reservation.date} onChange={updateReservation("date")} className="ed-input" />
                    </div>
                    <div>
                      <label className="ed-small block mb-3">Heure</label>
                      <input required type="time" value={reservation.time} onChange={updateReservation("time")} className="ed-input" />
                    </div>
                  </div>
                  <div>
                    <label className="ed-small block mb-4">Convives</label>
                    <div className="flex gap-3">
                      {[2,4,6,8].map(n => (
                        <button type="button" key={n} onClick={() => setReservation(r=>({...r,guests:n}))} className={`ed-guest ${reservation.guests===n?"active":""}`}>{n===8?"8+":n}</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={resStatus==="loading"} className="ed-cta mt-2 self-start disabled:opacity-50">
                    {resStatus==="loading"?"Envoi...":"Reserver"}
                  </button>
                  {resStatus==="error" && <p className="text-xs text-red-500">Erreur de configuration.</p>}
                </form>
              )}
            </FadeUp>

            {/* Info */}
            <div className="lg:col-span-4 lg:col-start-9">
              <FadeUp delay={1}>
                <div className="ed-info">
                  <p className="ed-small mb-3">Adresse</p>
                  <p className="font-display text-xl text-ink mb-1">Rue d'Oran</p>
                  <p className="text-inkMuted text-sm">Rabat, Maroc</p>
                </div>
              </FadeUp>
              <FadeUp delay={2}>
                <div className="ed-info">
                  <p className="ed-small mb-3">Horaires</p>
                  <p className="text-ink text-sm">Lundi — Dimanche</p>
                  <p className="text-ink font-medium text-sm mt-1">{info?.hours || "08:00 — 23:00"}</p>
                  <p className="text-gold text-xs mt-3 font-medium">Couscous — Vendredi</p>
                </div>
              </FadeUp>
              <FadeUp delay={3}>
                <div className="ed-info">
                  <p className="ed-small mb-3">Telephone</p>
                  <a href={`tel:${(info?.phone||"+212537262658").replace(/\s/g,"")}`} className="font-display text-xl text-ink hover:text-gold transition-colors">
                    {info?.phone || "+212 5 37 26 26 58"}
                  </a>
                  <p className="text-inkFaint text-xs mt-2">Prix moyen : {info?.avg_price || "150-250 MAD"}</p>
                </div>
              </FadeUp>
              <FadeUp delay={4} className="aspect-video overflow-hidden border border-border">
                <iframe title="Carte" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                  src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
                  className="w-full h-full border-0" />
              </FadeUp>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
