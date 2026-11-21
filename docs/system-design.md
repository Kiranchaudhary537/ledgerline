ACME Salary Management — System Design
Status	Phase 1 approved for build · Phase 2 designed, not built
Persona	HR Manager
Diagrams	docs/images/board.png (full board) · docs/images/request-flow.png (Phase 1) · docs/images/phase1-phase2.png (both phases)
1. Problem statement

ACME's HR team manages salaries for 10,000 employees across many countries in Excel sheets. This is slow and error-prone, keeps no history of changes, and makes it hard to answer "how do we pay people?".

We are building a web app for the HR Manager to manage employee salary data and see pay insights in one place.

Example question it must answer: "What is the median salary of a Software Engineer in India, and how does it compare with Germany?"

2. Requirements
2.1 Functional requirements

Core (top 3):

Add, view, edit and remove employees and their salaries.
Search, filter and sort 10,000 employees quickly.
See pay insights by country and by job title: min, max, average, median, distribution, and a USD comparison across countries.

Secondary:

Salary change history (who changed it, when, old and new values, and the reason).
CSV export of the filtered list.
Login for HR users.
2.2 Non-functional requirements

Different operations need different guarantees:

Operation	Priority	Why	How (Phase 1)
Salary update and its history	Consistency	A lost or half-saved salary change is a real error	One Postgres transaction plus an optimistic version check
Create, edit or delete employee	Consistency	Duplicates or overwrites corrupt data	Unique constraints plus a version check
List, search, insights	Availability	Being a few seconds stale is harmless; being down is not	Same database in Phase 1; replica and cache in Phase 2

Targets:

List and search: p95 under 200 ms. Insights: p95 under 300 ms.
About 99.5% uptime in business hours. Short restarts are acceptable for an internal tool in Phase 1.
No salary change is ever lost (managed backups and point-in-time recovery).
Salary data is never visible without login and never written to logs.
Login is protected from brute force with rate limiting.
2.3 Capacity estimate (why a simple design is enough)
Metric	Estimate	Conclusion
Users	~10 HR users	—
Peak traffic	~5 requests/second	One server handles this with huge headroom
Data	10k employees × ~300 B ≈ 3 MB (history a few MB more)	Fits in memory; aggregations take milliseconds

→ One API server and one PostgreSQL database are enough for Phase 1.

3. Scope
Built	Deliberately not built	Why not
Employee CRUD (soft delete)	Payroll, tax, payslips	A separate domain with its own regulations
Search, filter, sort, pagination	Approval workflow	The persona edits directly
Salary update with reason and history	Employee self-service / RBAC	Single persona for now
Insights (per country, per job title, distribution, USD)	Bulk Excel import	Error reporting is its own project; the seed script stands in
CSV export	Live FX rates	External dependency and non-deterministic tests; static, labelled rates instead
Login with rate limiting	Bonus and equity	Base salary answers the core question
Seed script: 10,000 employees	Observability stack	Logs are enough at 10 users (moves to Phase 2)
Unit and integration tests		
4. Design principles
Simplest design that meets the requirements. Every component traces back to a requirement.
Fewer moving parts means fewer failure points. Phase 1 has 3 runtime parts: browser, API server, PostgreSQL.
Test-first (red → green → refactor), with small, incremental commits.
Clean seams, so Phase 2 adds infrastructure without rewriting code.
5. High-level design (Phase 1)
5.1 Components
 ┌───────────────────┐   HTTPS    ┌──────────────────────────────┐    SQL     ┌─────────────────────┐
 │ Client (React SPA)│ ─────────► │ API server (1 instance)      │ ─────────► │ PostgreSQL (managed)│
 │ HR Manager        │ ◄───────── │ rate limit → auth → validate │ ◄───────── │ daily backups + PITR│
 └───────────────────┘   JSON     │ → service → repository       │   rows     └─────────────────────┘
                                  └──────────────────────────────┘                     ▲
                                                                    Seed script ───────┘ (10k employees)
5.2 How a request flows through the server

Every request passes through the same steps in order. The first failure returns immediately.

