# How AI was used

Tool: Claude Code. The human made every product and design decision; AI proposed options, wrote code test-first, and checked its own work.

## Workflow

| Phase | How | Artifact |
|---|---|---|
| Requirements & decisions | `drillme` skill (project skill, built on `grilling`): ~50 questions in rounds, each with a recommended answer; the human accepted, changed or rejected each | `requirements.md`, `decisions.md`, `api.md`, `plan.md` |
| Build | Test first (red commit → green commit) per [commit-conventions.md](commit-conventions.md) | git history |
| Parallel work | Lead agent (Claude Opus) writes contracts and shared pieces, then hands well-specified tasks to cheaper agents (Claude Sonnet), each in its own git worktree with its own test database; the lead reviews and merges | branches merged into `main` |
| UI | `frontend-design` skill for the design plan, `dataviz` for charts, Vercel `web-design-guidelines` to audit each screen | `ui-design.md` |

## Where the human changed the AI's proposal

| AI proposed | Human decided |
|---|---|
| MUI component library | shadcn/ui + TanStack Table + Recharts |
| Frontend served by the API | Separate hosting (Vercel) |
| USD conversion with static FX rates | No FX: local currency only |
| GitHub Actions CI | Not built (roll out later) |
| Four gender options | `female`, `male` |
| Insights after v1 | Insights in v1 (after re-reading the assignment) |
| Prisma considered | Kept Kysely, added `kysely-codegen` for generated types |
| `int` ids | `bigint` ids, plus "every route returns 401 without login" test |
| `shared/schemas` | `shared/validation` (clearer vs DB schema) |
| `Co-Authored-By` commit trailers | Removed; AI use documented here instead |

## Where AI corrected itself

- Faker's Japanese locale produces kanji names (bad emails) → own romanized name lists.
- Test-level transaction rollback would break real transactions in services → reset tables + DB test files run serially.
- Postgres error `detail` contains row values (salaries) → 5xx logs keep only type/message/code/stack.
- TypeScript 7 is not yet supported by typescript-eslint → pinned 6.0.

## Example agent brief

Each delegated task got a brief with: files to read first, environment setup (own test DB), exact functions and behaviours, the tests to write first, what not to touch (schema), and the report format. See the commit history of the merged branches for the result.
