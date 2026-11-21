import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // API_PROXY_TARGET lets a second API instance (another port) serve the dev server.
  server: { proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000' } },
});
