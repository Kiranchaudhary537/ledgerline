# Requirements

Written before building. The design is in [system-design.md](system-design.md).

## Goal

ACME's HR team manages salaries for 10,000 employees across several countries in Excel. Replace that with a web app where the HR Manager manages salary data and sees how the org pays people.

- **Persona:** HR Manager (the only user type)
- **Example question:** "What is the median salary of a Software Engineer in India?"

## Scope and features (v1)

| # | Feature | Done when |
|---|---|---|
| 1 | Login / logout | Only seeded HR users see data; a sixth failed login within a minute is blocked |
| 2 | Employee list | Search (name, email, code), filter (country, department, job title, level…), sort, paging, in under 200 ms |
| 3 | Employee CRUD | Create, view, edit, soft delete; a duplicate email gets a clear error |
| 4 | Salary change | New salary + reason, saved together with its history (who, when, old, new) in one transaction |
| 5 | Salary history | Per employee, newest first |
| 6 | Concurrent edits | If two HR users edit the same record, the second is told to reload instead of overwriting |
| 7 | CSV export | Exports the current filtered list |
| 8 | Seed | 10,000 realistic, connected employees; the same data on every run |
| 9 | Pay insights | Median, range, distribution and gender gap by country, role and level, in local currency |

## Quality bar

- Salary data is never visible without login and never written to logs.
- A salary change is never half-saved.
- Core logic is covered by fast, deterministic tests against a real Postgres.

## Deliberately left out

| What | Why |
|---|---|
| Sign-up, password reset, SSO | HR users are provisioned; one persona |
| Roles / permissions | One persona; designed for later in [system-design.md](system-design.md#scaling-later-designed-not-built) |
| FX / USD conversion | Needs a trusted rate source; mixing currencies would mislead. Insights compare within one country |
| Payroll, tax, payslips | A separate domain with its own regulations |
| Approval workflow | The HR Manager edits directly |
| Bulk Excel import | Error reporting makes it its own project; the seed stands in |
| Bonus, equity | Base salary answers the core question |
| Cache, queue, load balancer | 10k rows at ~5 req/s don't need them |
| Mobile layout | HR works on desktop |
| Browser E2E tests | Unit and API tests against a real DB cover the logic at lower cost |

All decisions, with alternatives: [decisions.md](decisions.md).
