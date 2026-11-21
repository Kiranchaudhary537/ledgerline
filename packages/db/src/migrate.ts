import { Migrator } from 'kysely/migration';
import { createDb, type Db } from './client.ts';
import * as m001 from './migrations/001_initial.ts';

// Listed explicitly (no folder scanning), so the order is obvious and nothing loads by accident.
const migrations = { '001_initial': m001 };

export async function migrateToLatest(db: Db): Promise<void> {
  const migrator = new Migrator({ db, provider: { getMigrations: async () => migrations } });
  const { error, results } = await migrator.migrateToLatest();
  for (const r of results ?? []) console.log(`migration ${r.migrationName}: ${r.status}`);
  if (error) throw error;
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const db = createDb(url);
  try {
    await migrateToLatest(db);
  } finally {
    await db.destroy();
  }
}
