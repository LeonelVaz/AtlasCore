import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Configuración explícita para evitar problemas de detección
      // Esto debería solucionar el error "can't detect preamble"
      jsxRuntime: 'automatic'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});