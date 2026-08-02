// Petits effets sonores du POS, generes directement avec l API Web Audio
// (pas de fichier audio a charger). Toujours appeles depuis un clic
// (geste utilisateur), donc pas de souci avec les politiques anti-autoplay
// des navigateurs.
//
// Comme sur les caisses reelles : un bip discret a chaque ajout au ticket,
// un bip plus grave au retrait, un buzz court en cas d erreur (paiement
// invalide, option obligatoire manquante...) et le "ding-ding" a
// l encaissement. Le staff peut couper le son via SOUND_KEY (bouton
// haut-parleur dans le POS) ; le reglage est memorise par appareil.
const SOUND_KEY = "lcdc_pos_sound_muted"

export function isPosSoundMuted() {
  return localStorage.getItem(SOUND_KEY) === "1"
}

export function setPosSoundMuted(muted) {
  localStorage.setItem(SOUND_KEY, muted ? "1" : "0")
}

function playNotes(notes) {
  if (isPosSoundMuted()) return
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    let maxEnd = 0
    notes.forEach(({ freq, delay, duration = 0.16, gain: peak = 0.22, type = "sine" }) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(peak, now + delay + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + delay)
      osc.stop(now + delay + duration + 0.02)
      maxEnd = Math.max(maxEnd, delay + duration + 0.05)
    })
    setTimeout(() => ctx.close(), maxEnd * 1000 + 200)
  } catch {
    // Web Audio indisponible (navigateur tres ancien) : on ignore
    // silencieusement, ce n est qu un effet sonore de confort.
  }
}

// Ajout d une ligne au ticket
export function playAddBeep() {
  playNotes([{ freq: 1046.5, delay: 0, duration: 0.09, gain: 0.18 }])
}

// Retrait / diminution d une ligne du ticket
export function playRemoveBeep() {
  playNotes([{ freq: 523.25, delay: 0, duration: 0.1, gain: 0.16 }])
}

// Erreur (paiement invalide, option obligatoire manquante...)
export function playErrorBuzz() {
  playNotes([
    { freq: 220, delay: 0, duration: 0.14, gain: 0.22, type: "square" },
    { freq: 196, delay: 0.12, duration: 0.16, gain: 0.22, type: "square" },
  ])
}

// Encaissement reussi ("ding-ding" - deux notes ascendantes)
export function playPosChime() {
  playNotes([
    { freq: 880, delay: 0, duration: 0.28, gain: 0.3 },
    { freq: 1318.5, delay: 0.09, duration: 0.28, gain: 0.3 },
  ])
}
