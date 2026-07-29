export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#141210',
        bgsoft: '#1D1A16',
        paper: '#F4EEE0',
        ink: '#F4EEE0',
        inkdim: '#B8B0A0',
        tomato: '#D2491F',
        tomatoglow: '#FF7A3D',
        gold: '#D4A84B',
        basil: '#7C9A5C',
        line: 'rgba(244,238,224,0.12)'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      }
    }
  },
  plugins: []
}
