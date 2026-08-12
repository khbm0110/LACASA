import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export default function Footer() {
  const { t } = useTranslation()
  const [info, setInfo] = useState(null)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  useEffect(() => {
    supabase.from("restaurant_info").select("address,phone").eq("id",1).single().then(({data})=>{if(data)setInfo(data)})
  }, [])

  return (
    <footer ref={ref} className="border-t border-border bg-bg py-section">
      <motion.div
        initial={{opacity:0,y:20}}
        animate={inView?{opacity:1,y:0}:{}}
        transition={{duration:0.6}}
        className="max-w-wide mx-auto px-5 md:px-10"
      >
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <h2 className="font-display text-3xl text-ink mb-4">
              La Casa <em className="text-gold">Di Carta</em>
            </h2>
            <p className="text-inkMuted text-sm leading-relaxed max-w-sm">{t("footer.tagline")}</p>
          </div>
          <div className="md:col-span-3 md:col-start-7">
            <p className="ed-small mb-4">Contact</p>
            <a href={`tel:${(info?.phone||"+212537262658").replace(/\s/g,"")}`} className="block text-ink text-sm hover:text-gold transition-colors mb-1">
              {info?.phone || "+212 5 37 26 26 58"}
            </a>
            <p className="text-inkMuted text-sm">{info?.address || "Rue d'Oran, Rabat"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="ed-small mb-4">Horaires</p>
            <p className="text-ink text-sm">{t("footer.days")}</p>
            <p className="text-inkMuted text-sm">{t("footer.hours_value")}</p>
          </div>
        </div>
        <div className="ed-divider-full mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-inkFaint text-xs">{t("footer.copyright")}</span>
          <span className="text-inkFaint text-xs">{t("footer.note")}</span>
        </div>
      </motion.div>
    </footer>
  )
}