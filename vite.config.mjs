import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindConfig from './tailwind.config.js';
import brandPalette from './scripts/postcss-brand-palette.cjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const websiteRoot = path.resolve(__dirname, 'website/frontend');

export default defineConfig({
  root: websiteRoot,
  publicDir: path.resolve(websiteRoot, 'public'),
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        // Scan only the React website; the shared config also lists the AI frontend for its own CSS build.
        tailwindcss({
          ...tailwindConfig,
          content: [
            path.resolve(websiteRoot, 'index.html'),
            path.resolve(websiteRoot, 'src/**/*.{js,jsx,mjs}'),
          ],
        }),
        brandPalette(),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8002',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:8002',
        ws: true
      }
    }
  },
  build: {
    outDir: path.resolve(websiteRoot, 'dist'),
    emptyOutDir: true,
    // public/assets holds images; keep the hashed JS/CSS bundles in a separate folder.
    assetsDir: 'static'
  },
  resolve: {
    alias: {
      '@': path.resolve(websiteRoot, 'src')
    }
  }
});
