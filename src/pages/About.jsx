import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"
import { useSEO } from "../lib/useSEO"

export default function About() {
  const { t } = useTranslation()
  useSEO({ title: t("about.title"), description: t("about.subtitle") })
  const [info, setInfo] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("restaurant_info").select("address, phone, hours, avg_price").eq("id", 1).single()
      if (data) setInfo(data)
    }
    load()
  }, [])

  return (
    <section className="max-w-4xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">{t("about.title")}</h1>
      <p className="text-inkdim mb-10">{t("about.subtitle")}</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-bgsoft border border-line rounded-2xl p-8">
          <Row label={t("about.address")} value={info?.address || "Rue d'Oran, Rabat"} />
          <Row label={t("about.phone")} value={info?.phone || "+212 5 37 26 26 58"} />
          <Row label={t("about.hours")} value={info?.hours || t("about.hours_value")} />
          <Row label={t("about.avg_price")} value={info?.avg_price || t("about.avg_price_value")} />
          <Row label={t("about.couscous")} value={t("about.couscous_value")} last />
        </div>
        <div className="rounded-2xl overflow-hidden border border-line aspect-[4/3.6]">
          <iframe
            title="Carte"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </section>
  )
}

function Row({ label, value, last }) {
  return (
    <div className={`flex justify-between py-3.5 text-sm ${last ? "" : "border-b border-line"}`}>
      <span className="font-mono text-[11px] uppercase tracking-widest text-inkdim">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
