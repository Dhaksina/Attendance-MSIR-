/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0c2440',
          800: '#123B66', // Primary Navy
          700: '#194d82',
          600: '#23619f',
        },
        brand: {
          50: '#F4F8FD',
          100: '#EAF2FB', // Light Blue
          200: '#CBE0F7',
          300: '#9ECAF1',
          400: '#64A6E4',
          500: '#3D78C5', // Primary Blue
          600: '#285da6',
          700: '#1e4883',
          800: '#173966',
          900: '#122e51',
        },
        accent: {
          yellow: '#F5C542',
          yellowLight: '#FEF8E7',
          yellowDark: '#D4A31C',
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#FFFFFF',
          muted: '#F1F5F9',
        },
        content: {
          main: '#172033',
          secondary: '#667085',
          muted: '#94A3B8',
        },
        border: {
          subtle: '#E4EAF1',
          default: '#E2E8F0',
          focus: '#3D78C5',
        },
        status: {
          present: '#10B981',
          presentBg: '#ECFDF5',
          absent: '#EF4444',
          absentBg: '#FEF2F2',
          late: '#F59E0B',
          lateBg: '#FFFBEB',
          leave: '#F5C542',
          leaveBg: '#FEF9C3',
          holiday: '#64748B',
          holidayBg: '#F1F5F9',
          weekend: '#3D78C5',
          weekendBg: '#EAF2FB',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(18, 59, 102, 0.04)',
        'soft-sm': '0 2px 8px 0 rgba(18, 59, 102, 0.05)',
        'soft': '0 4px 20px -2px rgba(18, 59, 102, 0.06)',
        'soft-md': '0 8px 30px -4px rgba(18, 59, 102, 0.08)',
        'soft-lg': '0 16px 40px -6px rgba(18, 59, 102, 0.10)',
        'soft-xl': '0 24px 50px -10px rgba(18, 59, 102, 0.12)',
        'glow-blue': '0 0 25px -4px rgba(61, 120, 197, 0.35)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
