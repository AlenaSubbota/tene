import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tene/', // <-- ЗАМЕНИТЕ 'novel-reader-app' НА ИМЯ ВАШЕГО РЕПОЗИТОРИЯ
  build: {
    outDir: 'docs' // Мы будем собирать проект в папку 'docs', а не 'dist'
  }
})