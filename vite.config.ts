// REMOVE this line at the top:
/// <reference types="vitest" />

// Keep everything else the same
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'animation-vendor': ['framer-motion', 'react-confetti'],
          'firebase-vendor': ['firebase/app', 'firebase/auth'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  }
})