import { migrateToLatest } from './migrate.ts';
import { createTestDb } from './testing.ts';

export default async function setup(): Promise<void> {
  const db = createTestDb();
  try {
    await migrateToLatest(db);
  } finally {
    await db.destroy();
  }
}
