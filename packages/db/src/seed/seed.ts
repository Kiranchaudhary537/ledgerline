import { config } from '@acme/shared';
import { sql } from 'kysely';
import type { Db } from '../client.ts';
import { upsertCountries } from '../countries.ts';
import { upsertDepartments } from '../departments.ts';
import { hashPassword } from '../password.ts';
import { generateEmployees } from './generate.ts';

/** Removes all app data (keeps the schema). */
export async function clearData(db: Db): Promise<void> {
  await sql`TRUNCATE salary_changes, employees, sessions, users RESTART IDENTITY CASCADE`.execute(
    db,
  );
}

function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
  count?: number;
  seed?: number;
}

/** Replaces all data with a fresh, deterministic dataset. All or nothing (one transaction). */
export async function seedDatabase(
  db: Db,
  {
    adminEmail,
    adminPassword,
    count = config.seed.employeeCount,
    seed = config.seed.randomSeed,
  }: SeedOptions,
): Promise<void> {
  const employees = generateEmployees({ seed, count });
  const passwordHash = await hashPassword(adminPassword);

  await db.transaction().execute(async (trx) => {
    await clearData(trx);
    await upsertCountries(trx);
    await upsertDepartments(trx);
    await trx
      .insertInto('users')
      .values({ email: adminEmail, name: config.seed.adminName, passwordHash })
      .execute();

    const idByEmail = new Map<string, number>();
    for (const batch of chunks(employees, config.seed.batchSize)) {
      const rows = await trx
        .insertInto('employees')
        .values(batch.map(({ history: _history, ...e }) => e))
        .returning(['id', 'email'])
        .execute();
      for (const row of rows) idByEmail.set(row.email, row.id);
    }

    const history = employees.flatMap((e) =>
      e.history.map((change) => ({ ...change, employeeId: idByEmail.get(e.email)! })),
    );
    for (const batch of chunks(history, config.seed.batchSize)) {
      await trx.insertInto('salaryChanges').values(batch).execute();
    }
  });
}
