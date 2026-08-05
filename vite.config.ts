import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2023',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react|scheduler/.test(id)) return 'vendor-react'
            if (/zustand|tanstack/.test(id)) return 'vendor-state'
            if (/chart\.js|react-chartjs/.test(id)) return 'vendor-charts'
            if (/framer-motion/.test(id)) return 'vendor-motion'
            if (/katex/.test(id)) return 'vendor-katex'
            if (/dexie/.test(id)) return 'vendor-db'
            return 'vendor'
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // AI endpoints are serverless functions; proxy them when running `vercel dev`.
      '/api': 'http://localhost:3000',
    },
  },
})
