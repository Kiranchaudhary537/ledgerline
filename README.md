# ACME Salary Management

A web app that replaces ACME's Excel sheets. The HR Manager uses it to manage salaries for 10,000 employees and to answer questions like *"What is the median salary of a Software Engineer in India?"*

- **Live:** https://ledgerline-theta-bice.vercel.app (the free API takes about a minute to wake up)
- **Demo video:** [Google Drive](https://drive.google.com/file/d/17tsxsk26Fb6Bz4_AvJNQNc19jYaQf4q3/view?usp=drive_link)
- **Login:** `hr@acme.example` / `hr@123`. This short password is deliberate, so reviewers can log in fast. It skips the 12-character rule the seed script enforces (`config.seed.adminPasswordMinLength`), and would be rotated after the review.
- **Requirements (written before building):** [docs/requirements.md](docs/requirements.md)
- **System design diagram:** [Excalidraw board](https://excalidraw.com/#json=qXfSBfsghaeuzmqknR7Ai,SjkORtY0JrrfZWGS1sFmmA), with a short explanation in [docs/system-design.md](docs/system-design.md)
- **Stack:** TypeScript everywhere · React + Vite + shadcn/ui · Fastify · PostgreSQL + Kysely · Zod shared between API and UI · Vitest

## What it does

- Log in and log out. A sixth failed login within a minute gets blocked.
- Employee list: search, filter, sort and page through 10k rows in under 200 ms. Filters live in the URL, so a view can be shared as a link.
- Add, view, edit and soft-delete employees. A duplicate email gets a clear error.
- Salary change with a reason. The new salary and its history row (who, when, old, new) are saved in one transaction.
- Concurrent edits: if a second HR user saves over an edit, they're told to reload instead of overwriting it (version check).
- CSV export of the current filtered list, streamed from the database.
- Pay insights per country: median and range, distribution, and gender gap by role.

## Run locally

Needs Node 26+, pnpm and Docker.

```sh
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:setup   # migrate, then seed 10,000 employees (same data every run)
pnpm dev        # API on :3000, web on :5173
pnpm check      # typecheck, lint, format, DB types up to date, all tests
```

## How it works

```
apps/web  (React SPA)  ──/api/*──►  apps/api  (Fastify: routes → services)  ──►  packages/db  (Kysely, SQL, migrations, seed)  ──►  Postgres
                └──────────── packages/shared (Zod validation, money, error codes, config) ────────────┘
```

- Modular monolith, split by feature. Routes validate input, services hold the rules, repositories in `packages/db` are the only place that writes SQL.
- Money is stored as integer minor units (`BIGINT`) in the local currency. There's no FX conversion, so salaries in different currencies are never mixed.
- Auth is an httpOnly session cookie stored in Postgres. Every route needs a session, and a test checks that each one returns 401 without it.
- Vercel proxies `/api/*` to Render, so the browser sees a single origin. Details: [docs/deploy.md](docs/deploy.md).

More: [diagram](https://excalidraw.com/#json=qXfSBfsghaeuzmqknR7Ai,SjkORtY0JrrfZWGS1sFmmA) · [system design](docs/system-design.md) · [API](docs/api.md) · [errors](docs/error-handling.md) · [folder structure](docs/structure.md)

## Key decisions

| Decision | Why |
|---|---|
| Kysely over Prisma | Partial unique indexes, generated employee codes and medians would all need raw SQL in Prisma ([comparison](docs/decisions.md#why-kysely-over-prisma)) |
| Salary change has its own endpoint | Reason and history rules stay in one place, in one transaction |
| Optimistic locking (`version`) | No lost updates, and no locks held |
| Salary sort only when one country is filtered | ₹ and € can't be compared without FX |
| Gender gap hidden for groups under 5 | One person would swing the % |
| Live SQL with indexes, no cache or queue | 10k rows at ~5 req/s. Queries run in a few ms and results are always fresh |
| Seed data is realistic and deterministic | Salaries fit country × role × level bands, so the insights mean something |

All decisions with the alternatives I turned down: [docs/decisions.md](docs/decisions.md). What I left out on purpose, and why: [requirements](docs/requirements.md#deliberately-left-out).

## Code quality

- Tests come first: a `test:` commit, then a `feat:` commit ([conventions](docs/commit-conventions.md)).
- About 275 tests in 53 files. They run against a real Postgres, with no mocked database. Services are also tested with fake repositories.
- Strict TypeScript. DB types are generated from the migrated schema, and `pnpm check` fails if they're stale.
- `pnpm ship` runs every check, deploys, then smoke-tests production.
- Standards: [docs/coding-standards.md](docs/coding-standards.md)

## How I used AI

Claude Code was the pair programmer. I made the product and design decisions. AI proposed options, wrote code test-first and reviewed its own work.

- **Requirements:** about 50 questions in rounds (a custom `drillme` skill in [.claude/skills](.claude/skills)). I accepted, changed or rejected each answer, and the results went into `docs/`.
- **Build:** a lead agent wrote the contracts, then gave scoped tasks to parallel agents, each in its own git worktree with its own test DB. I reviewed every merge.
- **UI:** a design skill for the direction, then an accessibility and UX audit of each screen.
- **Where I overruled it:** MUI → shadcn, USD conversion → local currency only, `int` → `bigint` ids, and more.

Full write-up, including the AI's mistakes and how they were caught: [docs/ai-prompts.md](docs/ai-prompts.md)
