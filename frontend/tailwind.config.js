/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0D9488',
        accent: '#F97316',
        background: '#F8FAFC',
        dark: '#1E293B',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({ '.scrollbar-hide': { '-ms-overflow-style': 'none', 'scrollbar-width': 'none', '&::-webkit-scrollbar': { display: 'none' } } })
    }
  ],
}
