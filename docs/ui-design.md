# UI design

Status: **agreed, not built yet** (replaces the Cobalt direction). History of earlier directions: [design/style-tile.html](design/style-tile.html) and `docs/decisions.md`.

## Brief

| | |
|---|---|
| User | HR manager, all day in the tool, careful with pay |
| Jobs | Find a person · change pay safely · answer "what do we pay for this role here?" |
| Tone | Clean and modern, warm and human: people first, exact money, quiet surfaces |
| Base | shadcn **dashboard** block (collapsible sidebar, site header, content), adapted below |
| Edges | Sharp everywhere: `--radius: 0` |
| Theme | Light only |

## Signature: the pay band

One component, used everywhere money is judged: the band as a real range (min to max), the middle half (p25 to p75) shaded, the median as a tick, **the person as a labelled point** in the accent colour. Big on the person page, compact on Insights rows, live preview in the change-salary form. It replaces the ramp bar, cut corners and keycaps.

## Tokens (light only)

| Token | Value | Use |
|---|---|---|
| `--background` | `#FAFAF9` | page (warm off-white, not cream) |
| `--card` | `#FFFFFF` | panels |
| `--foreground` | `#1C1917` | text |
| `--muted-foreground` | `#6B6560` | secondary text |
| `--border` | `#E7E3DF` | 1px rules and panel borders; no shadows |
| `--primary` | `#1F5E4A` | ink-green: primary action, current selection, the person's point |
| `--band` / `--band-soft` | `#1F5E4A` / `#DCEAE3` | band median tick / middle-half shading |
| `--destructive` | `#9F2D20` | delete, errors |
| chart series | ink-green, warm grey, one muted clay | charts only, max 3 hues |

Type: IBM Plex Sans (already installed, tabular figures) for everything; weight and size carry hierarchy (400/500/600). No serif, no mono except employee codes.

## Screens

| Screen | Leads with | Then |
|---|---|---|
| **Employees** | Data table: name, role, level, country, **salary** (right, tabular) | Faceted filters with counts + search (keep), row menu, pagination. No avatars; level as plain text; one chip at most per row. |
| **Person** (one page, no tabs) | Name, role, level, country, tenure · salary big + **pay band** + "Change salary" inline | Salary over time (line/step chart from history) · history timeline (who, when, why) · profile fields. Prev/next stays in the header. |
| **Insights** | "What do we pay for **[role]** **[level]** in **[country]**?" inline pickers → the band answer | Pay by level per role (range chart) · distribution (histogram) · gender gap (dot/bar per role) · countries table |

## Rules (from Hallmark, app scope)

- No stat-card grid with trend badges; figures shown are real and current-filter only.
- Accent only for primary action, selection and the person's point.
- Tables before cards; 1px borders, no shadows, no cut corners, no keycaps.
- Every data region: loading skeleton, empty (what goes here + the action), error (what broke + retry).
- Labels sentence case, untracked; no eyebrows; no decorative dots.
- Charts: shadcn chart components (Recharts), tokens for colour, accessible names, table fallback.
