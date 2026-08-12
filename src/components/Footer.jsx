import { useEffect, useState, useRef } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { motion, useInView } from "framer-motion"

export default function Footer() {
  const { t } = useTranslation()
  const [info, setInfo] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  useEffect(() => {
    supabase.from("restaurant_info").select("address,phone").eq("id",1).single().then(({data})=>{if(data)setInfo(data)})
  }, [])

  return (
    <footer ref={ref} className="relative border-t border-white/[0.04] bg-void py-section">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gold/[0.03] rounded-full blur-[120px]" />
      </div>
      <motion.div
        initial={{opacity:0,y:30}}
        animate={inView?{opacity:1,y:0}:{}}
        transition={{duration:0.7,ease:[0.16,1,0.3,1]}}
        className="relative z-10 max-w-wide mx-auto px-5 md:px-10"
      >
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <h2 className="font-display text-3xl text-ivory mb-4">
              La Casa <em className="text-goldBright">Di Carta</em>
            </h2>
            <p className="t-muted max-w-sm">{t("footer.tagline")}</p>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <p className="t-small mb-4">Contact</p>
            <a href={`tel:${(info?.phone||"+212537262658").replace(/\s/g,"")}`} className="block text-ivory/80 text-sm hover:text-goldBright transition-colors duration-300 mb-1">
              {info?.phone || "+212 5 37 26 26 58"}
            </a>
            <p className="t-muted text-sm">{info?.address || "Rue d'Oran, Rabat"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="t-small mb-4">Horaires</p>
            <p className="text-ivory/80 text-sm">{t("footer.days")}</p>
            <p className="t-muted text-sm mt-1">{t("footer.hours_value")}</p>
          </div>
        </div>
        <div className="divider-line mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-smoke/40 text-xs">{t("footer.copyright")}</span>
          <span className="text-smoke/40 text-xs">{t("footer.note")}</span>
        </div>
      </motion.div>
    </footer>
  )
}