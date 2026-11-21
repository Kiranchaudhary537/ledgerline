import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { Database } from './types.ts';

// shortcut: BIGINT/NUMERIC parsed as JS numbers; safe while values stay below 2^53 (salaries, counts do).
pg.types.setTypeParser(pg.types.builtins.INT8, Number);
pg.types.setTypeParser(pg.types.builtins.NUMERIC, Number);
// Keep DATE as 'YYYY-MM-DD'; parsing to Date would shift it by the server time zone.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export type Db = Kysely<Database>;

/** Columns are snake_case in Postgres and camelCase in code (CamelCasePlugin). */
export function createDb(connectionString: string): Db {
  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString, max: 10 }) }),
    plugins: [new CamelCasePlugin()],
  });
}
