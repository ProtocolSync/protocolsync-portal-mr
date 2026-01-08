import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@protocolsync/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
      '@protocolsync/shared-constants': path.resolve(__dirname, '../../packages/shared-constants/src'),
    },
  },
  server: {
    port: 5173,
  },
})
