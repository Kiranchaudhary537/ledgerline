# ACME Salary Management

Web app for an HR Manager to manage salaries of 10,000 employees and see how the org pays people.

Docs: [coding standards](docs/coding-standards.md) · [requirements](docs/requirements.md) · [decisions](docs/decisions.md) · [plan](docs/plan.md) · [API](docs/api.md) · [system design](docs/system-design.md)

## Run locally

Needs Node 26+, pnpm and Docker (or OrbStack).

```sh
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:setup     # migrate + seed 10,000 employees and the HR user from .env
pnpm dev          # API on :3000 and web on :5173, together
```

| Command | Does |
|---|---|
| `pnpm dev` | API (watch) + web (Vite) together |
| `pnpm build` | Typecheck all packages, build the web app (the API runs TypeScript directly, no build) |
| `pnpm start` | API in production mode + built web app via `vite preview` |
| `pnpm db:migrate` / `db:seed` / `db:setup` | Migrate, seed, or both |
| `pnpm check` | Typecheck, lint, format, DB types up to date, all tests |

After changing a migration: `pnpm db:migrate && pnpm --filter @acme/db db:types`.

## Configuration

- **Behaviour** (page sizes, session length, rate limits, seed size…): edit `packages/shared/src/config.ts`, the only place for tunable values.
- **Environment** (`.env`, validated in `apps/api/src/env.ts`): `DATABASE_URL` (required), `PORT` (default 3000), `HOST` (default 0.0.0.0), `NODE_ENV`. The seed script also reads `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; tests read `TEST_DATABASE_URL`.
