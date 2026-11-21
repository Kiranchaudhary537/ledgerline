import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { upsertDepartments } from '../departments.ts';
import { createTestDb, resetDb } from '../testing.ts';
import { listDepartments } from './departments.ts';

const db = createTestDb();
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

describe('listDepartments', () => {
  it('returns departments with their sorted job titles', async () => {
    const list = await listDepartments(db);
    expect(list).toHaveLength(8);
    expect(list).toContainEqual({
      name: 'Product',
      jobTitles: ['Product Designer', 'Product Manager'],
    });
  });

  it('includes a department that has no titles yet, and upserting twice changes nothing', async () => {
    await db.insertInto('departments').values({ name: 'Legal' }).execute();
    await upsertDepartments(db);
    const list = await listDepartments(db);
    expect(list).toContainEqual({ name: 'Legal', jobTitles: [] });
    expect(list).toHaveLength(9);
    await db.deleteFrom('departments').where('name', '=', 'Legal').execute();
  });
});
