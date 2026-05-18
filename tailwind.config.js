/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        silver: {
          light: '#e0e0e0',
          DEFAULT: '#c0c0c0',
          dark: '#a0a0a0',
        },
        dark: {
          900: '#000000',
          800: '#0a0a0a',
          700: '#141414',
          600: '#1f1f1f',
          500: '#2e2e2e',
          400: '#404040',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        glow: { '0%': { boxShadow: '0 0 5px #c0c0c0' }, '100%': { boxShadow: '0 0 20px #c0c0c0, 0 0 40px #c0c0c044' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
