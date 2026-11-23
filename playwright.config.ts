import { defineConfig, devices } from '@playwright/test';

// Own database and ports, so the smoke test never touches dev data or a running dev server.
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgres://acme:acme@localhost:5432/acme_e2e';
const API_PORT = 3100;
const WEB_PORT = 5180;
export const E2E_USER = { email: 'hr@acme.example', password: 'e2e-password-long-enough' };

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${WEB_PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Fresh schema and the deterministic 10k seed on every run.
      command: 'node e2e/prepare-db.ts && pnpm db:seed && pnpm --filter @acme/api start',
      url: `http://localhost:${API_PORT}/api/health`,
      env: {
        DATABASE_URL,
        TEST_DATABASE_URL: DATABASE_URL,
        PORT: String(API_PORT),
        SEED_ADMIN_EMAIL: E2E_USER.email,
        SEED_ADMIN_PASSWORD: E2E_USER.password,
      },
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: `pnpm --filter @acme/web exec vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
    },
  ],
});
