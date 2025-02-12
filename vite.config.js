import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  // Add base URL for Glitch
  base: process.env.PROJECT_DOMAIN ? '/' : '/',
}); 