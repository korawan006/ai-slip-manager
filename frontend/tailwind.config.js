/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        card: '#18181b',
        border: '#27272a',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          neon: '#818cf8',
        },
        accent: {
          DEFAULT: '#a855f7',
          neon: '#c084fc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
