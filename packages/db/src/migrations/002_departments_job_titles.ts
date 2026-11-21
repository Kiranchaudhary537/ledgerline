import { type Kysely, sql } from 'kysely';

const statements = [
  `CREATE TABLE departments (name text PRIMARY KEY)`,
  `CREATE TABLE job_titles (
    department  text NOT NULL REFERENCES departments(name),
    title       text NOT NULL,
    PRIMARY KEY (department, title)
  )`,
  // Keep existing data valid: every pair already on an employee becomes a known title.
  `INSERT INTO departments (name) SELECT DISTINCT department FROM employees`,
  `INSERT INTO job_titles (department, title) SELECT DISTINCT department, job_title FROM employees`,
  `ALTER TABLE employees ADD CONSTRAINT employees_department_job_title_fkey
    FOREIGN KEY (department, job_title) REFERENCES job_titles (department, title)`,
];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const statement of statements) await sql.raw(statement).execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql
    .raw(
      'ALTER TABLE employees DROP CONSTRAINT employees_department_job_title_fkey; DROP TABLE job_titles, departments',
    )
    .execute(db);
}
