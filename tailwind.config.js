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
          DEFAULT: '#34251F',
          dark: '#3E0B18',
          light: '#59463E'
        },
        'astro-purple': {
          DEFAULT: '#650F23',
          dark: '#4E0B1B',
          light: '#FAEEF0',
          subtle: '#EDD9DC'
        },
        'astro-gold': {
          DEFAULT: '#D5AA51',
          dark: '#87601F',
          light: '#FFF9EF',
          border: '#E8D7BA'
        },
        'astro-surface': '#FFFAF2',
        'astro-cream': '#FFF9EF',
        'astro-border': '#E8D7BA',
        'astro-border-subtle': '#F1ECE1',
        'astro-text': {
          DEFAULT: '#34251F',
          muted: '#64748B',
          secondary: '#475569'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Noto Serif Devanagari', 'Georgia', 'serif'],
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
