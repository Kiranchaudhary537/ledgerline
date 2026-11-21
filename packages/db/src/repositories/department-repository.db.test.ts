import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { upsertDepartments } from '../departments.ts';
import { createTestDb, resetDb } from '../testing.ts';
import { DepartmentRepository } from './department-repository.ts';

const db = createTestDb();
const departments = new DepartmentRepository(db);
beforeEach(() => resetDb(db));
afterAll(() => db.destroy());

describe('listDepartments', () => {
  it('returns departments with their sorted job titles', async () => {
    const list = await departments.list();
    expect(list).toHaveLength(8);
    expect(list).toContainEqual({
      name: 'Product',
      jobTitles: ['Product Designer', 'Product Manager'],
    });
  });

  it('includes a department that has no titles yet, and upserting twice changes nothing', async () => {
    await db.insertInto('departments').values({ name: 'Legal' }).execute();
    await upsertDepartments(db);
    const list = await departments.list();
    expect(list).toContainEqual({ name: 'Legal', jobTitles: [] });
    expect(list).toHaveLength(9);
    await db.deleteFrom('departments').where('name', '=', 'Legal').execute();
  });
});
