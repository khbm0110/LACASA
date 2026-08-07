export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        'bg-darker': '#050505',
        'bg-card': '#141414',
        'bg-card-hover': '#1a1a1a',
        fg: '#f5f5f5',
        'fg-dim': '#c0c0c0',
        muted: '#6a6a6a',
        accent: '#D2491F',
        'accent-bright': '#FF7A3D',
        'accent-dim': '#923315',
        'accent-glow': 'rgba(210, 73, 31, 0.45)',
        gold: '#D4A84B',
        'gold-dim': '#8a6e30',
        silver: '#C8C8C8',
        'silver-dim': '#5a5a5a',
        line: '#1f1f1f',
        'line-light': '#2a2a2a',
        basil: '#7C9A5C',
        ink: '#f5f5f5',
        inkdim: '#c0c0c0',
        paper: '#f5f5f5',
        tomato: '#D2491F',
        tomatoglow: '#FF7A3D',
        bgsoft: '#141414',
      },
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        heading: ['Oswald', 'sans-serif'],
        body: ['Archivo', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      maxWidth: {
        container: '1600px',
      },
    }
  },
  plugins: []
}
