# ACME Salary Management

Web app for an HR Manager to manage salaries of 10,000 employees and see how the org pays people.

Docs: [requirements](docs/requirements.md) · [decisions](docs/decisions.md) · [plan](docs/plan.md) · [API](docs/api.md) · [system design](docs/system-design.md)

## Run locally

Needs Node 26+, pnpm, and Docker (or OrbStack).

```sh
cp .env.example .env
docker compose up -d db
pnpm install
pnpm --filter @acme/db migrate
pnpm check        # typecheck + lint + format + DB types up to date + tests
```

Run the web app: `pnpm --filter @acme/web dev` (http://localhost:5173, proxies `/api` to the API on :3000; start it with `pnpm --filter @acme/api dev`).

After changing a migration: `pnpm --filter @acme/db migrate && pnpm --filter @acme/db db:types`.
