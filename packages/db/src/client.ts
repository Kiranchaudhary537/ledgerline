import { config } from '@acme/shared';
import { CamelCasePlugin, Kysely, PostgresDialect, sql } from 'kysely';
import pg from 'pg';
import type { DB } from './types.ts';

// shortcut: BIGINT/NUMERIC parsed as JS numbers; safe while values stay below 2^53 (salaries, counts do).
pg.types.setTypeParser(pg.types.builtins.INT8, Number);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);
// Keep DATE as 'YYYY-MM-DD'; parsing to Date would shift it by the server time zone.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export type Db = Kysely<DB>;

/** Columns are snake_case in Postgres and camelCase in code (CamelCasePlugin). */
export function createDb(connectionString: string): Db {
  return new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max: config.db.poolSize }),
    }),
    plugins: [new CamelCasePlugin()],
  });
}

/** Throws if the database cannot be reached. */
export async function ping(db: Db): Promise<void> {
  await sql`SELECT 1`.execute(db);
}
