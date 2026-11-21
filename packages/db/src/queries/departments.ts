import type { Db } from '../client.ts';

export interface DepartmentWithTitles {
  name: string;
  jobTitles: string[];
}

/** Every department with its job titles, both sorted by name. */
export async function listDepartments(db: Db): Promise<DepartmentWithTitles[]> {
  const rows = await db
    .selectFrom('departments')
    .leftJoin('jobTitles', 'jobTitles.department', 'departments.name')
    .select(['departments.name', 'jobTitles.title'])
    .orderBy('departments.name')
    .orderBy('jobTitles.title')
    .execute();
  const byName = new Map<string, string[]>();
  for (const { name, title } of rows) {
    const titles = byName.get(name) ?? [];
    if (title) titles.push(title);
    byName.set(name, titles);
  }
  return [...byName].map(([name, jobTitles]) => ({ name, jobTitles }));
}
