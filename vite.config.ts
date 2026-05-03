import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    // Expose NODE_ENV to browser bundles safely (not via .env)
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173,
      // Proxy /api/* to the backend in development — eliminates CORS issues
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor':     ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor':     ['chart.js', 'react-chartjs-2'],
            'animation-vendor': ['framer-motion', 'react-confetti'],
            'firebase-vendor':  ['firebase/app', 'firebase/auth'],
          },
        },
      },
    },
    test: {
      globals:      true,
      environment:  'jsdom',
      setupFiles:   ['./vitest.setup.ts'],
      css:          false,
      typecheck: {
        tsconfig: './tsconfig.test.json',
      },
    },
  }
})