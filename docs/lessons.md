# Lessons

Things that surprised us while building this, so the next person doesn't learn them the hard way. Each one: what happened, why, and what we do now.

## A Postgres restart crashed the API

- **What:** stopping Postgres killed the Node process with `terminating connection due to administrator command`.
- **Why:** `pg.Pool` emits `'error'` when an idle connection dies. An `'error'` event with no listener crashes Node.
- **Now:** `createDb` always attaches a pool error handler. A DB test ends a backend with `pg_terminate_backend` and checks the next query still works ([client.db.test.ts](../packages/db/src/client.db.test.ts)).

## Postgres errors can leak salaries into logs

- **What:** a constraint error's `detail` field quotes the failing row's values, salary included.
- **Why:** Postgres is helpful by design: `Key (...)=(...)` shows the data.
- **Now:** 5xx logs keep only type, message, code and stack ([errors.ts](../apps/api/src/errors.ts)).

## Rolling back each test broke real transactions

- **What:** wrapping each DB test in a transaction and rolling it back made service code that opens its own transaction behave differently in tests than in production.
- **Why:** nested transactions are not real transactions; the code under test never committed.
- **Now:** tables are reset before each test and DB test files run one at a time. Slower by a second, but tests see real commits.

## Where the server lives matters more than the code

- **What:** every request from India took at least ~300 ms, even when the server worked for 2 ms.
- **Why:** the free host was in Oregon. Network round trips dominated.
- **Now:** the API and DB run in Singapore (~135 ms floor). Every response carries `Server-Timing: app;dur=…`, so we measure our time apart from the network before optimising anything.

## `Server-Timing` lies about streams

- **What:** the 10k-row CSV export reported 2 ms of server time and took over a second.
- **Why:** headers are sent before the body, so the header can only measure time to the first byte.
- **Now:** streamed endpoints are measured end to end by the client, not by the header ([api.md](api.md#csv-export)).

## Strong password hashing is slow on a small CPU

- **What:** login takes ~3 s in production and ~0.4 s locally.
- **Why:** scrypt at the OWASP cost is deliberately CPU-heavy, and the free host has 0.1 vCPU.
- **Now:** kept on purpose: it runs once per 8-hour session. More CPU fixes it; weaker hashing does not.

## Two-letter search skips the index

- **What:** searching "an" was ~10× slower than searching "sharma".
- **Why:** a `pg_trgm` index works on three-letter pieces. Two letters match too many rows for it to help, so Postgres scans.
- **Now:** fast enough at 10k rows (p95 ~14 ms in CI, see `pnpm bench`). At more rows, start search at three characters.

## Code-split pages made tests flaky

- **What:** after lazy-loading the chart pages, one test started timing out.
- **Why:** the first dynamic `import()` in jsdom transforms the module, which took longer than `findBy`'s 1 s default.
- **Now:** the test helper loads the lazy pages once up front ([render-app.tsx](../apps/web/src/test/render-app.tsx)), so tests wait on the app, not on the bundler.

## A pipe hid a failing test run

- **What:** a commit was pushed with failing tests.
- **Why:** `pnpm check | grep …` returns grep's exit code, not the test run's.
- **Now:** commit only after `pnpm check` succeeds on its own (`pnpm check && git commit …`), and CI runs the same check on every push.

## Hosted URLs are not yours until you check

- **What:** the web app's API rewrite pointed at `ledgerline-api.onrender.com`, which belonged to another account.
- **Why:** the host adds a random suffix when a name is taken; we guessed the URL.
- **Now:** `pnpm ship` waits until `/api/health` reports the commit we just pushed, so a wrong target fails the deploy.
