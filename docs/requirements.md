# Requirements

## Goal

ACME's HR team manages salaries for 10,000 employees across 8 countries in Excel. Replace that with a web app where the HR Manager manages salary data and sees how the org pays people.

**Persona:** HR Manager (the only user type).

**Example question:** "What is the median salary of a Software Engineer in India?"

## Features (v1)

| # | Feature | Done when |
|---|---|---|
| 1 | Login / logout | Only seeded HR users can see data; 5 failed logins/min → blocked |
| 2 | Employee list | Search (name, email, code), filter (country, department, job title), sort, paging – under 200 ms |
| 3 | Employee CRUD | Create, view, edit, soft delete; duplicate email → clear error |
| 4 | Salary change | New salary + reason; saved with history (who, when, old, new) in one transaction |
| 5 | Salary history | Per employee, newest first |
| 6 | Concurrent edits | Two HR users editing the same record → second one gets "reload" instead of overwriting |
| 7 | CSV export | Exports the current filtered list |
| 8 | Seed | 10,000 realistic, connected employees; same data every run |
| 9 | Pay insights | Answer "how does the org pay people" – local currency; details in [api.md](api.md) once designed |

## Deliberately not built

See [decisions.md → Deliberately not built](decisions.md#deliberately-not-built): sign-up/SSO, roles, FX conversion, CI, payroll/tax, approvals, bulk import, bonus/equity, cache/queue/LB, observability, browser E2E tests.

## Quality bar

- Salary data never visible without login, never written to logs.
- No salary change is ever half-saved.
- Core logic covered by fast, deterministic tests against a real Postgres.
