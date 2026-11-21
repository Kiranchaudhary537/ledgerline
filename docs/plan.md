# Build plan

v1 first, then deploy. Each step = a few small commits. Tests first on logic (red → green → refactor).

**Done for every step:** tests pass, typecheck + lint clean, docs updated, committed.

## v1

| # | Step | Package | Tests |
|---|---|---|---|
| 0 | Scaffold: pnpm workspace, strict TS, ESLint + Prettier, Vitest, `docker-compose.yml`, `.env.example` | all | one passing smoke test |
| 1 | Shared: Zod schemas (employee, salary change, list query), money helpers (minor units per currency) | shared | parse/format INR, USD, JPY (0 decimals); invalid input rejected |
| 2 | Schema: migrations for `users`, `sessions`, `countries`, `employees`, `salary_changes`; indexes; partial unique | db | migrate up on empty DB; unique email only among active rows |
| 3 | Seed: realistic, connected 10k employees (see below) | db | same seed → same data; 10k rows; salaries inside bands; history ends at current salary |
| 4 | API skeleton: app factory, env check, error format `{code,message,fields}`, `/health`, log redaction | api | health 200/503; bad input → 400 with fields; salary never in logs |
| 5 | Auth: login, logout, session cookie, rate limit | api | wrong password 401; 6th try 429; no cookie 401 |
| 6 | Employees read: list (search/filter/sort/page), detail, filter lists | api, db | each filter; sort whitelist; pageSize > 100 → 400; deleted hidden |
| 7 | Employees write: create, edit (version), soft delete, salary change + history | api, db | duplicate → 409; stale version → 409; failed history insert → salary unchanged |
| 8 | CSV export of current filter | api | header + rows match filter |
| 9 | Web v1: login, list, detail/edit, salary change, history (**UI design discussed first**) | web | form validation, conflict message |
| 10 | Deploy: Render (API + Postgres, same region), Vercel (web + `/api` rewrite), run seed | – | smoke check on live URL |

## Seed: realistic and connected

| Rule | Example |
|---|---|
| Name and locale match country | India → Indian names; Japan → Japanese names |
| Email from name | `priya.sharma@acme.com` (number added if taken) |
| Job title belongs to a department, with levels | Engineering → Software Engineer I/II/Senior/Staff |
| Salary = band(country × job title × level) ± small spread | Senior SWE India ≈ ₹3.0–4.2M; Germany ≈ €75–95k |
| Hire date fits level | Staff engineers hired years ago; juniors recently |
| Salary history leads to current salary | Hire salary → yearly raises → today's value |
| Headcount per country is uneven, like a real org | More in US/India, fewer in Japan/Brazil |

## After v1

- Pay insights (API + UI) – design when we start it.
- Hardening against edge cases in [system-design.md §9](system-design.md).
- Demo video.
