# Deploy (M10)

Web on Vercel, API + Postgres on Render (same region). Vercel proxies `/api/*` to Render, so the browser sees one origin and the session cookie works.

## 1. Render (API + database)

1. Render dashboard, New, Blueprint, pick this repo. It reads `render.yaml` and creates `ledgerline-db` (Postgres) and `ledgerline-api` (web service), both in `oregon`.
2. Wait for the first deploy. Each start runs migrations, then the API. Check `https://<service>.onrender.com/api/health`.
3. Note the real service host (Render adds a suffix if the name is taken).

## 2. Seed once (destructive: it truncates all data)

Free web services have no shell, so run the seed from your machine against the database:

1. Render, `ledgerline-db`, Connections, copy the **External Database URL**.
2. Run:
   ```sh
   DATABASE_URL='<external url>' SEED_ADMIN_EMAIL='you@example.com' \
   SEED_ADMIN_PASSWORD='<12+ chars>' pnpm --filter @acme/db seed
   ```
3. Do not run it again on production unless you want to wipe the data. The seed variables are deliberately not in `render.yaml`.

On a paid web service you can use the Render Shell instead.

## 3. Vercel (web)

1. `apps/web/vercel.json` already points `/api/*` to `https://ledgerline-api.onrender.com`. If Render had to rename the service (name taken), update that host, commit, push.
2. Vercel, Add New Project, import the repo, set **Project Name** to `ledgerline` (the URL becomes `https://ledgerline.vercel.app`) and **Root Directory** to `apps/web`. Leave the build settings alone: `vercel.json` sets them. Keep "Include source files outside of the Root Directory" on (default) so the workspace install works.
3. Deploy.

## 4. Smoke checks

- `https://ledgerline.vercel.app/api/health` returns 200 (proves the rewrite).
- Log in with the seeded HR user.
- DevTools, Application, Cookies: the session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`.
- Reload a deep link such as `/employees`: the page loads (SPA fallback).

## API settings behind two proxies

`cookieSecure` is already on when `NODE_ENV=production`. `trustProxy` is also on in production, so rate limiting keys on the real client IP.

## Known limits

- Free web service sleeps after 15 minutes idle; the next request takes about a minute (Vercel may time out on that first request).
- Free Postgres expires 30 days after creation, then 14 days of grace before deletion. 1 GB, no backups, one free Postgres per workspace. Change the plan in `render.yaml` before expiry.
- No `preDeployCommand` and no shell on free web services, so migrations run in the start command and a failed migration stops the boot.
- Node 26 does not ship Corepack, so the build installs pnpm with npm. If the build log shows another pnpm version, adjust `buildCommand`.
- Render's docs do not confirm Node 26 is available; if the build rejects `NODE_VERSION=26`, check the Render Node version page.
- Docs: <https://render.com/docs/blueprint-spec>, <https://render.com/docs/free>, <https://render.com/docs/node-version>, <https://vercel.com/docs/project-configuration/vercel-json>
