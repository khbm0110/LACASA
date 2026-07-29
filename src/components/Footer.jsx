export default function Footer() {
  return (
    <footer className="mt-32 border-t border-line py-12 px-6 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-10 pb-8">
        <h2 className="font-serif text-3xl max-w-[9ch]">On vous attend a table.</h2>
        <div className="flex gap-14 flex-wrap">
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">Contact</h4>
            <a href="tel:+212537262658" className="block text-inkdim text-sm mb-2">+212 5 37 26 26 58</a>
            <p className="text-inkdim text-sm">Rue d Oran, Rabat</p>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-widest text-gold mb-3">Horaires</h4>
            <p className="text-inkdim text-sm">Lun - Dim</p>
            <p className="text-inkdim text-sm">8h - 23h</p>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto flex justify-between border-t border-line pt-6 text-xs text-inkdim flex-wrap gap-2">
        <span>(c) 2026 La Casa Di Carta</span>
        <span>Donnees a verifier avant mise en production</span>
      </div>
    </footer>
  )
}
