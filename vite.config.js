import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // @/ always resolves to src/ regardless of where the importing file lives.
      // This makes every import absolute and move-safe:
      //   import { C } from '@/config/colors.js'
      //   import LoginScreen from '@/field/pages/LoginScreen.jsx'
      // When files move to new folders, only update the alias target — never
      // hunt down relative '../../../' chains again.
      '@': path.resolve(__dirname, 'src'),
    },
  },

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/leaflet/') || id.includes('node_modules/react-leaflet/')) return 'leaflet'
          if (id.includes('node_modules/')) return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
})