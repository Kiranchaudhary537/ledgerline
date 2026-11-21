# Commit conventions

**Format:** `type(scope): what changed` – lowercase, imperative, under 72 chars. Body only to explain *why*.

| Type | Use for |
|---|---|
| `feat` | New behaviour |
| `test` | Tests only (the "red" step) |
| `fix` | Bug fix |
| `refactor` | Same behaviour, cleaner code |
| `docs` | Docs only |
| `chore` | Tooling, config, dependencies |

**Scopes:** `web`, `api`, `db`, `shared`, `docs`.

## Rules

- Commit straight to `main`; one small, working step per commit.
- Core logic shows TDD: a `test:` commit (new test fails) followed by a `feat:` commit (it passes).
- Apart from a `test:` red step, every commit passes typecheck, lint and tests.
- Never commit secrets or `.env`.
- No `Co-Authored-By` AI trailers; how AI was used is documented in `docs/ai-prompts.md`.

## Examples

```
test(shared): add money parsing for zero-decimal currencies
feat(shared): parse and format money in minor units
fix(api): return 409 when salary version is stale
```
