# System design

**Diagram (start here):** [Excalidraw board](https://excalidraw.com/#json=qXfSBfsghaeuzmqknR7Ai,SjkORtY0JrrfZWGS1sFmmA)

## Problem

ACME's HR team manages 10,000 employees' salaries in Excel. That's slow and error-prone, keeps no history, and makes "how do we pay people?" hard to answer. One persona: the HR Manager.

## Size, and why a simple design is enough

| Metric | Estimate | So |
|---|---|---|
| Users | ~10 HR users | One API instance |
| Traffic | ~5 requests/s at peak | No cache, queue or load balancer |
| Data | 10k employees ≈ 3 MB | Aggregates in SQL take milliseconds |

## Components

```
Browser (React SPA, Vercel) ──/api/*──► API (Fastify, Render) ──SQL──► PostgreSQL (Render)
                                                                          ▲
                                                     Seed script ─────────┘ 10k employees
```

Three runtime parts. Vercel proxies `/api/*`, so the browser sees one origin and the session cookie stays first-party.

## A request, step by step

```
request → rate limit → auth → validate → service → repository → Postgres
            429         401      400      404/409      503
```

| Step | Does |
|---|---|
| Rate limit | 300 requests/min per user (per IP before login). Login: 5/min per IP + email |
| Auth | Session cookie → session row → user. Every route is protected unless listed in `PUBLIC_ROUTES` |
| Validate | Shared Zod schema, the same one the UI uses |
| Service | Business rules: version check, unique email, insights maths |
| Repository | The only place with SQL. Writes run in one transaction |

**Example, salary change:** `POST /api/employees/42/salary-changes {newSalaryMinor, reason, version: 3}` → version matches → `BEGIN; UPDATE employees … version = 4; INSERT salary_changes …; COMMIT` → `200 Employee`. A stale version gets `409` and the UI shows "Reload".

## Data model

```
users           (id, email UNIQUE, password_hash, name)
sessions        (id = sha256(token), user_id, expires_at)
countries       (code, name, currency, locale)
departments     (name)
job_titles      (department, title)
employees       (id BIGINT, employee_code GENERATED 'ACME-00001', full_name, email,
                 department, job_title, level, country_code, employment_type, gender,
                 hire_date, salary_minor BIGINT, version, deleted_at)
salary_changes  (employee_id, old_salary_minor, new_salary_minor, reason, changed_by, changed_at)   append-only
```

- Money is an integer in minor units, in the country's own currency, so there are no rounding errors. The currency comes from the country, never from user input.
- Email is unique among active rows only, so a rehired person can reuse it. Delete is soft (`deleted_at`).
- A composite foreign key `(department, job_title)` means Postgres rejects a job title from the wrong department.
- Indexes: `(country_code, job_title, level)` for insights, trigram GIN for search. Medians use `percentile_cont`.

## Edge cases

| Case | Handling |
|---|---|
| Two HR users edit the same record | `version` check → `409`, and the UI offers "Reload" |
| Salary saved but history fails | Same transaction, so both are saved or neither |
| Duplicate email / double submit | Unique index → `409`; the button is disabled while saving |
| Bad input | `400` with an error per field |
| No session | `401` on every route (a test checks every route) |
| Brute-force login | `429` + `Retry-After` |
| Mixing currencies | Salary sort and insights need exactly one country |
| Small groups | Gender gap hidden below 5 people |
| Database down | `503`, and nothing is half-written |
| CSV formula injection | Cells starting with `= + - @` get escaped |

## Trade-offs

| Chose | Over | Cost | Revisit when |
|---|---|---|---|
| Modular monolith | Microservices | Parts can't scale on their own | Several teams |
| PostgreSQL | MongoDB | Every change needs a migration | Unlikely: the data is relational |
| Live SQL | Redis cache | Insights recomputed on every call | Insights p95 > 300 ms |
| One instance, in-memory rate limit | Load balancer + N servers | Downtime on a crash; counters are per server | Uptime SLA, or a second server |
| Sessions in Postgres | JWT in localStorage | One DB read per request | Sessions move to Redis at scale |
| Local currency only | FX conversion | No cross-country salary comparison | A trusted FX source is needed |
| Offset paging | Cursor paging | Deep pages get slower | Far more than 10k rows |

## Scaling later (designed, not built)

At ~50k users (HR, managers, employees):
- A load balancer in front of 2+ stateless API servers, with sessions and rate limits moved to Redis.
- A Postgres read replica, plus a Redis cache for insights.
- A Postgres-table job queue for bulk import and export.
- SSO with roles and row-level security, and OpenTelemetry for metrics and alerts.

The code layers stay the same, so this adds infrastructure rather than a rewrite.

More detail: [API](api.md) · [decisions](decisions.md) · [errors](error-handling.md) · [folder structure](structure.md)
