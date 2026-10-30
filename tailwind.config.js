/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./website/frontend/**/*.{html,js}",
    "./ai/frontend/**/*.{html,js}"
  ],
  theme: {
    extend: {
      colors: {
        'astro-navy': {
          DEFAULT: '#1E1B4B',
          dark: '#141236',
          light: '#2E2870'
        },
        'astro-purple': {
          DEFAULT: '#4A1B9A',
          dark: '#3B1580',
          light: '#F5F3FF',
          subtle: '#DDD6FE'
        },
        'astro-gold': {
          DEFAULT: '#F59E0B',
          dark: '#B45309',
          light: '#FFFBEB',
          border: '#FCD34D'
        },
        'astro-surface': '#FAF8F2',
        'astro-cream': '#FFFDF7',
        'astro-border': '#E7E2D8',
        'astro-border-subtle': '#F1ECE1',
        'astro-text': {
          DEFAULT: '#211D50',
          muted: '#64748B',
          secondary: '#475569'
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif']
      },
      boxShadow: {
        'astro-sm': '0 2px 6px rgba(33, 29, 80, 0.06)',
        'astro-md': '0 4px 16px rgba(33, 29, 80, 0.08)',
        'astro-lg': '0 10px 28px rgba(33, 29, 80, 0.12)',
        'astro-purple': '0 4px 14px rgba(116, 57, 234, 0.28)'
      },
      maxWidth: {
        'content': '1280px',
        'narrow': '960px'
      }
    },
  },
  plugins: [],
}
