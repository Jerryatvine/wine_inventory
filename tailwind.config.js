/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1a0f0f',
        surface: '#2a1a1a',
        border: '#4a2a2a',
        gold: '#c9a84c',
        'gold-light': '#e8c97a',
        wine: '#7a1a2e',
        'wine-dark': '#4a0e1a',
        text: '#f5ede0',
        muted: '#a08070',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
