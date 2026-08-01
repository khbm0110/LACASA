// Petit "ding-ding" de confirmation pour le POS, genere directement avec
// l API Web Audio (deux notes ascendantes) - pas besoin de fichier audio.
// Toujours appelee depuis un clic (geste utilisateur), donc pas de souci
// avec les politiques anti-autoplay des navigateurs.
export function playPosChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    const notes = [
      { freq: 880, delay: 0 },
      { freq: 1318.5, delay: 0.09 }
    ]
    notes.forEach(({ freq, delay }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(0.3, now + delay + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + 0.3)
    })
    setTimeout(() => ctx.close(), 700)
  } catch {
    // Web Audio indisponible (navigateur tres ancien) : on ignore
    // silencieusement, ce n est qu un effet sonore de confort.
  }
}
