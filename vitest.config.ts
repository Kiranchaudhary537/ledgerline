import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['{apps,packages}/*/src/**/*.{ts,tsx}'],
      // Entry points, generated code and copied shadcn primitives: covered by e2e or not ours.
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/test/**',
        '**/testing.ts',
        '**/test-setup.ts',
        '**/test-global-setup.ts',
        '**/types.ts',
        '**/index.ts',
        'apps/web/src/components/ui/**',
        'apps/web/src/main.tsx',
        'apps/web/src/app/providers.tsx',
        'apps/api/src/server.ts',
        'apps/api/src/bench-list.ts',
        'packages/db/src/seed/index.ts',
      ],
      reporter: ['text-summary', 'html'],
      // A floor, not a goal: new code without tests fails `pnpm check`. Raise it as coverage grows.
      thresholds: { lines: 93, branches: 86, functions: 90, statements: 92 },
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['{apps,packages}/*/src/**/*.test.ts'],
          exclude: ['**/*.db.test.ts', 'apps/web/**'],
        },
      },
      {
        resolve: { alias: { '@': new URL('./apps/web/src', import.meta.url).pathname } },
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
