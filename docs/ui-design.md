# UI design

Status: **direction A (Ledger) chosen.** Style tile source: [design/style-tile.html](design/style-tile.html) (open locally in a browser).

## Brief

| | |
|---|---|
| User | HR Manager. Spends the day in spreadsheets. Careful, numerate, cautious about editing pay. |
| Subject | Compensation: salary bands, pay reviews, raises, ledgers. Not "analytics". |
| Job of the app | Find a person fast, change pay safely, answer "how do we pay for this role here?" |
| Feel | A well-kept pay ledger: calm, exact, dense where data is, quiet everywhere else. |

## One job per screen

| Screen | Job | First thing the eye lands on |
|---|---|---|
| Employees | Find someone | The search field and the table |
| Employee | Change pay safely | Current salary, where it sits in its band, and its history |
| Insights | Find who is paid out of line | Needs attention: the people furthest below and above their band |
| Login | Get in | The form |

## The one memorable element: the band rail

HR thinks in **pay bands**: "is this person low, mid or high for their role here?". We draw that everywhere money appears, as one thin horizontal rail:

```
p25 ━━━━━━━●━━━━━ p75        ● = this person (or the median on insights)
     ₹30L     ₹36L    ₹42L
```

- Employee page: the person's salary on the band of their country × title × level.
- Insights table: p25–p75 rail per role with the median tick, aligned across rows so roles compare at a glance.
- Salary change dialog: the rail previews where the *new* salary would land before saving.

Everything else stays quiet so the rail and the numbers carry the page.

## Tokens (two directions for the style tile)

| Token | A – Ledger | B – Review |
|---|---|---|
| Paper (background) | `#F6F7F5` cool grey-white | `#FFFFFF` |
| Ink (text) | `#1E2622` green-black | `#1F2433` blue-black |
| Graphite (secondary text) | `#5B6661` | `#5D6475` |
| Rule (borders) | `#D8DDD9` | `#E3E5EB` |
| Band (rail, primary action) | `#2F6F62` verdigris (banknote green) | `#3A4FA3` ink indigo |
| Alert (conflict, delete) | `#A3312B` | `#B3261E` |
| Type | IBM Plex Sans (tabular figures, slashed zero) | Public Sans (tabular figures) |
| Density | Compact rows (36 px), rules between rows | Comfortable rows (44 px), zebra-free, more air |

Shared rules:
- Type scale (ratio 1.2): 12 / 14 (body, table) / 17 / 20 / 24 / 29. Weights 400 and 600 only.
- Money: right-aligned, `tabular-nums`, local format via `formatMoney` (`₹38,00,000`, `85.000 €`). Currency is never a separate column.
- Radius by hierarchy: 4 px controls, 8 px dialogs/sheets, 0 on the table (it's a ledger, not a card).
- Surfaces are separated by rules and whitespace, not shadows. One shadow only: dialogs/sheets over content.
- Left-aligned everything. Numbers right-aligned in columns.
- Motion only in response to an action (sheet slides in, saved row briefly highlights). Respects `prefers-reduced-motion`.

## Layouts

Top bar, not a sidebar (only two destinations).

```
Employees
┌──────────────────────────────────────────────────────────────────────┐
│ ACME Pay        Employees   Insights                      Priya ▾   │
├──────────────────────────────────────────────────────────────────────┤
│ Employees                                       [Export CSV] [Add]  │
│ [Search name, email or code…      ] Country▾ Department▾ Title▾ Level▾│
│ 10,000 employees                                                    │
│ Code        Name             Title / Level          Country  Salary │
│ ACME-00002  Deepika Chopra   QA Engineer · Mid      India  ₹13,30,000│
│ …                                                                   │
│                                          1–25 of 10,000   ‹  1  ›   │
└──────────────────────────────────────────────────────────────────────┘

Employee
┌──────────────────────────────┬───────────────────────────────────────┐
│ Deepika Chopra               │ Salary                                │
│ QA Engineer, Mid             │ ₹13,30,000 a year      [Change salary]│
│ Engineering · India          │ p25 ━━━━●━━━━━━ p75  (band rail)      │
│ ACME-00002 · Full time       │                                       │
│ Hired 8 Aug 2022             │ History                               │
│ [Edit details]  [Delete]     │ 8 Aug 2025  ₹12,40,000 → ₹13,30,000   │
│                              │             Annual review · Priya     │
│                              │ 8 Aug 2024  …                         │
└──────────────────────────────┴───────────────────────────────────────┘

Insights
│ Pay in [India ▾]   Department▾ Level▾                              │
│ 2,812 people  Median ₹17,90,000  Payroll ₹512 Cr  Avg compa 1.01  4% outside band │
│ Needs attention                                                    │
│ Furthest below band        See all │ Furthest above band  See all │
│ ▼0.62 Asha Rao  QA, Mid   ₹9,00,000│ ▲1.40 Dee Park …              │
│ Pay by role: People  Outside band  Compa spread  ladder  Median range│
│ Gender gap by role (dot plot, zero line, sorted by gap)            │
│ Salary distribution (median line, shaded p25-p75)                  │
│ Countries (click a row to switch the page to it)                   │
```

(`·` above is shorthand in this sketch only; the built UI uses separate lines or columns.)

## Review against the brief (pass 2)

| Draft choice | Generic? | Change |
|---|---|---|
| KPI cards across the top of Insights | Yes – the default dashboard opener | Replaced by one sentence-style line of three numbers above the table |
| Every section in a rounded card with shadow | Yes – SaaS card kit | Rules + whitespace; table has no card |
| Sidebar navigation | Default admin layout | Top bar: there are only two places to go |
| Meta joined with `·` | Template chrome | Separate lines/columns in the build |
| Inter font | Default | IBM Plex Sans / Public Sans with tabular figures |
| Charts as the hero of Insights | Generic analytics | The role table with band rails is the hero; charts support it |

## Anti-slop checklist (every screen, before commit)

- [ ] No identical card grid, no gradient, no decorative shadow.
- [ ] No ALL-CAPS labels, no eyebrow labels above headings, no `·`-joined meta, no `→` in buttons, no emoji.
- [ ] Buttons name the action ("Change salary", "Save changes"); toast repeats it ("Salary changed").
- [ ] Money right-aligned, tabular, local format; no float maths.
- [ ] Loading = skeleton of the real layout; empty state says what to do next; errors use shared messages.
- [ ] Keyboard: every action reachable, focus visible, dialogs trap focus, Esc closes.
- [ ] Charts follow the `dataviz` skill.
- [ ] `web-design-guidelines` audit run; findings fixed or noted.
- [ ] Removed one unneeded element.

## Compa-ratio (in v1)

Salary ÷ median of the same country × job title × level × employment type (e.g. `0.94` = 6% below the middle). Shown as a column in the employee list and on the employee page next to the band rail. It has no currency, so it **can be sorted across countries**. Colour only marks the extremes (< 0.85, > 1.15); the number is always shown.

## Insights page (v2)

Focal point: **Needs attention**, the five people furthest below and above their band (`GET /api/employees?sort=compaRatio:asc|desc&pageSize=5`, only those outside 0.85 to 1.15), with the compa-ratio as the large figure. The scorecard above it is one quiet sentence; only "% outside their band" is bold. Pay by role keeps the shared-scale ladder and adds people outside band and compa spread (the widest level's p75 minus p25, flagged quietly above `compaRatio.maxReviewSpread`). Gender gap is a dot plot (one hue, direction in words, "Not enough data" rows have no dot, table behind "View as table"). The histogram shows the median line and the p25 to p75 shading.
