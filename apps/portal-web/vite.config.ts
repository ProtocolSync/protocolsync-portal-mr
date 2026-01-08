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
      '@protocolsync/shared-utils': path.resolve(__dirname, '../../packages/shared-utils/src'),
      '@protocolsync/shared-services': path.resolve(__dirname, '../../packages/shared-services/src'),
      '@protocolsync/shared-hooks': path.resolve(__dirname, '../../packages/shared-hooks/src'),
    },
  },
  server: {
    port: 5173,
  },
})