request ─► [1 Rate limit] ─► [2 Auth] ─► [3 Validate] ─► [4 Service] ─► [5 Repository] ─► PostgreSQL
               │                │             │               │
               ▼                ▼             ▼               ▼
         429 + Retry-After     401      400 field errors   404 / 409
Step	What it does	Fails with
1. Rate limit	In-memory token bucket. Login: 5 attempts/min per IP + email. API: 300 requests/min per user.	429 + Retry-After
2. Auth	Reads the session cookie, loads the session, and attaches the user. Skipped on /auth/login.	401 Unauthorized
3. Validate	Schema check on params and body: types, required fields, ranges (salary > 0, known country, valid email, pageSize ≤ 100).	400 with field errors
4. Service	Business rules: password check, unique email, version check, history, insights math, USD conversion.	404 not found · 409 duplicate or version conflict
5. Repository	The only place with SQL. Queries are parameterized, and every write runs in one transaction.	503 if the database is unavailable
Response	JSON back to the client; one log line per request (method, path, status, ms — never salary).	—
5.3 Worked example: a salary change

PATCH /employees/42 {salaryMinor: 9500000, reason: "promotion", version: 3}

#	Step	What happens	Else
1	Rate limit	12 of 300 requests this minute → pass	429
2	Auth	cookie → session → user Priya (HR) → pass	401
3	Validate	salary > 0 · reason present · version is an integer → pass	400
4	Service	employee 42 exists · version 3 matches → pass	404 / 409
5	Repository	BEGIN · INSERT salary_changes · UPDATE employees SET version = 4 · COMMIT	rollback, 503
6	Response	200 {employee, version: 4} → the UI shows the new salary and history row	—
5.4 Which request touches which table
#	Request	Carries	Success response	Database work
1	POST /auth/login	{email, password}	200 + session cookie	read users, insert sessions
2	GET /employees?q&country&dept&sort&page	query params	200 {data[], page, pageSize, total}	indexed SELECT employees
3	POST /employees	{fullName, email, jobTitle, department, countryCode, salaryMinor, hireDate}	201 {employee}	INSERT employees
4	PATCH /employees/{id}	{salaryMinor, reason, version}	200 {employee}	one transaction: UPDATE employees + INSERT salary_changes
5	GET /insights/countries	—	200 [{country, headcount, min, max, avg, median, avgUsd}]	GROUP BY country on employees joined with currencies
6. Data model
users (id, email UNIQUE, password_hash, name)
sessions (id, user_id FK, expires_at)
countries (code PK, name, currency_code FK)
currencies (code PK, minor_unit, usd_rate, rate_as_of)
employees (id, employee_code UNIQUE, full_name, email UNIQUE, job_title, department,
           country_code FK, salary_minor INTEGER, employment_type, hire_date,
           version, created_at, updated_at, deleted_at)
salary_changes (id, employee_id FK, old_salary_minor, new_salary_minor,
                reason, changed_by FK → users, changed_at)          -- append-only

Rules built into the schema:

Money is stored as an integer in minor units, using each currency's minor_unit (2 for INR and USD, 0 for JPY), so there are no rounding errors.
Currency comes from the country, never from user input, so mismatches are impossible.
Soft delete (deleted_at) keeps records and history; lists and insights exclude deleted rows.
version gives optimistic locking: concurrent edits get a 409 instead of silently overwriting each other.
Indexes: employees(country_code, job_title), employees(department), employees(full_name), employees(email), salary_changes(employee_id, changed_at DESC).
Median is computed with percentile_cont(0.5) in SQL.

Board note: the sessions table should be added to panel 4.

7. API

Conventions:

