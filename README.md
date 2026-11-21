# ACME Salary Management

Web app for an HR Manager to manage salaries of 10,000 employees and see how the org pays people.

Docs: [requirements](docs/requirements.md) · [decisions](docs/decisions.md) · [plan](docs/plan.md) · [API](docs/api.md) · [system design](docs/system-design.md)

## Run locally

Needs Node 26+, pnpm, and Docker (or OrbStack).

```sh
cp .env.example .env
docker compose up -d db
pnpm install
pnpm check        # typecheck + lint + format + tests
```
