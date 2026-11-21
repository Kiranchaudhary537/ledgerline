# UI design

Status: **direction "Desk" chosen** (replaces the earlier Ledger direction). Visual reference: an HR app employee-detail screen (dark top bar, left icon rail, white cards, dot pills, segment bar); adapted, not copied.

## Brief

| | |
|---|---|
| User | HR Manager. Spends the day in spreadsheets. Careful, numerate, cautious about editing pay. |
| Subject | Compensation: salary bands, pay reviews, raises. Not "analytics". |
| Job of the app | Find a person fast, change pay safely, answer "how do we pay for this role here?" |
| Feel | A calm desk: near-black frame, light canvas, white cards, one green, one yellow. Dense where data is, quiet everywhere else. |

## One job per screen

| Screen | Job | First thing the eye lands on |
|---|---|---|
| Employees | Find someone | The search field and the table |
| Employee | Change pay safely | Annual salary, where it sits in its band, the "Change salary" button |
| Insights | Answer "where is pay out of line?" | The country summary, then the pay ladder per role |
| Login | Get in | The form |

## Shell

- **Top bar** (near-black ink, white text): "ACME Pay", breadcrumb (`Employees / Sandeep Singh`), a round yellow "+" (Add employee), user menu (email, Log out).
- **Left rail** (72 px, white): icon above a small label for Employees and Insights. The active item is a soft green tinted square.
- Canvas is light cool grey. Content sits in **cards**: white, 12 px radius, 1 px soft border, one very light shadow.
- Page width max 1280 px. Dialogs and the add/edit sheet are the only things with a larger shadow.

## Memorable elements

1. **Segment bar** on the bottom edge of the salary card and the insights summary card: Min to P25 to Median to P75 to Max as four coloured segments sized by the range they cover, with the person's position as a tick. The same numbers are always written next to it as labelled dots (Min, P25, Median, P75, Max); the bar is decorative.
2. **Dot pills** for categories (department, level, salary-change reason): neutral pill, coloured dot. Colour comes from one six-colour category palette, assigned deterministically (`lib/tone.ts`), so the same department is always the same colour. Avatars use the same palette as a soft tint behind initials.
3. The **band rail** (p25 to p75 segment, median tick, dots) stays where a precise scale matters: the salary dialog (preview of the new salary) and the expanded levels on Insights.

## Tokens

All in `apps/web/src/index.css`, as CSS variables, light and dark. No literal colours in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--ink` / `--ink-foreground` | `#101317` / `#f4f6f9` | `#0a0c0f` / `#f1f4f8` | top bar |
| `--background` (canvas) | `#f2f4f8` | `#0f1216` | page |
| `--card` | `#ffffff` | `#171b21` | cards, menus, dialogs |
| `--border` | `#e3e7ee` | `#272d36` | card edge, row rules |
| `--muted` | `#f1f3f7` | `#1d222a` | table header row, hover, pills |
| `--foreground` / `--muted-foreground` / `--subtle` | `#15181d` / `#545e6b` / `#6b7482` | `#e9edf2` / `#a0a9b6` / `#8a94a2` | text levels 1 to 3 (subtle: placeholders, empty cells) |
| `--primary` / `--primary-soft` | `#1d5a41` / `#e3f0e9` | `#46b184` / `#1b2f27` | main action (dark green), active nav, selected count |
| `--accent` | `#f6c445` | `#f0c040` | the "+" button only |
| `--success` / `--success-soft` | `#17724a` / `#def3e7` | `#5fcf95` / `#173226` | "Active" status pill |
| `--destructive` | `#b3261e` | `#f0847c` | delete, conflict, field errors |
| `--cat-1` … `--cat-6` | green, blue, amber, violet, rose, teal | lighter variants | dots, avatars, segment bar |

