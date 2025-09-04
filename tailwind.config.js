/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['JetBrains Mono', 'monospace'],
      },
      dropShadow: {
        'pink': '0 1px 2px rgba(236, 72, 153, 0.7)',
      },
      keyframes: {
        'pulse-heart': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '0.7',
          },
        },
      },
      animation: {
        'pulse-heart': 'pulse-heart 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}