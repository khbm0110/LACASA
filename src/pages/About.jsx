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
    <section className="page-wrap">
      <div className="section-marker" style={{ marginBottom: "1.5rem" }}><span>Informations</span></div>
      <h1 className="page-title">{t("about.title")}</h1>
      <p className="page-lede">{t("about.subtitle")}</p>

      <div className="rg-split-booking" style={{ gap: "2rem" }}>
        <div className="info-card notch-corner">
          <Row label={t("about.address")} value={info?.address || "Rue d'Oran, Rabat"} />
          <Row label={t("about.phone")} value={info?.phone || "+212 5 37 26 26 58"} />
          <Row label={t("about.hours")} value={info?.hours || t("about.hours_value")} />
          <Row label={t("about.avg_price")} value={info?.avg_price || t("about.avg_price_value")} />
          <Row label={t("about.couscous")} value={t("about.couscous_value")} last />
        </div>
        <div className="notch-corner" style={{ overflow: "hidden", border: "1px solid #1f1f1f", minHeight: 260 }}>
          <iframe
            title="Carte"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps?q=La+Casa+Di+Carta,Rue+d'Oran,Rabat,Morocco&output=embed"
            style={{ width: "100%", height: "100%", border: 0, filter: "grayscale(100%) contrast(1.2) brightness(0.7)" }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-10">
        <span className="info-badge"><i className="fas fa-utensils" /> TRATTORIA ITALIENNE</span>
        <span className="info-badge"><i className="fas fa-motorcycle" /> LIVRAISON DISPONIBLE</span>
      </div>
    </section>
  )
}

function Row({ label, value, last }) {
  return (
    <div className="kv-row" style={last ? { borderBottom: "none" } : undefined}>
      <span className="kv-label">{label}</span>
      <span className="kv-value">{value}</span>
    </div>
  )
}