Every request needs a session cookie (else 401) and is rate-limited (else 429).
Errors use the format {code, message, fields}.
Money is returned as {amountMinor, currency}.
Method	Path	Purpose	Errors
POST	/api/auth/login	Start a session	400, 401, 429
POST	/api/auth/logout	End the session	401
GET	/api/employees	List, search, filter, sort	400
GET	/api/employees/{id}	Employee detail	404
POST	/api/employees	Create	400, 409
PATCH	/api/employees/{id}	Update (a salary change needs reason; version is always required)	400, 404, 409
DELETE	/api/employees/{id}	Soft delete	404
GET	/api/employees/{id}/salary-history	Change history	404
GET	/api/employees/export.csv	CSV of the current filter	400
GET	/api/insights/countries	Per-country stats (local currency and USD)	—
GET	/api/insights/job-titles?country=	Per-job-title stats within a country	400
GET	/api/insights/distribution?country=&buckets=	Salary histogram	400
GET	/api/meta/filters	Countries, departments, job titles	—
GET	/api/health	Liveness and database check	503
8. Key decisions and trade-offs
Chose	Over	Why	Cost	Revisit when
PostgreSQL	MongoDB (NoSQL)	The data is relational; salary and history need an ACID transaction; insights need GROUP BY and percentile_cont; constraints catch bad data	Schema migrations for every change	Unlikely
Modular monolith	Microservices	One domain, one team, ~5 req/s: one deploy and no network hops	Parts can't scale independently	Several teams
No Redis (compute on request)	Cache layer	SQL aggregates on 10k rows take milliseconds; results are always fresh, with no stale-cache bugs	Insights are recomputed on every call	Insights p95 over 300 ms (Phase 2)
No queue (synchronous)	Job queue	Nothing long-running; a 10k-row CSV streams in under 1 s	Large exports would block requests	Bulk import or big exports (Phase 2)
No load balancer (1 instance)	LB plus N instances	~5 req/s; short restarts are acceptable for an internal tool	Downtime on a crash or deploy	Uptime SLA or more users (Phase 2)
Rate limiting in the app (in-memory)	None; a Redis limiter	The login endpoint is public and the data is sensitive. One instance means in-memory counters are correct	Counters reset on restart and are per-server	2+ servers (move to the LB)
Basic request logs only	Full observability stack	Enough to debug 10 users on one server	No dashboards or alerts	Production at scale (Phase 2)
Integer money, currency from country	Floating-point amounts	No rounding errors and no currency mismatch	Expats paid in a foreign currency are not supported	Expat pay is needed
Server-side sessions in Postgres	JWT in localStorage	httpOnly cookies are safe from XSS; sessions can be revoked on logout; the API stays stateless	One database read per request (trivial at 5 req/s)	Phase 2 moves sessions to Redis
REST	GraphQL	A small, fixed set of screens	Some over-fetching	Many different clients
9. Edge cases
Case	Handling
Concurrency	Two HR users edit the same employee → the version check returns 409 Conflict and the UI asks the user to reload.
Validation	Salary ≤ 0, an unknown country or a bad email → 400 with field-level errors.
Duplicate request	A double-clicked "Create" hits the UNIQUE email / employee_code constraint → 409; the submit button is disabled while saving.
Partial failure	Salary update and history are in one transaction → both are saved or neither.
Permissions	No session → 401 on every API; passwords are hashed; salaries are never logged.
Brute force / abuse	Login limited to 5 attempts/min → 429 + Retry-After.
Missing or deleted	An unknown or soft-deleted employee → 404; deleted rows are excluded from insights.
Limits	pageSize is capped at 100; sorting is allowed only on listed columns.
Database unavailable	Health check fails, the API returns 503, and no partial writes happen.
10. Code structure
backend/
  src/
    api/           rate limit · auth · validation · routes · error → HTTP mapping
    services/      business rules, transactions
    repositories/  SQL only
    domain/        Money, stats, FX — pure functions, no framework
  migrations/
  seed/            deterministic seed (fixed RNG seed), 10k employees
  tests/
    unit/          pure logic, no database (fast)
    integration/   API + real Postgres in a container, rollback per test
frontend/
  src/ pages/ components/ api/ hooks/
docs/
  system-design.md  requirements.md  ai-prompts.md  images/
