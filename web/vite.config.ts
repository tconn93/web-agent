import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server:{
    allowedHosts: [
       'localhost',
       '10.0.158.82',
       '127.0.0.1',
       'grok'
    ]
   },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
