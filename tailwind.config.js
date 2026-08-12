export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === "Nature Distilled" - Warm Mediterranean ===
        bg: '#F5F0E1',
        bgdarker: '#EDE6D3',
        bgsoft: '#FFFFFF',
        bgsofthover: '#FBF8F0',
        paper: '#FFFFFF',
        ink: '#2C1810',
        inkdim: '#6B5B4E',
        muted: '#9B8B7E',
        // Primary accent: Terracotta
        tomato: '#C67B5C',
        tomatoglow: '#D4916F',
        tomatodim: '#A65E3F',
        // Secondary: Warm Clay
        gold: '#B5651D',
        silver: '#3D2E1F',
        silverdim: '#C4B8A8',
        // Herbal olive green
        basil: '#6B7B3C',
        basilsoft: '#8FA662',
        // Sand beige
        sand: '#D4C4A8',
        sandlight: '#E8DCC8',
        // Lines & borders
        line: '#E2D5C3',
        linelight: '#EDE6D3'
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Karla"', 'sans-serif'],
        sans: ['"Karla"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
