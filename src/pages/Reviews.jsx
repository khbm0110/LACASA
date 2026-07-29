export default function Reviews() {
  const reviews = [
    { stars: 5, text: "Le poisson recommande par le serveur etait parfait, une belle touche de pesto." },
    { stars: 4, text: "Bel endroit, bons plats - l emince de boeuf et de poulet sont particulierement reussis." },
    { stars: 3, text: "Bon potentiel sur les pizzas, a surveiller sur la cuisson." },
    { stars: 4, text: "Jus frais tres bons, service correct, ambiance conviviale en soiree." }
  ]

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-8 py-20">
      <h1 className="font-serif text-4xl mb-2">Avis Google</h1>
      <div className="flex items-center gap-4 mb-12">
        <span className="font-serif text-5xl">4.2</span>
        <div>
          <p className="text-gold">* * * * ☆</p>
          <p className="text-inkdim text-sm">Base sur 324 avis</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-bgsoft border border-line rounded-2xl p-5">
            <p className="text-gold text-sm mb-2">{"* ".repeat(r.stars)}</p>
            <p className="text-sm text-inkdim">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
