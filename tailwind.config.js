export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // === Nature Distilled - Warm Mediterranean Restaurant ===
        cream: '#F5F0E1',
        creamdark: '#EDE6D3',
        creamlight: '#FAF7F0',
        sand: '#D4C4A8',
        sandlight: '#E8DCC8',
        terracotta: '#C67B5C',
        terracottadark: '#A65E3F',
        terracottalight: '#D4916F',
        clay: '#B5651D',
        olive: '#6B7B3C',
        olivelight: '#8FA662',
        bark: '#3D2E1F',
        barklight: '#5C4A3A',
        stone: '#8C7B6B',
        stonelight: '#B5A99A',
        white: '#FFFFFF',
        border: '#E2D5C3',
        borderlight: '#EDE6D3',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Karla"', 'sans-serif'],
        sans: ['"Karla"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        organic: '16px',
        organicLg: '24px',
        organicXl: '32px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(61,46,31,0.08)',
        softLg: '0 8px 40px rgba(61,46,31,0.10)',
        softXl: '0 16px 64px rgba(61,46,31,0.12)',
        warm: '0 4px 24px rgba(198,123,92,0.15)',
        warmLg: '0 8px 40px rgba(198,123,92,0.20)',
      }
    }
  },
  plugins: []
}
