import pg from 'pg';
import { migrateToLatest } from './migrate.ts';
import { createTestDb, TEST_DATABASE_URL } from './testing.ts';

/** Creates the test database if needed (a fresh clone has only the dev one), then migrates it. */
async function ensureDatabaseExists(url: string): Promise<void> {
  const target = new URL(url);
  const name = target.pathname.slice(1);
  // CREATE DATABASE cannot take a bind parameter, so only allow plain identifiers.
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`Unsafe test database name: ${name}`);
  target.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: target.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (!rowCount) await admin.query(`CREATE DATABASE ${name}`);
  } finally {
    await admin.end();
  }
}

export default async function setup(): Promise<void> {
  await ensureDatabaseExists(TEST_DATABASE_URL);
  const db = createTestDb();
  try {
    await migrateToLatest(db);
  } finally {
    await db.destroy();
  }
}
