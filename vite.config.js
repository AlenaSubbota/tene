import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    // В зависимости от режима, выбираем нужный base
    base: mode === 'gh-pages' ? '/tene/' : '/',
    build: {
      outDir: 'docs'
    }
  }
})