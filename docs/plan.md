# Build plan

Vertical slices: each milestone works end to end before the next. One task ≈ 1–3 commits.
🔴 = test first (`test:` commit, then `feat:`).

**Done for every task:** tests pass, typecheck + lint clean, docs updated, committed ([commit-conventions.md](commit-conventions.md)).

Reference: [decisions](decisions.md) · [structure](structure.md) · [api](api.md) · [errors](error-handling.md)

## M0 – Scaffold

- [x] pnpm workspace, `tsconfig.base.json` (strict), ESLint + Prettier, root Vitest
- [x] `docker-compose.yml` (Postgres), `.env.example`, `.gitignore`
- [x] README: how to run
- Each package is created when its milestone starts (no empty placeholder tests)

## M1 – Shared (`packages/shared`)

- [x] Constants: 8 countries (currency, locale, minor unit), departments → job titles, levels, employment types, genders
- [x] 🔴 Money: major ↔ minor units, format by locale (INR, EUR, JPY with 0 decimals, bad input)
- [x] 🔴 Errors: code table (status + message), `ApiError` shape
- [x] 🔴 Schemas: employee create/edit, salary change, list query (multi values, salary-sort rule, pageSize cap), insights query (one-country rule)

## M2 – Database (`packages/db`)

- [x] Kysely client, migration runner, test helper (tables reset before each DB test)
- [x] Migrations: `users`, `sessions`, `countries`, `employees`, `salary_changes`, indexes, partial unique
- [x] 🔴 Seed generator (pure): deterministic, salaries inside bands, history ends at current salary, unique emails, uneven headcount
- [x] Seed writer: batch insert 10k + HR user from env; re-run = truncate + reseed

## M3 – API base (`apps/api`)

- [x] App factory, Zod config, request log (no salary, with `requestId`)
- [x] 🔴 Error handler: Zod → 400 + fields, unique violation → 409, DB down → 503, unknown → 500
- [x] 🔴 `GET /api/health` (200 / 503)

## M4 – Auth

- [x] 🔴 Queries: users, sessions
- [x] 🔴 Login / logout, session cookie (httpOnly, 8 h), auth plugin → 401
- [x] 🔴 Rate limit: 6th login in a minute → 429

## M5 – Employees read

- [x] 🔴 List query: every filter, AND/OR, sort whitelist, salary sort only for one country, paging, deleted hidden
- [x] 🔴 `GET /employees`, `GET /employees/:id`, `GET /meta/filters`

## M6 – Employees write

- [x] 🔴 Create (code auto-generated; duplicate email → 409)
- [x] 🔴 Edit with version (stale → 409)
- [x] 🔴 Soft delete (then 404)
- [x] 🔴 Salary change + history in one transaction (failed history insert → salary unchanged); `GET /employees/:id/salary-history`

## M7 – CSV export

- [x] 🔴 `GET /employees/export.csv` with current filters (header + rows match)

## M8 – Insights API

- [ ] 🔴 `stats`, `distribution`, `gender-gap` against ~12 hand-picked employees (even-count median, gap < 5 → null)

## M9 – Web (`apps/web`)

**Skills:** `frontend-design` (look) · `dataviz` (charts) · `prototype` (style tile) · `web-design-guidelines` (audit).

**Loop for every screen:** design (`frontend-design`) → build → audit (`web-design-guidelines`) → fix findings → screenshot + check against the anti-slop checklist → remove one unneeded element → commit.

- [ ] `docs/ui-design.md`: brief (user, one job per screen), tokens (4–6 colours, one typeface with tabular figures, type scale, radius by hierarchy), ASCII wireframes, anti-slop checklist
- [ ] Style tile in 2 directions with real seed rows (table row, salary form, one chart) → **user picks one**
- [ ] Replace shadcn defaults with the chosen tokens
- [ ] App shell, router, `lib/api.ts`, error handling (toast, inline fields, 401 → login, 409 banner)
- [ ] Login page
- [ ] 🔴 Employee list: table, search, filters, sort, paging – all in URL
- [ ] Employee detail + salary history timeline
- [ ] 🔴 Forms: add / edit (side sheet), change salary, delete confirm
- [ ] Insights page: country picker, KPIs, pay by role, distribution, gender gap, countries overview; row → filtered list

## M10 – Deploy

- [ ] Render: Postgres + API (same region), run migrations + seed
- [ ] Vercel: web + `/api/*` rewrite to Render
- [ ] Smoke check on live URL

## M11 – Finish

- [ ] Edge cases from [system-design.md §9](system-design.md)
- [ ] `docs/ai-prompts.md` (how AI was used)
- [ ] Demo video

## Seed: realistic and connected

| Rule | Example |
|---|---|
| Name matches country and gender | India → Priya Sharma; Japan → Haruto Sato (romanized) |
| Email from name | `priya.sharma@acme.com` (number added if taken) |
| Job title belongs to a department, has a level | Engineering → Software Engineer, Senior |
| Salary = band(country × job title × level) ± spread | Senior SWE India ≈ ₹30–42L; Germany ≈ €75–95k |
| Small built-in gender gap in some roles | So the gap view shows something real |
| Hire date fits level | Principals hired years ago; juniors recently |
| Salary history leads to current salary | Hire salary → yearly raises → today |
| Uneven headcount per country | More in US / India, fewer in Japan / Brazil |
