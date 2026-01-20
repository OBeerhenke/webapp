/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0A0F1E',
          lighter: '#151B2E',
          border: '#1F2937',
        },
        neon: {
          teal: '#2DD4BF',
          blue: '#3B82F6',
          glow: 'rgba(45, 212, 191, 0.5)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
