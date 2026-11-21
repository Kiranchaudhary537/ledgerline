import type { Db } from './client.ts';
import { DEPARTMENTS } from './seed/data.ts';

export async function upsertDepartments(db: Db): Promise<void> {
  const departments = Object.keys(DEPARTMENTS).map((name) => ({ name }));
  const jobTitles = Object.entries(DEPARTMENTS).flatMap(([department, titles]) =>
    titles.map((title) => ({ department, title })),
  );
  await db
    .insertInto('departments')
    .values(departments)
    .onConflict((oc) => oc.doNothing())
    .execute();
  await db
    .insertInto('jobTitles')
    .values(jobTitles)
    .onConflict((oc) => oc.doNothing())
    .execute();
}
