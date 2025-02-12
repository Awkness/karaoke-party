import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.PROJECT_DOMAIN 
          ? `https://${process.env.PROJECT_DOMAIN}.glitch.me`
          : 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    // Ensure assets are handled correctly
    assetsDir: 'assets',
    // Configure rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['lucide-react']
        }
      }
    }
  },
  // Add base URL for Glitch
  base: process.env.PROJECT_DOMAIN ? '/' : '/',
}); 