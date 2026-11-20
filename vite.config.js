import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Send /api requests to the Express server (npm run server) during development.
  server: { proxy: { '/api': 'http://localhost:3001' } },
})
