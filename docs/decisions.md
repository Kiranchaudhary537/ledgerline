# Decisions

Full design: [system-design.md](system-design.md)

## Chosen

| Area | Chose | Over | Why |
|---|---|---|---|
| Runtime | Node 24 LTS (`tsx` dev, `tsc` build) | Bun, Deno | Stable, supported by every host |
| Language | Node.js + TypeScript | Python, Java | One language for API and UI; shared types |
| API framework | Fastify | Express | Built-in validation, log redaction, in-memory test requests |
| Database | PostgreSQL | SQLite, MongoDB | Relational data, real transactions, median in SQL, managed backups |
| Query layer | Kysely | Prisma, Drizzle, raw SQL | Typed, reads like SQL, built-in migrations, no ORM magic |
| Validation | Zod (shared) | Per-app validation | API and UI check the same rules |
| Frontend | React + Vite | Next.js | SPA is enough; no second server runtime |
| UI kit | shadcn/ui + TanStack Table + Recharts | MUI, Mantine | Light, own the components, flexible table |
| Repo | pnpm monorepo | Separate repos | One place, shared code; no Turborepo (not needed) |
| Hosting – UI | Vercel | Netlify, Render | Free, auto-detects Vite |
| Hosting – API + DB | Render (same region) | Fly + Neon, Railway | API and DB close together, one provider |
| Same origin | Vercel rewrite `/api/*` → Render | CORS + cross-site cookies | Browsers block third-party cookies |
| Auth | Session cookie in Postgres, argon2id | JWT in localStorage | Safe from XSS, can log out for real |
| Money | Integer minor units, local currency | Floats, FX conversion | No rounding errors; no external rates |
| Salary type | `BIGINT`, annual gross base, minor units | `INTEGER` | Some currencies overflow 2.1 billion |
| Job title, department | Plain text, validated against existing list | Lookup tables | Fewer tables; still no typo groups |
| Salary change | Own endpoint `POST /employees/:id/salary-changes` | Inside `PATCH /employees/:id` | Reason + history rules stay in one place |
| Search | `ILIKE '%q%'` + offset paging (max 100) | Full-text, `pg_trgm`, cursors | 10k rows → a few ms |
| Uniqueness | Partial unique index (active rows only) | Plain unique | Rehired person can reuse email |
| Seed | Realistic, connected data, fixed random seed | Random fake data | Insights must make sense; same data every run |
| Rate limit | `@fastify/rate-limit`, in memory | Redis | One server; counts are correct |
| Config | Env checked by Zod at boot | Read env ad hoc | Missing config fails at start, not later |
| Testing | Vitest only; real Postgres via `docker compose`, rollback per test | Jest, Testcontainers, Playwright | One light tool; real DB, no mocks |
| Local dev | `docker compose up db` + `pnpm dev` | Local Postgres install | Same DB for everyone |
| Architecture | Modular monolith | Microservices | One team, ~5 req/s |
| Commits | Conventional Commits on `main` | Feature branches + PRs | Solo dev; history easy to read |

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
| Bonus, equity | Base salary answers the core question |
| Cache, queue, load balancer | 10k rows, ~5 req/s – not needed yet (see Phase 2) |
| Observability stack | Request logs are enough for ~10 users |
| End-to-end browser tests (Playwright) | Heavy; unit + API tests cover the logic |

## Changes from system-design.md

| Was | Now | Why |
|---|---|---|
| USD conversion in insights | Local currency only | No FX rates to maintain |
| Salary change via `PATCH` | Separate `salary-changes` endpoint | Simpler rules per endpoint |
| Insights API fixed | Designed when we build it | Build employees first |

