# UI design

Status: **built**. Earlier directions are noted in [decisions.md](decisions.md).

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

## Rules

- No stat-card grid with trend badges; figures shown are real and current-filter only.
- Accent only for primary action, selection and the person's point.
- Tables before cards; 1px borders, no shadows, no cut corners, no keycaps.
- Every data region: loading skeleton, empty (what goes here + the action), error (what broke + retry).
- Labels sentence case, untracked; no eyebrows; no decorative dots.
- Charts: shadcn chart components (Recharts), tokens for colour, accessible names, table fallback.

## Motion

Motion shows a state change and nothing else: no entrance stagger on page load, no looping, no parallax. Transform and opacity only, ease-out, never `transition: all`. Durations and the easing are tokens in `tokens.css` (`--dur-micro` 120ms, `--dur-short` 200ms, `--dur-long` 320ms, `--dur-exit` 120ms, `--ease-out`); under `prefers-reduced-motion: reduce` every animation and transition collapses to an instant change, and script-driven numbers (`useTween`) jump to their value.

| Where | What moves |
|---|---|
| Pay band | The person's point slides to its place on first render and glides when the value changes (prev/next). In the change-salary preview the proposed point leaves the current one and follows the typed value; the % counts along |
| After a salary change | The big figure counts old to new; the new history row slides in at the top (only rows that arrive after first paint); the chart line redraws |
| Charts | One short entrance (360ms) when first drawn |
| Dialogs, sheets, menus, popovers | Scale 0.96 to 1 plus fade from the trigger; sheets slide 24px; exits are faster than enters |
| Table | Rows fade in when the data changes; the old rows stay (dimmed) while the next page loads, so nothing jumps; row hover is a colour change |
| Buttons | `scale(0.97)` while pressed |
| Sidebar | Collapse is instant (the shadcn block animates width, which is a layout property) |
