import { sql } from 'kysely';
import { afterAll, describe, expect, it } from 'vitest';
import { createTestDb } from './testing.ts';

const db = createTestDb();
afterAll(() => db.destroy());

describe('migration 003', () => {
  it('adds trigram indexes for the contains search', async () => {
    const { rows } = await sql<{ indexname: string }>`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'employees' AND indexdef LIKE '%gin_trgm_ops%'`.execute(db);
    expect(rows.map((r) => r.indexname).sort()).toEqual([
      'employees_code_trgm',
      'employees_email_trgm',
      'employees_full_name_trgm',
    ]);
  });
});
