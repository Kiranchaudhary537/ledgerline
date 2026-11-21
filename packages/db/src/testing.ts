import { createDb, type Db } from './client.ts';
import { upsertCountries } from './countries.ts';
import { clearData } from './seed/seed.ts';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://acme:acme@localhost:5432/acme_test';

export function createTestDb(): Db {
  return createDb(TEST_DATABASE_URL);
}

/** Empties every table and restores countries. Call in beforeEach of *.db.test.ts files. */
export async function resetDb(db: Db): Promise<void> {
  await clearData(db);
  await upsertCountries(db);
}
