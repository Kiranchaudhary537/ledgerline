# ACME Salary Management

A web app that replaces ACME's Excel sheets. The HR Manager uses it to manage salaries for 10,000 employees and to answer questions like *"What is the median salary of a Software Engineer in India?"*

- **Live:** https://ledgerline-theta-bice.vercel.app (the free API takes about a minute to wake up)
- **Demo video:** [Google Drive](https://drive.google.com/file/d/17tsxsk26Fb6Bz4_AvJNQNc19jYaQf4q3/view?usp=drive_link)
- **Login:** `hr@acme.example` / `hr@123`. This short password is deliberate, so reviewers can log in fast. It skips the 12-character rule the seed script enforces (`config.seed.adminPasswordMinLength`), and would be rotated after the review.
- **Requirements (written before building):** [docs/requirements.md](docs/requirements.md)
- **System design diagram:** [Excalidraw board](https://excalidraw.com/#json=qXfSBfsghaeuzmqknR7Ai,SjkORtY0JrrfZWGS1sFmmA), with a short explanation in [docs/system-design.md](docs/system-design.md)
- **Stack:** TypeScript everywhere · React + Vite + shadcn/ui · Fastify · PostgreSQL + Kysely · Zod shared between API and UI · Vitest

## What it does

Login, an employee list (search, filter, sort, paging, under 200 ms), employee CRUD, salary changes with history, CSV export, and pay insights (median, range, distribution by country, role and level). Scope and what's left out, with reasons: [requirements](docs/requirements.md).

## Run locally

Needs Node 26+, pnpm and Docker.

```sh
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:setup   # migrate, then seed 10,000 employees (same data every run)
pnpm dev        # API on :3000, web on :5173
pnpm check      # typecheck, lint, format, DB types up to date, all tests
pnpm e2e        # browser smoke test (own DB and ports; first run: pnpm exec playwright install chromium)
pnpm bench      # employee-list latency on the seeded DB
```

## How it works

```
apps/web  (React SPA)  ──/api/*──►  apps/api  (Fastify: routes → services)  ──►  packages/db  (Kysely, SQL, migrations, seed)  ──►  Postgres
                └──────────── packages/shared (Zod validation, money, error codes, config) ────────────┘
```

- Modular monolith, split by feature. Routes validate input, services hold the rules, repositories in `packages/db` are the only place that writes SQL.
- Every route needs a session by default, and a test checks that each one returns 401 without it.
- Vercel proxies `/api/*` to Render, so the browser sees a single origin. Details: [docs/deploy.md](docs/deploy.md).

More: [diagram](https://excalidraw.com/#json=qXfSBfsghaeuzmqknR7Ai,SjkORtY0JrrfZWGS1sFmmA) · [system design](docs/system-design.md) · [API](docs/api.md) · [errors](docs/error-handling.md) · [folder structure](docs/structure.md)

## Design decisions and trade-offs

| Chose | Over | Why | Trade-off |
|---|---|---|---|
| Modular monolith: routes → services → repositories | Microservices | One team, ~5 req/s. Clear layers keep it testable and easy to split later | Parts can't scale on their own |
| One TypeScript monorepo, Zod schemas shared by API and UI | Separate repos, per-app validation | Same rules and types on both sides, so they never drift | The packages are coupled through `shared` |
| PostgreSQL + Kysely (SQL migrations, generated types) | Prisma, MongoDB | Relational data and real transactions. Partial unique indexes and medians would be raw SQL in Prisma anyway ([comparison](docs/decisions.md#why-kysely-over-prisma)) | Migrations are written by hand |
| Salary change in one transaction + optimistic locking (`version`) | Updating salary inside `PATCH`, row locks | Never half-saved, and no lost updates without holding locks | The client must send `version` and handle `409` |
| httpOnly session cookie stored in Postgres | JWT in localStorage | Safe from XSS, and logout really ends the session | One DB read per request |
| Money as integer minor units (`BIGINT`), local currency | Floats, FX conversion | No rounding errors, no external rate dependency | No cross-country salary comparison |
| No cache, queue or load balancer | Redis, workers, N instances | 10k rows: queries take a few ms, so fewer moving parts | Needs adding at scale ([when](docs/system-design.md#trade-offs)) |

All decisions with alternatives: [docs/decisions.md](docs/decisions.md).

## Code quality

- Spec, then a failing test, then code: a `test:` commit, then a `feat:` or `fix:` commit. How we work, and a guided read of one feature end to end: [CONTRIBUTING.md](CONTRIBUTING.md).
- About 310 tests in 56 files, plus one Playwright run of the critical path. Coverage is 95% of lines, and `pnpm check` fails below the floor in `vitest.config.ts`. They run against a real Postgres, with no mocked database. Services are also tested with fake repositories.
- Strict TypeScript. DB types are generated from the migrated schema, and `pnpm check` fails if they're stale.
- `pnpm ship` runs every check, deploys, then smoke-tests production.
- CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs on every push and PR against Postgres 17: `pnpm check`, `pnpm build`, `pnpm e2e` (Playwright: log in, search, change a salary, see it in history) and `pnpm bench` (list p95 vs the 200 ms target on 10k rows).
- Standards: [docs/coding-standards.md](docs/coding-standards.md)

## How I used AI

Claude Code was the pair programmer. I made the product and design decisions. AI proposed options, wrote code test-first and reviewed its own work.

- **Requirements:** about 50 questions in rounds (a custom `drillme` skill in [.claude/skills](.claude/skills)). I accepted, changed or rejected each answer, and the results went into `docs/`.
- **Build:** a lead agent wrote the contracts, then gave scoped tasks to parallel agents, each in its own git worktree with its own test DB. I reviewed every merge.
- **UI:** a design skill for the direction, then an accessibility and UX audit of each screen.
- **Where I overruled it:** MUI → shadcn, USD conversion → local currency only, `int` → `bigint` ids, and more.

Full write-up, including the AI's mistakes and how they were caught: [docs/ai-prompts.md](docs/ai-prompts.md). What surprised us while building, written up so others don't repeat it: [docs/lessons.md](docs/lessons.md).

## What I'd improve next

- Roles and SSO with row-level security, once managers and employees use it.
- Observability (OpenTelemetry metrics, traces, alerts) instead of request logs only.
- At scale: cursor pagination, a read replica and a cache for insights ([scaling plan](docs/system-design.md#scaling-later-designed-not-built)).
