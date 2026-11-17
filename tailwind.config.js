/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./website/frontend/**/*.{html,js,jsx,ts,tsx}",
    "./ai/frontend/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Brand Primary Forest & Sage Colors
        forest: {
          DEFAULT: '#164B32',
          deep: '#103B29',
          light: '#1F6343'
        },
        sage: {
          DEFAULT: '#DDEBD5',
          light: '#EDF4E8',
          mint: '#E6F0DF',
          dark: '#B8D1AB'
        },
        // Surfaces & Backgrounds
        ivory: {
          DEFAULT: '#FFFDF5',
          main: '#FAF9F2',
          card: '#FFFFFF',
          secondary: '#F2F5EA'
        },
        // Antique Gold Accents
        gold: {
          DEFAULT: '#C49A3A',
          antique: '#A77B25',
          light: '#E7D39B',
          bg: '#FBF3DA',
          border: '#D8C28A'
        },
        // Typography Colors
        'forest-text': {
          DEFAULT: '#183C2B',
          secondary: '#56675B',
          muted: '#849087',
          white: '#FFFFFF'
        },
        // Legacy Aliases mapped to new Sage Green + Antique Gold system
        'astro-navy': {
          DEFAULT: '#183C2B',
          dark: '#103B29',
          light: '#56675B'
        },
        'astro-purple': {
          DEFAULT: '#164B32',
          dark: '#103B29',
          light: '#EDF4E8',
          subtle: '#DDEBD5'
        },
        'astro-gold': {
          DEFAULT: '#C49A3A',
          dark: '#A77B25',
          light: '#FFFDF5',
          border: '#E7D39B'
        },
        'astro-surface': '#FAF9F2',
        'astro-cream': '#FFFDF5',
        'astro-border': '#DDEBD5',
        'astro-border-subtle': '#EDF4E8',
        'astro-text': {
          DEFAULT: '#183C2B',
          muted: '#849087',
          secondary: '#56675B'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Noto Serif Devanagari', 'Georgia', 'serif'],
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif']
      },
      boxShadow: {
        'astro-sm': '0 2px 6px rgba(22, 75, 50, 0.05)',
        'astro-md': '0 4px 16px rgba(22, 75, 50, 0.08)',
        'astro-lg': '0 10px 28px rgba(22, 75, 50, 0.12)',
        'astro-gold': '0 4px 14px rgba(196, 154, 58, 0.22)'
      },
      maxWidth: {
        'content': '1280px',
        'narrow': '960px'
      }
    },
  },
  plugins: [],
}
