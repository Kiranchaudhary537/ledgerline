import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['{apps,packages}/*/src/**/*.test.ts'],
          exclude: ['**/*.db.test.ts', 'apps/web/**'],
        },
      },
      {
        test: {
          name: 'web',
          include: ['apps/web/src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['apps/web/src/test-setup.ts'],
        },
      },
      {
        // Tests that need Postgres. Files run one at a time because they share the test database.
        test: {
          name: 'db',
          include: ['{apps,packages}/*/src/**/*.db.test.ts'],
          fileParallelism: false,
          globalSetup: ['packages/db/src/test-global-setup.ts'],
        },
      },
    ],
  },
});
