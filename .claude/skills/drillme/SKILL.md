---
name: drillme
description: Drill the user round by round on a project's design, scope, build plan and commit process, then write the agreed answers into docs/. Use when the user says "drill me", "drillme", or wants their decisions locked down before building.
---

Follow the `mattpocock-skills:grilling` method: build a design tree, ask the whole **frontier** each round (numbered, each with ➡️ a recommended answer, worded so "yes" accepts it), and wait for answers before the next round. Look up facts yourself (read the repo, `design.md`, `assignment.md`). Only decisions go to the user.

Cover these four branches until no question in any of them is left open:

1. **Decisions** – tech stack, architecture, data, security, hosting, trade-offs.
2. **What** – scope, features, what is deliberately left out and why.
3. **How** – build order, test strategy, milestones, definition of done.
4. **Commits** – branching, message format, commit size, how TDD shows in history.

Do not contradict a settled document (e.g. `design.md`) without flagging it as a change.

When the user confirms you share an understanding, write:

- `docs/decisions.md` – one row per decision: chose / over / why / cost / revisit when.
- `docs/requirements.md` – one page: goal, scope, features, out of scope and why.
- `docs/plan.md` – ordered milestones, each small enough for a handful of commits, with tests listed.
- `docs/commit-conventions.md` – the agreed commit rules, with 2–3 example messages.

Keep each doc short. Link to `design.md` instead of copying it.
