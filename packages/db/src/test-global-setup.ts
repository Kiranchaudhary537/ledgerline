import { migrateToLatest } from './migrate.ts';
import { createTestDb } from './testing.ts';

/** Vitest global setup for the "db" project: migrate the test database once per run. */
export default async function setup(): Promise<void> {
  const db = createTestDb();
  try {
    await migrateToLatest(db);
  } finally {
    await db.destroy();
  }
}
