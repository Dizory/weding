import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const invitationBaseUrl = process.env.VITE_INVITATION_BASE_URL || process.env.SERVER_HTTPS || process.env.SERVER_HTTP
if (invitationBaseUrl && !process.env.VITE_INVITATION_BASE_URL) {
  process.env.VITE_INVITATION_BASE_URL = invitationBaseUrl
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API calls to the app service
      '/api': {
        target: process.env.SERVER_HTTPS || process.env.SERVER_HTTP,
        changeOrigin: true
      }
    }
  }
})
