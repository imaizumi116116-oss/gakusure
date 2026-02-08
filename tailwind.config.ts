import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink))',
        muted: 'rgb(var(--muted))',
        bg: 'rgb(var(--bg))',
        card: 'rgb(var(--card))',
        border: 'rgb(var(--border))',
        accent: 'rgb(var(--accent))',
        accentSoft: 'rgb(var(--accent-soft))',
        ring: 'rgb(var(--ring))',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      boxShadow: {
        soft: '0 12px 40px -24px rgba(0,0,0,0.45)',
        lift: '0 14px 30px -20px rgba(37,26,16,0.3)',
      },
      backgroundImage: {
        glow: 'radial-gradient(circle at top, rgba(255,255,255,0.8), rgba(255,255,255,0))',
      },
    },
  },
  plugins: [],
};

export default config;
