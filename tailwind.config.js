export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === NEW PALETTE: "Sicilian Gold" - Warm Luxury ===
        bg: '#0E0C0A',
        bgdarker: '#080705',
        bgsoft: '#1A1714',
        bgsofthover: '#242019',
        paper: '#FAF6EE',
        ink: '#FAF6EE',
        inkdim: '#B8B0A4',
        muted: '#7A7268',
        // Primary accent: Rich Amber Gold
        tomato: '#C8963E',
        tomatoglow: '#E8B94A',
        tomatodim: '#8B6A2F',
        // Secondary accent: Terracotta
        gold: '#B85C3A',
        silver: '#D6CFC5',
        silverdim: '#5C5650',
        // Herbal green
        basil: '#6B8F5E',
        // Lines & borders
        line: '#262220',
        linelight: '#332E29'
      },
      fontFamily: {
        // Elegant serif for titles (replaces Bebas Neue)
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        // Clean modern for subheadings
        heading: ['"DM Sans"', 'sans-serif'],
        // Body text
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
