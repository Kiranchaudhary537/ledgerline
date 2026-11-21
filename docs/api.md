# API

Errors: see [error-handling.md](error-handling.md). All routes need a session except `POST /api/auth/login` and `GET /api/health`. Protection is the default: a new route is
protected unless added to `PUBLIC_ROUTES` in `apps/api/src/plugins/auth.ts`.

## Auth

| Endpoint | Result |
|---|---|
| `POST /api/auth/login` `{ email, password }` | `200 { user: { id, email, name } }` and sets the cookie. Wrong password and unknown email both give `401 INVALID_CREDENTIALS`. |
| `POST /api/auth/logout` | `204`; deletes the session and clears the cookie |
| `GET /api/auth/me` | `200 { user }`, or `401 UNAUTHENTICATED` |

- Cookie `session`: random 32-byte token (base64url), `httpOnly`, `SameSite=Lax`, `Path=/`, 8 h, `Secure` in production. Only its SHA-256 is stored in `sessions.id`.
- Rate limits (per minute, in memory, one API process): login 5 per IP + email; everything else 300 per user (per IP before login). Over the limit: `429 RATE_LIMITED` with a `Retry-After` header.

## `GET /api/employees` – list filters

Validation: `packages/shared/src/validation/list-query.ts`

| Param | Type | Rule |
|---|---|---|
| `q` | text | name / email / code contains; 2+ chars |
| `country` | multi (`IN,DE`) | known country codes |
| `department` | multi | from fixed list |
| `jobTitle` | multi | from fixed list |
| `level` | multi | Junior, Mid, Senior, Lead, Principal |
| `employmentType` | multi | full_time, part_time, contract |
| `gender` | multi | female, male |
| `sort` | `field:asc\|desc` | name, hireDate, level, compaRatio; `salary` only when exactly one country |
| `page` | int | ≥ 1, default 1 |
| `pageSize` | int | default 25, max 100 |

- Different filters → AND. Values inside one filter → OR.
- Deleted employees never returned.
- Response: `{ data: Employee[], page, pageSize, total }`.

## Employees

| Endpoint | Result |
|---|---|
| `GET /api/employees` | `{ data: Employee[], page, pageSize, total }` (filters above) |
| `GET /api/employees/:id` | `Employee`, or `404 NOT_FOUND` (deleted, missing or non-numeric id) |
| `POST /api/employees` | `201 Employee`; duplicate active email → `409 EMAIL_TAKEN` with `fields.email` |
| `PATCH /api/employees/:id` `{ ...fields, version }` | `Employee` (version + 1); no salary here. Stale → `409 STALE_VERSION`. Sending only one of `department` / `jobTitle` checks the pair against the stored employee → `400` with `fields.jobTitle` |
| `DELETE /api/employees/:id` | `204` (soft delete), or `404` |
| `POST /api/employees/:id/salary-changes` `{ newSalaryMinor, reason, version }` | `Employee`; writes a history row in the same transaction. Stale → `409`, missing → `404` |
| `GET /api/employees/:id/salary-history` | `SalaryChange[]`, newest first; `404` if the employee does not exist |
| `GET /api/employees/export.csv` | Same filters and `sort` as the list, no paging |
| `GET /api/meta/filters` | `{ countries: [{ code, name, currency }], departments: [{ name, jobTitles }], levels, employmentTypes, genders }` |

Types (`packages/shared/src/api/employees.ts`):
- `Employee`: `id, employeeCode, fullName, email, department, jobTitle, level, countryCode, currency, employmentType, gender, hireDate (YYYY-MM-DD), salaryMinor, compaRatio, version, createdAt, updatedAt` (timestamps ISO strings; `currency` derived from the country).
- `SalaryChange`: `id, oldSalaryMinor (null = starting salary), newSalaryMinor, reason, changedAt, changedByName (null = imported)`.

### CSV export

`text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="employees.csv"`, CRLF rows.
Columns: Code, Name, Email, Department, Job title, Level, Country, Employment type, Gender, Hire date, Annual salary, Currency, Compa-ratio.

- Salary is in major units as a plain decimal (`3800000.00`; JPY has no decimals).
- Fields are quoted per RFC 4180. Values starting with `=`, `+`, `-`, `@`, tab or CR get a leading `'` so spreadsheets do not run them as formulas.

## Insights

All take the **same filters as the list** (except `sort`, `page`, `pageSize`). Money is always in one currency:
if `groupBy` does not include `country`, exactly one `country` is required → else `400 VALIDATION_FAILED`.

| Endpoint | Extra params | Returns |
|---|---|---|
| `GET /api/insights/stats` | `groupBy` = 1–2 of country, department, jobTitle, level, gender, employmentType | `[{ group, count, min, p25, median, p75, max, avg, total, currency }]` |
| `GET /api/insights/distribution` | `buckets` (default 20, max 50) | `{ currency, buckets: [{ from, to, count }] }` |
| `GET /api/insights/gender-gap` | `groupBy` (as above, without gender) | `[{ group, femaleMedian, maleMedian, femaleCount, maleCount, gapPct \| null, currency }]` |

- Percentiles: `percentile_cont` in SQL. Deleted employees excluded.
- Gap % = (male median − female median) ÷ male median × 100. Positive = women paid less.
- `gapPct` is `null` when either gender has fewer than 5 people (UI: "Not enough data").
- Gap rows still return `femaleMedian` / `maleMedian` (`null` if that gender has nobody in the group) and both counts; only `gapPct` is `null`. `gapPct` is rounded to 1 decimal.
- `group` is an object keyed by the `groupBy` names, e.g. `{ "jobTitle": "Software Engineer", "level": "senior" }`. Rows are ordered by the group values (level by seniority).
- Stats avg and percentiles are rounded to whole minor units.
- Distribution buckets are equal-width between the min and max salary of the filtered set, contiguous, in minor units, empty buckets included. Each is `[from, to)`, except the last, which includes `to` (the max). No matching employees → `{ currency: null, buckets: [] }`; all salaries equal → one bucket with `from == to`.
- Gap % has no currency, so it can be compared across countries.
