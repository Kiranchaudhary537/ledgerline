# API

Errors: see [error-handling.md](error-handling.md). All routes need a session except login.

## `GET /api/employees` – list filters

Schema: `packages/shared/src/schemas/list-query.ts`

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

To be designed (in v1).
