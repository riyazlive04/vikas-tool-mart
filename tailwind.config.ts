import type { Config } from 'tailwindcss';

// VTM brand palette (PRD §11.4) refined into a dark-UI token scale.
// Brand colors are unchanged (gold #F5C400, ink #1A1A1A, card #242424,
// success #4CAF50, danger #F44336). Added: layered surfaces (elevation by
// luminance, per dark-mode best practice), a gold hover shade, hairline border,
// soft shadows, and an accessibility-corrected muted (was #888 → fails 4.5:1).
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1A1A1A', // app background (brand)
        surface: '#202020', // raised panel
        card: '#242424', // card (brand)
        elevated: '#2C2C2C', // inputs / hover surface
        line: 'rgba(255,255,255,0.08)', // hairline border for elevation
        gold: {
          DEFAULT: '#F5C400',
          600: '#E0B400', // hover/pressed
          700: '#C89E00',
        },
        success: { DEFAULT: '#4CAF50', soft: '#66BB6A' },
        danger: { DEFAULT: '#F44336', soft: '#EF6E64' },
        muted: '#A1A1A1', // secondary text - ~5.3:1 on ink (WCAG AA)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        phone: '480px',
      },
      minHeight: { tap: '40px' },
      minWidth: { tap: '40px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.45)',
        pop: '0 10px 30px rgba(0,0,0,0.5)',
        'gold-glow': '0 4px 14px rgba(245,196,0,0.25)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
