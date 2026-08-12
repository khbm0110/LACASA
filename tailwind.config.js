export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Luxury Editorial — Black + Gold on Warm White ===
        bg:         '#FAFAF9',
        bgAlt:      '#F5F5F4',
        surface:    '#FFFFFF',
        ink:        '#0C0A09',
        inkSoft:    '#44403C',
        inkMuted:   '#78716C',
        inkFaint:   '#A8A29E',
        gold:       '#A16207',
        goldLight:  '#CA8A04',
        goldPale:   '#FEF3C7',
        border:     '#E7E5E4',
        borderSoft: '#D6D3D1',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Montserrat"', 'system-ui', 'sans-serif'],
        sans:    ['"Montserrat"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'display': ['clamp(3.5rem, 10vw, 9rem)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '300' }],
        'heading': ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'sub':     ['clamp(1.25rem, 2vw, 1.75rem)', { lineHeight: '1.3', letterSpacing: '0.01em' }],
      },
      spacing: {
        'section': 'clamp(5rem, 12vw, 10rem)',
        'gap':     'clamp(1.5rem, 4vw, 3rem)',
      },
      maxWidth: {
        'prose': '42rem',
        'wide':  '90rem',
      },
    }
  },
  plugins: []
}
