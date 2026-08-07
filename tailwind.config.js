export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f0e0d',
        bgsoft: '#181613',
        bgcard: '#201d18',
        paper: '#F8F4EC',
        ink: '#F8F4EC',
        inkdim: '#A39988',
        tomato: '#E04F22',
        tomatoglow: '#FF6B3D',
        gold: '#E5BA55',
        goldlight: '#F3D68A',
        basil: '#6B8E4E',
        line: 'rgba(248,244,236,0.14)',
        glass: 'rgba(32, 29, 24, 0.7)',
        glassborder: 'rgba(229, 186, 85, 0.2)'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace']
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(224, 79, 34, 0.4)',
        goldglow: '0 0 25px -5px rgba(229, 186, 85, 0.3)',
        card: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backgroundImage: {
        'radial-glow': 'radial-gradient(circle at center, rgba(229, 186, 85, 0.15) 0%, transparent 70%)',
        'tomato-gradient': 'linear-gradient(135deg, #E04F22 0%, #FF6B3D 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4A84B 0%, #F3D68A 100%)'
      }
    }
  },
  plugins: []
}
