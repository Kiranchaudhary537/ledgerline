import { type Kysely, sql } from 'kysely';

// Partial on deleted_at like the other employee indexes. ILIKE '%text%' can use these; a B-tree cannot.
const statements = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE INDEX employees_full_name_trgm ON employees USING gin (full_name gin_trgm_ops) WHERE deleted_at IS NULL`,
  `CREATE INDEX employees_email_trgm ON employees USING gin (email gin_trgm_ops) WHERE deleted_at IS NULL`,
  `CREATE INDEX employees_code_trgm ON employees USING gin (employee_code gin_trgm_ops) WHERE deleted_at IS NULL`,
];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const statement of statements) await sql.raw(statement).execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql
    .raw('DROP INDEX employees_full_name_trgm, employees_email_trgm, employees_code_trgm')
    .execute(db);
}
