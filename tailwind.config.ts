import type { Config } from 'tailwindcss';

// VTM brand palette (PRD §11.4). Keep these names stable — used across components.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#F5C400',
        ink: '#1A1A1A',
        card: '#242424',
        success: '#4CAF50',
        danger: '#F44336',
        muted: '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        phone: '480px',
      },
      minHeight: {
        tap: '40px',
      },
      minWidth: {
        tap: '40px',
      },
    },
  },
  plugins: [],
};

export default config;
