import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { supabase } from "../lib/supabaseClient"

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
    <footer className="border-t border-line bg-black py-16 relative overflow-hidden">
      <div className="max-w-container mx-auto px-6 lg:px-10">

        <div className="font-display text-[18vw] md:text-[14vw] leading-none text-stroke opacity-30 absolute bottom-0 left-0 right-0 text-center pointer-events-none select-none">
          LA CASA
        </div>

        <div className="relative grid md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-accent flex items-center justify-center">
                <i className="fas fa-utensils text-black"></i>
              </div>
              <div>
                <div className="font-display text-2xl leading-none tracking-wider">LA CASA DI CARTA</div>
                <div className="font-mono text-[10px] text-muted tracking-[0.3em] mt-0.5">TRATTORIA · RABAT</div>
              </div>
            </div>
            <p className="text-fg-dim text-sm leading-relaxed max-w-md mb-6">
              {t("footer.tagline")}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center">
                <i className="fab fa-instagram text-sm"></i>
              </a>
              <a href="#" className="w-10 h-10 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center">
                <i className="fab fa-facebook text-sm"></i>
              </a>
              <a href="#" className="w-10 h-10 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center">
                <i className="fab fa-tiktok text-sm"></i>
              </a>
              <a href={`https://wa.me/${(info?.phone || "+212537262658").replace(/[^0-9]/g, "")}`} className="w-10 h-10 border border-line-light hover:border-accent hover:bg-accent hover:text-black transition-all flex items-center justify-center">
                <i className="fab fa-whatsapp text-sm"></i>
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-4">Navigation</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="/menu" className="text-fg-dim hover:text-fg link-underline">Menu</a></li>
              <li><a href="/reserver" className="text-fg-dim hover:text-fg link-underline">Reserver</a></li>
              <li><a href="/livraison" className="text-fg-dim hover:text-fg link-underline">Livraison</a></li>
              <li><a href="/galerie" className="text-fg-dim hover:text-fg link-underline">Galerie</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-4">Restaurant</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="/a-propos" className="text-fg-dim hover:text-fg link-underline">A propos</a></li>
              <li><a href="/avis" className="text-fg-dim hover:text-fg link-underline">Avis</a></li>
              <li><a href="/evenements" className="text-fg-dim hover:text-fg link-underline">Evenements</a></li>
              <li><a href="/blog" className="text-fg-dim hover:text-fg link-underline">Blog</a></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h5 className="font-mono text-[10px] text-accent tracking-[0.2em] uppercase mb-4">Contact</h5>
            <div className="space-y-3">
              <div>
                <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1">Adresse</div>
                <p className="text-fg-dim text-sm">{info?.address || "Rue d'Oran, Rabat"}</p>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1">Telephone</div>
                <a href={`tel:${(info?.phone || "+212537262658").replace(/\s/g, "")}`} className="text-fg-dim text-sm hover:text-accent transition-colors font-mono">
                  {info?.phone || "+212 5 37 26 26 58"}
                </a>
              </div>
              <div>
                <div className="font-mono text-[10px] text-muted tracking-[0.15em] uppercase mb-1">Horaires</div>
                <p className="text-fg-dim text-sm">{t("footer.days")} · {t("footer.hours_value")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-t border-line pt-6 flex flex-col md:flex-row justify-between gap-4 text-muted font-mono text-[11px] tracking-[0.15em] uppercase">
          <div>{t("footer.copyright")}</div>
          <div className="flex gap-6">
            <span>{t("footer.note")}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
