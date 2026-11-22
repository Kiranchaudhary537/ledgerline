// Reuses the test-DB setup (create if missing, then migrate) for the database in TEST_DATABASE_URL.
const { default: prepare } = await import('../packages/db/src/test-global-setup.ts');
await prepare();