- Type: IBM Plex Sans 400 and 600 (self-hosted, `@fontsource`), tabular figures via `.tnum` / `Table`. Scale 12 / 14 (body) / 17 / 20 / 24 / 29.
- Money: right-aligned in tables, tabular, local format via `formatMoney`; currency is never a separate column.
- Radius: 8 px controls, 10 px menus, 12 px cards and dialogs, full for pills, avatars and round icon buttons.
- Motion only in response to an action; respects `prefers-reduced-motion`.

## Layouts

```
Employees
┌ ACME Pay   Employees                                     (+)  HR Manager ┐ ink
├────┬────────────────────────────────────────────────────────────────────┤
│ ◻  │ Employees                                   [Export CSV] [Add employee]
│Emp │ 10,000 employees                                                  │
│    │ ┌ card ────────────────────────────────────────────────────────┐  │
│ ▥  │ │ [Search…]  Country▾ Department▾ Job title▾ Level▾ More filters│  │
│Ins │ │ Code  Name↑  Department  Job title  Level  Country   Salary ⇅  ⋯│  │
│    │ │ …rows (initials avatar, dot pills)…                          │  │
│    │ │ 1–25 of 10,000                       ‹ Previous  Page 1  Next ›│  │
│    │ └──────────────────────────────────────────────────────────────┘  │

Employee
│ ┌ card ─────────────────────────────────────────────────────────────┐ │
│ │ ‹ (VS) Varun Sharma │ Code │ Department │ Country │ Hire date   ‹ 28 of 2,818 ›  ⋯  [Change salary]│
│ │      ● Active       │                                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│  Profile   Salary   History      (tabs, underlined, icons)             │
│ ┌ Salary ──────────────────────────────────────────────────────────┐  │
│ │ Annual salary  ₹37,70,000                                         │  │
│ │ ● Min  ● P25  ● Median  ● P75  ● Max   (values)                   │  │
│ │▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▌│  │

Insights
│ [Pay in India ▾] Department▾ Level▾            (toolbar card)          │
│ Summary card: payroll, ● People ● P25 ● Median ● P75, segment bar      │
│ Pay by role (ladder per role, expandable levels)                       │
│ Salary distribution (histogram, median line, shaded p25 to p75)        │
│ Gender gap by role (dot plot, table behind "View as table")            │
│ Countries (click a row to switch the page to it)                       │
```

## Filter menus

Open-ended lists (Country, Department, Job title) always have a search box at the top of the menu: focused on open, case-insensitive, arrow keys move through the results, Enter toggles, Esc closes, "No matches" when empty. Short fixed lists (Level, Employment type, Gender) do not. Counts come from the facets endpoint.

## Interaction rules

- Employee list row link and the detail pager keep the list's filters, sort and page in the URL; "3 of 2,818" is the position within that list query.
- The detail tab is in the URL (`?tab=history`).
- Row menu (⋯): View, Edit, Change salary, Delete. Detail menu: Edit details, Delete. Delete always asks first.

## Anti-slop checklist (every screen, before commit)

- [ ] No gradient, no decorative shadow; cards are the only surface that carries the light shadow.
- [ ] No ALL-CAPS labels, no eyebrow labels above headings, no `→` in buttons, no emoji.
- [ ] Buttons name the action ("Change salary", "Save changes"); toast repeats it ("Salary changed").
- [ ] Money right-aligned, tabular, local format; no float maths.
- [ ] Loading = skeleton of the real layout; empty state says what to do next; errors use shared messages.
- [ ] Keyboard: every action reachable, focus visible, dialogs trap focus, Esc closes.
- [ ] Colour never carries meaning alone (pills have text, the segment bar has the numbers beside it).
- [ ] Charts follow the `dataviz` skill.
- [ ] `web-design-guidelines` audit run; findings fixed or noted.
- [ ] Removed one unneeded element.

## Insights

Cards, one per question: summary (headcount, quarters, payroll), pay by role (shared-scale ladder of level medians, expand for band rails), distribution (median line, p25 to p75 shading), gender gap (dot plot with direction in words, "Not enough data" rows have no dot), countries. Compa-ratio is not part of the product.
