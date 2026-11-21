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

## No hard-coding

| Kind of value | Where it lives |
|---|---|
| Anything that differs per environment or might be tuned in production (URLs, ports, session length, rate limits, cookie security) | `apps/api/src/config.ts` — env var with a default, validated by Zod at boot |
| Fixed domain facts used in logic (levels, employment types, genders) | `packages/shared/src/constants.ts`, with a comment why it is code |
| Reference data that the business owns (departments, job titles, countries) | Database / maintained package — never a literal list in code |
| User-facing messages | `ERRORS` table (`packages/shared/src/errors.ts`) or the component that shows them — never inline in services |
| Numbers with meaning | Named constant next to its use, with a unit in the name: `SESSION_TTL_HOURS`, `BATCH_SIZE`, `BAND_SPREAD` |
| Repeated string keys (cookie name, query keys, route paths used twice) | One named constant |

Allowed literals: `0`, `1`, array indexes, test fixtures, and values whose meaning is obvious at the use site (`.slice(0, 10)` on an ISO date with a comment).

## Types and errors

- `strict` TypeScript. No `any`; `unknown` + narrowing at trust boundaries. Non-null `!` only with a comment saying why it is safe.
- Validate every external input once, at the boundary, with the shared Zod schemas. Inside, trust the types.
- Errors: throw `AppError(code)`; the one error handler maps to HTTP. Never leak stack traces, SQL or salary values in responses or logs.
- Money is integer minor units (`number`, safe-integer checked). Never floats for stored amounts.

## Naming and size

- Names say what, in domain words: `changeSalary`, `compaRatio`, `bandMedian` — not `handle`, `data2`, `process`.
- Booleans read as questions: `isStale`, `hasOneCountry`.
- A function does one thing; if it needs a comment to separate steps, split it. Aim for < 30 lines.
- Comments explain *why*, not *what*. Known limits use `// shortcut: <limit>, <when to upgrade>`.

## Tests

- Test behaviour through the public interface (HTTP for routes, methods for services/repositories).
- Services get unit tests with fake repositories; repositories and routes get DB tests (`*.db.test.ts`) against real Postgres.
- Deterministic: fixed seeds, no `Date.now()` in assertions, no sleeps.
- Test first for new logic: `test:` commit (red) then `feat:` commit (green).

## Frontend

- Server state in TanStack Query; filter/sort/page state in the URL; form state in react-hook-form with shared Zod schemas. No global store.
- Options for selects come from `GET /api/meta/filters`, never from hard-coded lists.
- Design tokens (colours, fonts, spacing) only as CSS variables; no literal colours in components.
- Every screen: loading, empty, error states. Follow `docs/ui-design.md` and the `web-design-guidelines` audit.
