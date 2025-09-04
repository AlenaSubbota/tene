/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#F5F1ED',
        'text-main': '#2C3A47',
        'component-bg': '#FFFFFF',
        'accent': '#9A7B66',
        'accent-hover': '#8A6B56',
        'border-color': '#EAE5E0',
      },
      fontFamily: {
        'sans': ['JetBrains Mono', 'monospace'],
      },
      dropShadow: {
        'accent': '0 1px 2px rgba(154, 123, 102, 0.7)',
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
