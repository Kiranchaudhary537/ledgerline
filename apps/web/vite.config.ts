import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

// `pnpm ship` polls /version.json until it reports the commit just pushed.
const versionFile = (): Plugin => ({
  name: 'version-file',
  generateBundle() {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev';
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ commit }) });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // API_PROXY_TARGET lets a second API instance (another port) serve the dev server.
  server: { proxy: { '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000' } },
});
