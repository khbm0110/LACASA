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
    supabase.from("restaurant_info").select("address, phone").eq("id", 1).single().then(({ data }) => { if (data) setInfo(data) })
  }, [])

  return (
    <footer ref={ref} className="border-t border-border bg-cream py-14">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="section-full max-w-6xl mx-auto"
      >
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div>
            <h2 className="font-serif text-2xl text-bark mb-3">
              La Casa <span className="text-terracotta italic">Di Carta</span>
            </h2>
            <p className="text-barklight text-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm text-bark uppercase tracking-wider mb-4">Contact</h4>
            <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`} className="block text-barklight text-sm hover:text-terracotta transition-colors mb-1">
              {info?.phone || "+212 5 37 26 26 58"}
            </a>
            <p className="text-barklight text-sm">{info?.address || "Rue d'Oran, Rabat"}</p>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-sm text-bark uppercase tracking-wider mb-4">Horaires</h4>
            <p className="text-barklight text-sm">{t("footer.days")}</p>
            <p className="text-barklight text-sm">{t("footer.hours_value")}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-8 border-t border-border text-xs text-stonelight">
          <span>{t("footer.copyright")}</span>
          <span>{t("footer.note")}</span>
        </div>
      </motion.div>
    </footer>
  )
}