Dependency rule: api → services → repositories, never backwards. domain depends on nothing.
Test pyramid: many fast unit tests, some integration tests on real Postgres, and a few UI tests.
11. Limitations and what breaks first
#	Limitation now	Breaks when	What users see	Phase 2 fix
L1	Single app instance	Deploy, crash, ~50k users	Downtime, timeouts, 5xx errors	LB + 2+ stateless API servers
L2	One Postgres, no replica	Database failure; reads competing with writes	Full outage; slow saves	Managed failover, read replica, PITR
L3	Insights computed per request	Many people viewing insights at once	Insights over 300 ms; database CPU spikes	Redis cache (cache-aside) + replica
L4	Synchronous export, no import	50k+ row exports; bulk changes	Request timeouts	Job queue + worker
L5	One role, local login	Managers and employees join	No safe way to limit who sees what	SSO + RBAC + row-level security
L6	Offset pagination	Very large tables, deep pages	Later pages are slow	Keyset (cursor) pagination
L7	Basic logs only	Production at scale	Users find problems before we do	OpenTelemetry: metrics, traces, alerts
L8	In-memory rate limiter	2+ app servers	The limit counts per server, not overall	Rate limiting at the LB
12. Phase 2 (50k users: HR, managers, employees)
12.1 Architecture
   HR managers      Managers       Employees
        └──────────────┼──────────────┘
                       ▼
          ┌──────────────────────────┐
          │ Load balancer            │  TLS · health checks · rate limit   (L1, L8)
          └────────────┬─────────────┘
              ┌────────┴────────┐
              ▼                 ▼
       ┌─────────────┐   ┌─────────────┐
       │ API server 1│   │ API server 2│  stateless, same code              (L1)
       └──┬───────┬──┘   └──┬───────┬──┘
          │       └────┬────┘       │
          │            ▼            │
          │   ┌──────────────────┐  │
          │   │ Redis cache      │  │  insights · filter lists · sessions (L3)
          │   └────────┬─────────┘  │
          │ writes     │ on miss    │
          ▼            ▼            │
   ┌──────────────┐  async  ┌──────────────┐
   │ PG primary   │ ──────► │ Read replica │                                (L2, L3)
   │ writes, PITR │         └──────────────┘
   └──────────────┘
   ┌──────────────┐  polls  ┌──────────────┐
   │ Job queue    │ ◄────── │ Worker       │  import · export · reports     (L4)
   │ (PG table)   │         └──────────────┘
   └──────────────┘
   All components → OpenTelemetry collector → metrics · traces · logs → dashboards + alerts  (L7)

Read path: check the cache → on a miss, read from the replica → fill the cache.
Write path: write to the primary → invalidate the affected cache keys.

12.2 Phase 2 decisions
Decision	Alternative	Why	Trade-off	Fixes
LB + 2 stateless API servers	One bigger server	Survives a crash or deploy; health checks remove a dead server	No in-memory state, so sessions move to Redis	L1
Rate limiting at the LB	Per-server memory	One shared limit across all servers	Coarser; the per-user login lockout stays in the app	L8
Redis cache, cache-aside, for insights, filter lists and sessions	Always query the database	Read-heavy and rarely changing; protects the database and keeps p95 under 300 ms	Stale data for at most the TTL (minutes); every write deletes the affected keys; individual salaries are never cached	L3
Postgres primary + read replica	Sharding; MongoDB	50k rows is still small; the replica serves cache misses and lists	Replication lag; the save response returns the updated record	L2
Writes always go to the primary, never through the cache	Write-through cache	Consistency first for writes	Each write must invalidate its cache keys	L2, L3
Job queue as a Postgres table (FOR UPDATE SKIP LOCKED) + worker	RabbitMQ, Kafka	Low volume; a job is enqueued in the same transaction as its data; no new broker	Not built for high throughput	L4
OpenTelemetry → metrics, traces, logs → dashboards + alerts	Logs only	With many components, you need to see where time goes. Alert on p95, 5xx rate, cache hit rate, replica lag and queue depth	More components or a managed service cost	L7

Still not used in Phase 2:

Microservices (one domain, one team).
Kafka (the jobs table is enough).
Kubernetes (a managed platform scales 2–N instances).
Sharding (50k rows fits one primary).

Phase 1 vs Phase 2:

Phase 1 is built for correctness with fewer failure points.
Phase 2 is built for growth and fault tolerance.
The code layers are the same in both; Phase 2 adds infrastructure, not a rewrite.
13. Open items
Backend language and framework: depends on the role applied for; to be added as a decision row in §8.
Hosting choice: needs managed PostgreSQL with backups.