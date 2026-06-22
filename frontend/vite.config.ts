import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Reenviar al backend Django todo lo que NO sean assets del frontend.
      // Una sola regla cubre: /api/*, /finance/*, /budget/*, /goals/*, /admin/*, etc.
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/finance': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/budget': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/goals': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/admin': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/static': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/media': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    }
  }
})
