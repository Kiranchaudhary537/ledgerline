# How we work

Spec, then a failing test, then the code. Setup is in the [README](README.md#run-locally).

## 1. Spec first

Before code, the change is written down where it belongs:

| Change | Write it in |
|---|---|
| New behaviour or scope | [docs/requirements.md](docs/requirements.md) (a "Done when" line) |
| Endpoint, params, errors | [docs/api.md](docs/api.md), [docs/error-handling.md](docs/error-handling.md) |
| A choice between options | [docs/decisions.md](docs/decisions.md): chose, over, why |
| Screen or component | [docs/ui-design.md](docs/ui-design.md) |

The spec's "Done when" becomes the first test's name.

## 2. Red, green, refactor

```sh
pnpm test:watch --project unit   # shared, services (fake repositories): reruns in milliseconds
pnpm test:watch --project web    # components and hooks (jsdom)
pnpm test:watch --project db     # repositories and routes against real Postgres
pnpm e2e                         # one browser run of the critical path
```

1. **Red:** write the test next to the code (`x.ts` → `x.test.ts`, `x.db.test.ts` for Postgres). Run it and watch it fail for the right reason. Commit: `test(scope): …`.
2. **Green:** the least code that passes. Commit: `feat(scope): …` or `fix(scope): …`.
3. **Refactor** with the tests green. Commit: `refactor(scope): …`.

| Must be red first | Test may land with the code |
|---|---|
| Money, validation, filters, queries, services, auth, `model/` logic in the web app, every bug fix (the test reproduces it) | Layout, styling and motion, where the test checks behaviour (roles, labels, states) after the design settles |

A bug fix always starts with a test that fails on `main`. Example: `test(db): reproduce API crash when Postgres closes an idle connection`, then `fix(db): keep the API alive when Postgres drops pooled connections`.

## 3. Before you push

`pnpm check` (typecheck, lint, format, DB types, every test) must pass. It also enforces a coverage floor (`vitest.config.ts`: lines 93%, branches 86%), so code that lands without tests fails the check. `pnpm test:coverage` writes a browsable report to `coverage/index.html`; raise the floor when coverage grows. CI runs it again with `pnpm build`, `pnpm e2e` and `pnpm bench` on Postgres 17. Commit format: [docs/commit-conventions.md](docs/commit-conventions.md). Code rules: [docs/coding-standards.md](docs/coding-standards.md).

## Reading the code

One feature end to end, the salary change, in the order a request travels:

1. [packages/shared/src/validation/salary-change.ts](packages/shared/src/validation/salary-change.ts): the contract, shared by the form and the API.
2. [apps/api/src/modules/employees/routes.ts](apps/api/src/modules/employees/routes.ts): `POST /api/employees/:id/salary-changes`.
3. [apps/api/src/modules/employees/service.ts](apps/api/src/modules/employees/service.ts): `changeSalary` turns "stale" and "not found" into API errors.
4. [packages/db/src/repositories/employee-repository.ts](packages/db/src/repositories/employee-repository.ts): `changeSalary`, a row lock, the version check, and the history row in one transaction.
5. [apps/web/src/features/employees/forms/components/SalaryChangeForm.tsx](apps/web/src/features/employees/forms/components/SalaryChangeForm.tsx): the form, live pay-band preview and the "reload" banner on a conflict.

Then read the tests for the same feature; they are the spec in code: `describe('changeSalary')` in [employee-repository.db.test.ts](packages/db/src/repositories/employee-repository.db.test.ts) (atomic, stale, simultaneous edits, rollback) and [e2e/smoke.spec.ts](e2e/smoke.spec.ts).

Wiring starts in [apps/api/src/app.ts](apps/api/src/app.ts) (repositories → services → routes). The folder map is [docs/structure.md](docs/structure.md).

## Reading the commit history

`git log --reverse --oneline` reads as the build in order: shared rules, database, API, web, then hardening. Commit types on `main`: 39 `feat`, 36 `test`, 26 `docs`, 19 `refactor`, 17 `chore`, 7 `fix`, 2 `perf`, 1 `ci`, plus merges.

**Two pairs worth opening:**

| Red | Green | Shows |
|---|---|---|
| `edbf299` test(db): specify employee queries, optimistic locking and salary history | `12ea64c` feat(db): add employee queries with optimistic locking and atomic salary changes | A feature: the spec as tests, then the code |
| `f2c6ee2` test(db): reproduce API crash when Postgres closes an idle connection | `b6f76f8` fix(db): keep the API alive when Postgres drops pooled connections | A bug: reproduced on `main` first, then fixed |

**Where the history doesn't follow its own rules:**

| Commits | What | Why |
|---|---|---|
| The first `feat(shared)` constants, and scaffolding | Landed with no failing test first | No behaviour to drive. Test-first starts with money parsing (`955be47`) |
| `421fd87`, `723b13c` → `e841ce1`, `fc1dddc` | API tests and their code were built on parallel worktree branches, then joined by merge commits | Each `test:` still comes before its `feat:` on its branch, but in `main`'s log the pairs are interleaved |
| `e617b8a`, `a065d10` | Whole screens in one large `feat(web)` commit, with their tests | Layout and styling may land with their tests (see the table in section 2). Logic in `model/` was still test-first |

## Share what you learn

When something surprises you (a bug, a slow path, a tool that misbehaves), add it to [docs/lessons.md](docs/lessons.md): what happened, why, and what we do now.
