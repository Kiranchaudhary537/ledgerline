/**
 * Employee-list latency against the seeded database: `pnpm bench`.
 * Requests go through the whole app (auth, validation, query, JSON) in-process, so the numbers
 * are server time and exclude the network.
 */
import { createDb, SessionRepository } from '@acme/db';
import { config } from '@acme/shared';
import { buildApp } from './app.ts';
import { loadEnv } from './env.ts';

const TARGET_MS = 200;
const SAMPLES = 200;
const WARMUP = 10;
const MIN_EMPLOYEES = config.seed.employeeCount;

const CASES: [string, string][] = [
  ['default (name, page 1)', '/api/employees'],
  ['search "sharma"', '/api/employees?q=sharma'],
  ['search "an" (2 chars)', '/api/employees?q=an'],
  ['filter country', '/api/employees?country=IN'],
  ['filter country+dept+level', '/api/employees?country=IN&department=Engineering&level=senior'],
  ['sort salary desc', '/api/employees?country=US&sort=salary:desc'],
  ['sort hire date, page 100', '/api/employees?sort=hireDate:desc&page=100'],
  ['page size 100', '/api/employees?pageSize=100'],
  ['facets (filter counts)', '/api/employees/facets'],
  ['facets, search + filter', '/api/employees/facets?country=IN&q=an'],
];

const env = loadEnv();
const db = createDb(env.DATABASE_URL);
const app = buildApp({ db, logger: false });
const sessions = new SessionRepository(db);

const percentile = (sorted: number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;

// The API allows `apiMax` requests per user per minute, so the run spreads over throwaway users.
const perUser = config.rateLimit.apiMax - 1;
const userCount = Math.ceil((CASES.length * (SAMPLES + WARMUP)) / perUser);
const userIds: number[] = [];

try {
  const { count } = await db
    .selectFrom('employees')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('deletedAt', 'is', null)
    .executeTakeFirstOrThrow();
  if (count < MIN_EMPLOYEES) {
    throw new Error(`Need ${MIN_EMPLOYEES} employees, found ${count}. Run pnpm db:setup first.`);
  }

  const stamp = Date.now();
  for (let i = 0; i < userCount; i++) {
    const { id } = await db
      .insertInto('users')
      .values({ email: `bench-${stamp}-${i}@acme.invalid`, name: 'Bench', passwordHash: '!' })
      .returning('id')
      .executeTakeFirstOrThrow();
    userIds.push(id);
  }
  const cookies = await Promise.all(
    userIds.map(async (id) => `${config.cookie.sessionName}=${await sessions.create(id)}`),
  );

  let sent = 0;
  const get = async (url: string) => {
    const res = await app.inject({
      url,
      headers: { cookie: cookies[Math.floor(sent++ / perUser)]! },
    });
    if (res.statusCode !== 200) throw new Error(`${url} -> ${res.statusCode} ${res.body}`);
  };

  console.log(`${count} employees, ${SAMPLES} samples per case, target p95 <= ${TARGET_MS} ms\n`);
  console.log('case'.padEnd(30), 'p50'.padStart(7), 'p95'.padStart(7), 'p99'.padStart(7), '');
  let failed = 0;
  for (const [name, url] of CASES) {
    for (let i = 0; i < WARMUP; i++) await get(url);
    const times: number[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      const start = performance.now();
      await get(url);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const [p50, p95, p99] = [50, 95, 99].map((p) => percentile(times, p));
    const ok = p95! <= TARGET_MS;
    if (!ok) failed++;
    const ms = (n: number) => n.toFixed(1).padStart(7);
    console.log(name.padEnd(30), ms(p50!), ms(p95!), ms(p99!), ok ? 'ok' : 'OVER');
  }
  process.exitCode = failed ? 1 : 0;
} finally {
  if (userIds.length) {
    await db.deleteFrom('sessions').where('userId', 'in', userIds).execute();
    await db.deleteFrom('users').where('id', 'in', userIds).execute();
  }
  await app.close();
  await db.destroy();
}
