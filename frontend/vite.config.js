import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8188',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws-proxy': {
        target: 'ws://127.0.0.1:8188',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/ws-proxy/, ''),
      }
    }
  }
})
