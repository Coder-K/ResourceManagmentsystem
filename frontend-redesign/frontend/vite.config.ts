import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The API only allows this exact origin (Cors:AllowedOrigins in appsettings.json),
  // so fail loudly instead of silently moving to another port.
  server: { port: 5173, strictPort: true },
})
