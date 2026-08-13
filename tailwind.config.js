export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        bgdarker: '#050505',
        bgsoft: '#141414',
        bgsofthover: '#1a1a1a',
        paper: '#f5f5f5',
        ink: '#f5f5f5',
        inkdim: '#c0c0c0',
        muted: '#6a6a6a',
        tomato: '#D2491F',
        tomatoglow: '#FF7A3D',
        tomatodim: '#923315',
        gold: '#D4A84B',
        silver: '#C8C8C8',
        silverdim: '#5a5a5a',
        basil: '#7C9A5C',
        line: '#1f1f1f',
        linelight: '#2a2a2a'
      },
      fontFamily: {
        // font-serif reste le nom de classe utilise dans tout le projet
        // (titres) mais pointe maintenant vers Bebas Neue, comme le nouveau
        // gabarit HTML - ainsi tous les titres du site basculent sans
        // toucher chaque fichier un par un.
        serif: ['"Bebas Neue"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
        sans: ['Archivo', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
