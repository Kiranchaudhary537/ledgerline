import { type Kysely, sql } from 'kysely';

// Plain SQL: easiest to review, and it shows exactly what Postgres gets.
const statements = [
  `CREATE TYPE level AS ENUM ('junior', 'mid', 'senior', 'lead', 'principal')`,
  `CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract')`,
  `CREATE TYPE gender AS ENUM ('female', 'male')`,

  `CREATE TABLE countries (
    code        char(2) PRIMARY KEY,
    name        text     NOT NULL,
    currency    char(3)  NOT NULL,
    locale      text     NOT NULL,
    minor_unit  smallint NOT NULL CHECK (minor_unit BETWEEN 0 AND 3)
  )`,

  `CREATE TABLE users (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          text NOT NULL UNIQUE,
    password_hash  text NOT NULL,
    name           text NOT NULL,
    created_at     timestamptz NOT NULL DEFAULT now()
  )`,

  // id is the SHA-256 of the cookie token, so a leaked table cannot be used to log in.
  `CREATE TABLE sessions (
    id          text PRIMARY KEY,
    user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  )`,

  `CREATE TABLE employees (
    id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_code    text GENERATED ALWAYS AS ('ACME-' || lpad(id::text, 5, '0')) STORED NOT NULL UNIQUE,
    full_name        text NOT NULL,
    email            text NOT NULL,
    department       text NOT NULL,
    job_title        text NOT NULL,
    level            level NOT NULL,
    country_code     char(2) NOT NULL REFERENCES countries(code),
    employment_type  employment_type NOT NULL,
    gender           gender NOT NULL,
    hire_date        date NOT NULL,
    salary_minor     bigint NOT NULL CHECK (salary_minor > 0),
    version          int NOT NULL DEFAULT 1,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz
  )`,
  `CREATE UNIQUE INDEX employees_email_active ON employees (email) WHERE deleted_at IS NULL`,
  `CREATE INDEX employees_country_title_level ON employees (country_code, job_title, level) WHERE deleted_at IS NULL`,
  `CREATE INDEX employees_department ON employees (department) WHERE deleted_at IS NULL`,
  `CREATE INDEX employees_full_name ON employees (full_name, id) WHERE deleted_at IS NULL`,

  // Append-only. old_salary_minor is NULL for the starting salary; changed_by is NULL for imported history.
  `CREATE TABLE salary_changes (
    id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    employee_id       bigint NOT NULL REFERENCES employees(id),
    old_salary_minor  bigint,
    new_salary_minor  bigint NOT NULL CHECK (new_salary_minor > 0),
    reason            text NOT NULL,
    changed_by        bigint REFERENCES users(id),
    changed_at        timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX salary_changes_employee ON salary_changes (employee_id, changed_at DESC)`,
];

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const statement of statements) await sql.raw(statement).execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await sql
    .raw(
      'DROP TABLE salary_changes, employees, sessions, users, countries; DROP TYPE level, employment_type, gender',
    )
    .execute(db);
}
