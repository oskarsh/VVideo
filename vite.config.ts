import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH || '/',
  server: { port: 5173 },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/three/') ||
            id.includes('/node_modules/three-mesh-bvh/') ||
            id.includes('/node_modules/three-stdlib/')
          ) return 'three'
          if (id.includes('/node_modules/postprocessing/')) return 'postprocessing'
          if (id.includes('/node_modules/@react-three/')) return 'r3f'
          if (id.includes('/node_modules/')) return 'vendor'
        },
      },
    },
  },
})
