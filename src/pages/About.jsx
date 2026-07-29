export default function About() {
  return (
    <section className="max-w-4xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Horaires et Adresse</h1>
      <p className="text-inkdim mb-10">Venez nous rendre visite a Rabat.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-bgsoft border border-line rounded-2xl p-8">
          <Row label="Adresse" value="Rue d Oran, Rabat" />
          <Row label="Telephone" value="+212 5 37 26 26 58" />
          <Row label="Horaires" value="Tous les jours, 8h - 23h" />
          <Row label="Prix moyen" value="150 - 250 MAD / pers." />
          <Row label="Couscous" value="Vendredi uniquement" last />
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
