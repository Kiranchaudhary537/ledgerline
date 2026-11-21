# API

Errors: see [error-handling.md](error-handling.md). All routes need a session except login.

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
| `sort` | `field:asc\|desc` | name, hireDate, level; `salary` only when exactly one country |
| `page` | int | ≥ 1, default 1 |
| `pageSize` | int | default 25, max 100 |

- Different filters → AND. Values inside one filter → OR.
- Deleted employees never returned.
- Response: `{ data: Employee[], page, pageSize, total }`.

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
- Gap % has no currency, so it can be compared across countries.
