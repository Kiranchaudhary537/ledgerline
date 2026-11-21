# Folder structure

Code is grouped by **feature**, not by file type. Tests sit next to the code (`x.ts` → `x.test.ts`).

```
apps/
  api/                      Fastify: routes, auth, business logic
    src/
      app.ts                builds the app (used by server and tests)
      server.ts             starts listening
      config.ts             env, checked by Zod at boot
      errors.ts             AppError + error handler (→ error-handling.md)
      plugins/              db, session auth, rate limit
      modules/
        auth/               routes.ts · service.ts
        employees/          routes.ts · service.ts   (list, detail, create, edit, delete, export)
        salary-changes/     routes.ts · service.ts
        meta/               routes.ts                (filter lists)
  web/                      React + Vite + shadcn
    src/
      main.tsx · router.tsx
      lib/api.ts            fetch wrapper → returns data or throws ApiError
      components/ui/        shadcn primitives
      components/           app-wide pieces (layout, empty state, error banner)
      features/
        auth/               login page, session hook
        employees/          list page, detail page, forms, hooks

packages/
  shared/                   used by api AND web
    src/
      schemas/              Zod: employee, salary-change, list-query, auth
      errors.ts             error codes + default messages
      money.ts              minor units ↔ display
      constants.ts          countries, levels, departments, employment types, genders
  db/                       everything that touches Postgres
    src/
      client.ts             Kysely instance
      types.ts              table types
      migrations/
      queries/              employees.ts · salary-changes.ts · users.ts · sessions.ts
      seed/                 index.ts + data/ (names per country, salary bands)

docs/
docker-compose.yml · pnpm-workspace.yaml · tsconfig.base.json · .env.example
```

## Dependency rule

```
web ──► shared
api ──► shared, db
db  ──► shared
```

- `shared` depends on nothing.
- Only `db` writes SQL.
- `web` never imports `api` or `db`.
