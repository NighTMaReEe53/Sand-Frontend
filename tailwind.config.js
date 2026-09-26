/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--bg, #FFFFFF)',
          subtle: 'var(--surface-alt, #F7F7F5)',
          elevated: 'var(--surface-raised, #FFFFFF)',
        },
        surface: {
          DEFAULT:    'var(--surface, #FFFFFF)',
          alt:        'var(--surface-alt, #F7F7F5)',
          raised:     'var(--surface-raised, #FFFFFF)',
          card:       'var(--surface, #FFFFFF)',
          cardHover:  'var(--surface-alt, #F7F7F5)',
          subtle:     'var(--surface-alt, #F7F7F5)',
          border:     'var(--line, #E5E5E2)',
          borderLight:'var(--line, #E5E5E2)',
        },
        gold: {
          50: '#FBF7EE',
          100: '#F5ECD2',
          200: '#EBD8A5',
          300: '#DFC277',
          400: '#D5AE4F',
          500: '#C9A15A', // Primary Gold
          600: '#B88E3E',
          700: '#926F2D',
          800: '#6D5223',
          900: '#493719',
          light: '#E8C97A',
          dark: '#9E7B35',
        },
        ivory: {
          DEFAULT: 'var(--ink, #F4EFE6)',
          muted: 'var(--ink-muted, #9AA8B3)',
          dark: 'var(--ink-muted, #6C7E8F)',
        }
      },
      fontFamily: {
        // Modern geometric Arabic sans for body text
        sans: ['IBM Plex Sans Arabic', 'Tajawal', 'Cairo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Distinctive display face for headings
        display: ['Alexandria', 'Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
        cairo: ['Cairo', 'sans-serif'],
        // New creative font families
        heading: ['ITC Handel Gothic', 'A Jannat LT', 'FunPlay Arabic', 'Ghaith Sans', 'sans-serif'],
        hero: ['ITC Handel Gothic', 'DIN Next Arabic', 'Montserrat Arabic', 'sans-serif'],
        poster: ['ITC Handel Gothic', 'A Jannat LT', 'DIN Next Arabic', 'sans-serif'],
        editorial: ['Al Jazeera Arabic', 'Greta Arabic', 'Graphik Arabic', 'sans-serif'],
        elegant: ['SST Arabic', 'Helvetica Neue Arabic', 'Graphik Arabic', 'sans-serif'],
        stylized: ['RB Arabic', 'FunPlay Arabic', 'Graphik Arabic', 'sans-serif'],
        modern: ['Greta Arabic', 'Montserrat Arabic', 'Graphik Arabic', 'sans-serif'],
        'creative-display': ['A Jannat LT', 'ITC Handel Gothic', 'FunPlay Arabic', 'sans-serif'],
      },
      boxShadow: {
        // Softened glows/shadows — subtle elevation on the dark theme
        'gold-glow': '0 0 18px -6px rgba(201, 161, 90, 0.18)',
        'gold-glow-lg': '0 0 28px -8px rgba(201, 161, 90, 0.25)',
        'card-dark': '0 4px 16px rgba(0, 0, 0, 0.22)',
        'card-dark-lg': '0 8px 24px rgba(0, 0, 0, 0.28)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E8C97A 0%, #C9A15A 50%, #9E7B35 100%)',
        'gold-gradient-hover': 'linear-gradient(135deg, #F3DE9A 0%, #D8B26B 50%, #B88E3E 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0E1A24 0%, #081017 100%)',
        'card-gradient': 'linear-gradient(145deg, #182837 0%, #121F2B 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      }
    },
  },
  plugins: [],
}
