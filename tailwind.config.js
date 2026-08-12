export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Cinematic Dark + Gold ===
        void:       '#0C0A09',
        abyss:      '#1C1917',
        surface:    '#292524',
        surfaceHi:  '#44403C',
        ghost:      '#78716C',
        smoke:      '#A8A29E',
        ash:        '#D6D3D1',
        pale:       '#E8ECF0',
        gold:       '#A16207',
        goldBright: '#CA8A04',
        goldGlow:   '#F59E0B',
        goldMist:   'rgba(161,98,7,0.15)',
        goldMist2:  'rgba(202,138,4,0.08)',
        ivory:      '#FAFAF9',
        danger:     '#DC2626',
      },
      fontFamily: {
        display: ['"Playfair Display SC"', 'Georgia', 'serif'],
        heading: ['"Playfair Display SC"', 'Georgia', 'serif'],
        body:    ['"Karla"', 'system-ui', 'sans-serif'],
        sans:    ['"Karla"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero':    ['clamp(3rem, 9vw, 8rem)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '400' }],
        'display': ['clamp(2.5rem, 6vw, 5.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'h2':      ['clamp(1.75rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'sub':     ['clamp(1.1rem, 2vw, 1.5rem)', { lineHeight: '1.4' }],
      },
      spacing: {
        'section': 'clamp(6rem, 14vw, 12rem)',
        'gap':     'clamp(2rem, 5vw, 4rem)',
      },
      maxWidth: {
        'prose': '40rem',
        'wide':  '90rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    }
  },
  plugins: []
}
