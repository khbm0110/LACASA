import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { motion } from "framer-motion"

const footerStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const footerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function Footer() {
  const { t } = useTranslation()
  const [info, setInfo] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("restaurant_info").select("address, phone").eq("id", 1).single()
      if (data) setInfo(data)
    }
    load()
  }, [])

  return (
    <motion.footer
      className="mt-32 border-t border-line py-12 px-6 md:px-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={footerStagger}
    >
      <motion.div variants={footerItem} className="max-w-6xl mx-auto flex flex-wrap justify-between gap-10 pb-8">
        <motion.h2
          className="font-serif text-3xl max-w-[9ch]"
          whileHover={{ color: "#D2491F" }}
          transition={{ duration: 0.3 }}
        >
          {t("footer.tagline")}
        </motion.h2>
        <div className="flex gap-14 flex-wrap">
          <motion.div variants={footerItem}>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">{t("footer.contact")}</h4>
            <motion.a
              href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`}
              className="block text-inkdim text-sm mb-2 hover:text-ink transition-colors"
              whileHover={{ x: 3 }}
            >
              {info?.phone || "+212 5 37 26 26 58"}
            </motion.a>
            <p className="text-inkdim text-sm">{info?.address || "Rue d'Oran, Rabat"}</p>
          </motion.div>
          <motion.div variants={footerItem}>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">{t("footer.hours_label")}</h4>
            <p className="text-inkdim text-sm">{t("footer.days")}</p>
            <p className="text-inkdim text-sm">{t("footer.hours_value")}</p>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        variants={footerItem}
        className="max-w-6xl mx-auto flex justify-between border-t border-line pt-6 text-xs text-inkdim flex-wrap gap-2"
      >
        <span>{t("footer.copyright")}</span>
        <span>{t("footer.note")}</span>
      </motion.div>
    </motion.footer>
  )
}
