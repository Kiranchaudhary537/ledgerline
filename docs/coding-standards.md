# Coding standards

Rules every change follows. Reviews (human or AI) check code against this file.

## Structure

| Rule | Example |
|---|---|
| Layers: `routes → services → repositories → Postgres`. Never backwards. | A route never imports a repository. |
| **Repositories** are classes; the only place with SQL. Constructor takes `db`. | `new EmployeeRepository(db).changeSalary(...)` |
| **Services** are classes; business rules only. Constructor takes repositories. Throw `AppError`, never return HTTP codes. | `EmployeeService.changeSalary` → `AppError('STALE_VERSION')` |
| **Routes** are thin functions: parse input (shared Zod), call one service method, return the result. | No `if` on business rules in a route. |
| **Pure helpers stay functions** (no state, no dependencies). | `formatMoney`, `csvRow`, `employeeFilters`, `generateEmployees` |
| Objects are wired once, in `buildApp`. No `new Service()` inside handlers; no module-level singletons. | Tests build the same graph with a test DB or fakes. |
| Group by feature: `modules/<feature>/{routes,service,repository}.ts`. | |
| `erasableSyntaxOnly`: declare class fields explicitly (no `constructor(private x)`), no `enum`, no `namespace`. | See `AppError`. |

## No hard-coding: one config

**All tunable values live in one file: `packages/shared/src/config.ts`.** To change behaviour (page sizes, session length, rate limits, seed size…), edit only that file. It starts with a comment saying so, and every value has a one-line comment with its unit and why it has that value.

- Used by API, seed and web alike (it has no Node-only code, so the browser can import it).
- **Secrets and per-environment infrastructure** (`DATABASE_URL`, `PORT`, `NODE_ENV`, seed admin password) are not in that file: they come from environment variables, read and validated once in `apps/api/src/env.ts` (and the seed CLI). Only these entry points may read `process.env`: the API `apps/api/src/env.ts`, the seed CLI (`packages/db/src/seed/index.ts`), the migrate CLI (`packages/db/src/migrate.ts`, under `import.meta.main`) and the DB test helper (`packages/db/src/testing.ts`, for `TEST_DATABASE_URL`). Each fails with a clear message when a variable is missing. Nothing else reads it.
- Code imports the value from config; no literal duplicates of it anywhere.

| Kind of value | Where it lives |
|---|---|
| Tunables (limits, sizes, durations, thresholds) | `packages/shared/src/config.ts` |
| Secrets, URLs, ports, environment | env vars → `apps/api/src/env.ts` |
| Fixed domain facts used in logic (levels, employment types, genders) | `packages/shared/src/constants.ts`, with a comment why it is code |
| Business-owned reference data (departments, job titles, countries) | Database / maintained package — never a literal list in code |
| User-facing messages | `ERRORS` table (`packages/shared/src/errors.ts`) or the component that shows them |
| Repeated string keys (cookie name, query keys) | `config.ts` or one named constant |

Allowed literals: `0`, `1`, array indexes, test fixtures.

## Types and errors

- `strict` TypeScript. No `any`; `unknown` + narrowing at trust boundaries. Non-null `!` only with a comment saying why it is safe.
- Validate every external input once, at the boundary, with the shared Zod schemas. Inside, trust the types.
- Errors: throw `AppError(code)`; the one error handler maps to HTTP. Never leak stack traces, SQL or salary values in responses or logs.
- Money is integer minor units (`number`, safe-integer checked). Never floats for stored amounts.

## Naming and size

- Names say what, in domain words: `changeSalary`, `salaryMinor`, `hireDate` — not `handle`, `data2`, `process`.
- Booleans read as questions: `isStale`, `hasOneCountry`.
- A function does one thing; if it needs a comment to separate steps, split it. Aim for < 30 lines.
- **Comments only for decisions and important facts**: why a choice was made, a security or data-loss reason, a non-obvious constraint, a known limit (`// shortcut: <limit>, <when to upgrade>`). No comments that repeat what the code says (`// returns the user`, `// loop over rows`). If code needs a comment to be understood, rename or split it first.
- Doc comments (`/** */`) only on exported functions/classes whose contract is not obvious from the name and types.

## Tests

- **Tests sit next to the code they cover** (`x.ts` → `x.test.ts`; `routes.ts` → `routes.db.test.ts`). Only shared helpers live apart (`apps/api/src/testing.ts`, `packages/db/src/testing.ts`).
- Test behaviour through the public interface (HTTP for routes, methods for services/repositories).
- Services get unit tests with fake repositories; repositories and routes get DB tests (`*.db.test.ts`) against real Postgres.
- Deterministic: fixed seeds, no `Date.now()` in assertions, no sleeps.
- Test first for new logic and every bug fix: `test:` commit (red) then `feat:`/`fix:` commit (green). What must be red first, and the watch commands: [CONTRIBUTING.md](../CONTRIBUTING.md#2-red-green-refactor).

## Frontend

- Server state in TanStack Query; filter/sort/page state in the URL; form state in react-hook-form with shared Zod schemas. No global store.
- Options for selects come from `GET /api/meta/filters`, never from hard-coded lists.
- Design tokens (colours, fonts, spacing) only as CSS variables; no literal colours in components.
- Every screen: loading, empty, error states. Follow `docs/ui-design.md` and the `web-design-guidelines` audit.
