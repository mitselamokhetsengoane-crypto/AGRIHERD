/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        secondary: '#66BB6A',
        background: '#F5F9F5',
        maintext: '#1B1B1B',
        subtext: '#6B7280',
        error: '#D32F2F',
        inputfill: '#D9D9D9',
      },
    },
  },
  plugins: [],
}