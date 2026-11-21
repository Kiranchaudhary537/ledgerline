# Decisions

Full design: [system-design.md](system-design.md)

## Chosen

| Area | Chose | Over | Why |
|---|---|---|---|
| Runtime | Node 26 LTS, runs `.ts` directly (type stripping) | Node 24 + `tsx` + build step | No build step for backend; 26 is current LTS |
| TypeScript | 6.0 (pinned) | 7.x | typescript-eslint supports < 6.1 |
| Language | Node.js + TypeScript | Python, Java | One language for API and UI; shared types |
| API framework | Fastify (routes call shared Zod `.parse()`; no type-provider plugin) | Express | Plugins + hooks, in-memory test requests (`inject`), pino logging |
| Database | PostgreSQL | SQLite, MongoDB | Relational data, real transactions, median in SQL, managed backups |
| Query layer | Kysely + `kysely-codegen` | Prisma, Drizzle, raw SQL | See [Why Kysely over Prisma](#why-kysely-over-prisma) |
| DB types | Generated from the migrated DB (`pnpm --filter @acme/db db:types`); `pnpm check` fails if stale | Hand-written types | Types can never drift from the real schema |
| Passwords | `scrypt` (Node built-in) | argon2 | No native dependency; seed (in `db`) and API share it |
| Validation | Zod (shared) | Per-app validation | API and UI check the same rules |
| Frontend | React + Vite | Next.js | SPA is enough; no second server runtime |
| UI kit | shadcn/ui + TanStack Table + Recharts | MUI, Mantine | Light, own the components, flexible table |
| Repo | pnpm monorepo | Separate repos | One place, shared code; no Turborepo (not needed) |
| Hosting – UI | Vercel | Netlify, Render | Free, auto-detects Vite |
| Hosting – API + DB | Render, Singapore region (same region for both) | Fly + Neon, Railway | API and DB close together, one provider |
| Same origin | Vercel rewrite `/api/*` → Render | CORS + cross-site cookies | Browsers block third-party cookies |
| Auth | Session cookie in Postgres, argon2id | JWT in localStorage | Safe from XSS, can log out for real |
| Money | Integer minor units, local currency | Floats, FX conversion | No rounding errors; no external rates |
| Salary type | `BIGINT`, annual gross base, minor units | `INTEGER` | Some currencies overflow 2.1 billion |
| Countries | All ISO countries from `countries-list` (currency) + built-in `Intl` (names, currency decimals) | Hand-written 8-country list | Dynamic, maintained data; money formatted as `en-<country>` |
| Departments, job titles | DB tables (`departments`, `job_titles`), seeded; composite FK `(department, job_title)` on employees | Code constants; a job-title package (O*NET/ESCO) | They are ACME's own structure, no package fits; FK makes Postgres reject a title outside its department |
| Levels, employment types, genders | Code constants + Postgres enums | Packages / DB tables | Logic depends on them: level order (sort, bands), pay factors, gender-gap maths |
| Backend structure | Classes for repositories (SQL) and services (rules), wired in `app.ts`; pure helpers stay functions | All functions | Dependencies injected once; services unit-testable with fake repositories |
| Gender | `female`, `male` (required) | More options | Kept simple for v1 |
| List filters | Contract in [api.md](api.md) | Ad hoc params | One schema for API and UI |
| Salary change | Own endpoint `POST /employees/:id/salary-changes` | Inside `PATCH /employees/:id` | Reason + history rules stay in one place |
| Search | `ILIKE '%q%'` + offset paging (max 100) | Full-text, cursors | 10k rows → a few ms; trigram index since migration 003 (next row) |
| Uniqueness | Partial unique index (active rows only) | Plain unique | Rehired person can reuse email |
| Seed | Realistic, connected data, fixed random seed | Random fake data | Insights must make sense; same data every run |
| Rate limit | `@fastify/rate-limit`, in memory | Redis | One server; counts are correct |
| Config | Env checked by Zod at boot | Read env ad hoc | Missing config fails at start, not later |
| Testing | Vitest only; real Postgres via `docker compose`; tables reset before each DB test, DB test files run one at a time | Jest, Testcontainers, Playwright; rollback per test | One light tool, real DB, no mocks; services keep real transactions in tests |
| Local dev | `docker compose up db` + `pnpm dev` | Local Postgres install | Same DB for everyone |
| Job title + level | Two fields (`Software Engineer` + `Senior`) | One string | Insights can group by title, level or both |
| Employee fields | Name, email, code, title, level, dept, country, type, gender, hire date, salary | Manager, city, DOB | Enough for pay questions |
| Audit | History for salary changes only | Full audit log | Salary is what matters |
| Server state (UI) | TanStack Query | Redux / RTK | Data lives on server; Query caches, refetches, handles loading/error |
| UI state | URL (filters, sort, page) + react-hook-form | Redux store | Shareable links; nothing else left to store |
| Routing | React Router | TanStack Router | Well known, enough for 4 pages |
| Salary sort | Only when one country is filtered | Always | ₹ vs € can't be compared without FX |
| Errors | One shared shape + code list ([error-handling.md](error-handling.md)) | Ad hoc errors | Same messages in API and UI |
| Folder layout | By feature ([structure.md](structure.md)) | By file type | Change one feature in one place |
| Visual direction | shadcn dashboard shell, sharp edges, warm-neutral light theme, pay band as signature | Ledger, Desk, Hallmark Cobalt | User asked for a clean, modern, warm UI on the shadcn dashboard; earlier passes restyled surfaces without deciding what each screen leads with |
| Web structure | `features/<feature>/<sub>/{api,model,components}`; logic in `model/` (pure, tested), data in `api/`, display in `components/` | Flat feature folders | Business logic separated from UI; easy to find and test |
| Compa-ratio | removed | — | Product decision: not needed for v1 |
| UI design | `frontend-design` skill | Default shadcn look, `ui-ux-pro-max` | Choices made for this brief, not picked from a preset catalog |
| UI audit | `web-design-guidelines` (Vercel, rules pinned in repo) | Manual review only | 100+ checks: a11y, focus, forms, states, copy |
| Insights API | 3 endpoints (`stats`, `distribution`, `gender-gap`) reusing list filters | One endpoint per question | Covers every question with one filter schema |
| Insights money | One country per result (or grouped by country) | Mixing currencies | No FX; ₹ + € is meaningless |
| Small groups | Gender gap hidden below 5 people | Always show | One person swings the % |
| Insights compute | Live SQL + index `(country, job_title, level)` | Cache | < 50 ms on 10k rows |
| Seed names | Own name lists per country + tiny seeded RNG | faker | Romanized names (faker `ja` gives kanji → bad emails); one less dependency |
| Ids | `bigint GENERATED ALWAYS AS IDENTITY` | `int`, `serial`, UUID | Standard; never overflows; small indexes. Safe to expose: every route needs login (one auth hook + test that all routes return 401 without session), rate limited, `noindex` |
| Employee code | Generated by Postgres from id (`ACME-00001`) | Generated in app | Never duplicated, no race |
| Level column | Postgres enum | Text | Sorts by seniority, not A–Z |
| Architecture | Modular monolith | Microservices | One team, ~5 req/s |
| Commits | Conventional Commits on `main` | Feature branches + PRs | Solo dev; history easy to read |
| Theme | Light only | Light + dark | User decision; a half-done dark theme reads worse than none |

## Why Kysely over Prisma

| Need | Prisma | Kysely + codegen |
|---|---|---|
| Types match the DB | ✅ generated | ✅ generated (`kysely-codegen`) |
| Migrations | ✅ generated from schema | ✍️ written in SQL (reviewed, explicit) |
| Email unique only among active rows (rehire) | ❌ not in schema → raw SQL | ✅ |
| Employee code generated by Postgres | ❌ not supported → raw SQL | ✅ |
| Median / percentiles for insights | ❌ raw SQL (`$queryRaw` / TypedSQL) | ✅ typed in the query builder |
| Size | Large (generator + client) | Small |

The hardest parts (insights, special indexes) would be raw SQL in Prisma anyway, so it adds weight without removing work.

## Packages

| Package | Holds |
|---|---|
| `apps/web` | UI |
| `apps/api` | Routes, auth, rate limit, business logic |
| `packages/db` | Schema, migrations, Kysely, queries, seed |
| `packages/shared` | Zod schemas, types, utilities |

## Deliberately not built

| What | Why |
|---|---|
| Sign-up, password reset, SSO | HR users are seeded; one persona |
| Roles / permissions (RBAC) | One persona (HR Manager) |
| FX / USD conversion | Needs external rates; salaries shown in local currency only |
| CI pipeline (GitHub Actions) | Roll out later; tests run locally before each commit |
| Payroll, tax, payslips | Separate domain with its own rules |
| Approval workflow | HR edits directly |
| Bulk Excel import | Own project (error reports); seed script stands in |
| Compa-ratio, pay-band flags | Product decision: not needed for v1 |
| Bonus, equity | Base salary answers the core question |
| Cache, queue, load balancer | 10k rows, ~5 req/s – not needed yet (see Phase 2) |
| Observability stack | Request logs are enough for ~10 users |
| End-to-end browser tests (Playwright) | Heavy; unit + API tests cover the logic |
| Full audit log (non-salary edits) | Salary history covers the core need |
| Restore deleted employee | Rare; data is kept, can be added later |
| Mobile layout | HR works on desktop |
| Relocating an employee to another country (currency change) | Salary is stored in the country's minor units, so editing the country would corrupt it; a relocation needs an FX decision and a salary-history entry. Add a new record instead (country is rejected on edit) |
| Manager / org chart | Not needed for pay questions |
| Screen to edit departments / job titles | Seeded once; rare changes can be a migration or seed |

## Changes from system-design.md

| Was | Now | Why |
|---|---|---|
| USD conversion in insights | Local currency only | No FX rates to maintain |
| Salary change via `PATCH` | Separate `salary-changes` endpoint | Simpler rules per endpoint |
| Insights API fixed | Designed when we build it | Build employees first |
| `services/` + `repositories/` folders | Feature modules in `api`, SQL in `packages/db` | Same layers, split by package |
| Facets with counts | Static option lists | Only real values, narrows as you filter |
| One-scan facets | One grouped query per dimension | `GROUPING SETS` + per-dimension `FILTER` scans the rows once instead of six times; same "all other filters" rule |
| Trigram index on search | `pg_trgm` GIN on full name, email, code (partial on active rows) | Seq scan per search | Contains search on ILIKE uses the index for 3+ characters; 2 characters fall back to a scan |
| Streamed CSV | Cursor (`pg-cursor`) piped to the response | Build the whole file in memory | Flat memory and early first bytes at 100k+ rows; same bytes out |
