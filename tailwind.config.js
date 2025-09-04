/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Montserrat', 'sans-serif'], // Заголовки, интерфейс
        'serif': ['Merriweather', 'serif'], // Запасной, если захотим вернуть
        'body': ['Arial', 'sans-serif', 'system-ui'], // Основной текст
      },
      // ДОБАВЛЯЕМ СЕКЦИЮ ДЛЯ АНИМАЦИИ
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