# UI design

Status: **Hallmark "Cobalt" applied to the "Desk" layout** (redesign of `apps/web`, app scope). The layout, routes and behaviour are the owner's choice from a reference HR app and are unchanged; only the visual system was replaced.

## Brief

| | |
|---|---|
| User | HR Manager. Works in the tool all day. Careful, numerate, cautious about editing pay. |
| Subject | Compensation: salary bands, pay reviews, raises, for 10,000 seeded employees in 8 countries. |
| Job of the app | Find a person fast, change pay safely, answer "how do we pay for this role here?" |
| Tone | Utilitarian, exact, calm. Dense where data is, quiet everywhere else. |

## Picks (Hallmark)

- **Redesign**: full, `apps/web`, app screens (`--scope app`), genre modern-minimal.
- **Theme**: Cobalt, dealt 3/3, seed `internal-compensation-tool-manager-a805·acb59c1e·2026-11-21·r0`. Why: calm and data-dense; Familjen Grotesk over IBM Plex Sans with tabular figures; one cobalt signal; cut-corner panels and keycap controls. The theme's ASCII-field hero is a landing-page device and is not used.
- **Screen**: Desk shell (graphite top bar with breadcrumb and a keycap add action, narrow paper-2 icon rail), cut-corner panels, tables before cards.
- **Signature**: the pay band, a five-step cobalt lightness ramp (min to max) with the person's tick, the same scale on the salary tab, the Insights summary and the ladders.
- **States**: loading (skeleton), empty, error, full, for every region that loads data.
- **Posture**: restrained. Cobalt marks the primary key, the selection and the one data series; under 5% of any screen.

## Tokens

Source of truth: `apps/web/src/tokens.css` (a static Tailwind v4 `@theme` block, so each token is a utility such as `bg-paper`, `text-ink`, `font-display`). No literal colours in components.

| Token | Light | Use |
|---|---|---|
| `paper`, `paper-2`, `paper-3` | L 98.6, 96.2, 93 (hue 250) | canvas and panels, wells (table head, rail), skeletons and avatars |
| `ink`, `ink-2`, `muted` | L 21, 36, 50 | text levels 1 to 3 (muted also draws field edges) |
| `rule`, `rule-2` | L 90, 83 | hairlines, key edges |
| `graphite`, `graphite-2`, `graphite-ink`, `graphite-muted` | L 21 to 69 | top bar (the one dark material) |
| `accent`, `accent-2`, `accent-wash`, `accent-ink`, `accent-deep`, `accent-edge`, `focus` | cobalt, hue 258 | primary key, selection, focus ring, the data series |
| `ramp-1` to `ramp-5` | L 88 to 42 | the pay band: min, p25, median, p75, max |
| `key-face`, `key-edge` | | keycap surface and bottom edge |
| `error`, `success` | | field errors and delete, "Active" status |

Dark mode is derived, not inverted: same hues, paper L 15.5 to 22.5, ink L 94.5, accent lifted to L 63 with chroma down, shadows off (elevation is lightness). It follows the OS (`prefers-color-scheme`) or `data-theme="dark"`.

- **Type**: Familjen Grotesk 600 for page titles, panel titles, dialog titles and big figures; IBM Plex Sans 400 and 500 for everything else (14px body, scale 12 / 14 / 16 / 19 / 23 / 28 / 33); JetBrains Mono 400 for employee codes only. Self-hosted with `@fontsource`. Tabular figures on every number. Labels and table heads are sentence case, untracked, in the body face.
- **Surfaces**: a 1px `rule` on everything; panels and fields are cut on two opposite corners (`.cut`, `.cut-s`; a plain radius where `corner-shape` is unsupported). No card shadows; only menus and dialogs have an overlay shadow (light mode).
- **Controls**: keycaps (`.key`): key face on a 3px edge, lifts 1px on hover, sinks on press; one solid cobalt key per screen (the page's primary action). The top bar "+" is a neutral key. Fields are cut with a `muted` edge and a cobalt focus ring that never changes the border width. `.key-flat` has no edge, for row actions.
- **Category chips**: department, level and reason are neutral cut chips with no colour of their own. Status ("Active") is text with one icon, never a filled chip. There are no decorative dots: the only swatches are the five ramp steps next to their label.
- **Motion**: only in response to an action (key travel, row hover, sheet slide); all of it off under `prefers-reduced-motion`.
- Money: right-aligned in tables, tabular, local format via `formatMoney`; currency is never a separate column.

## One job per screen

| Screen | Job | First thing the eye lands on |
|---|---|---|
| Employees | Find someone | The search field and the table |
| Employee | Change pay safely | Annual salary, where it sits in its band, "Change salary" |
| Insights | Answer "where is pay out of line?" | The country summary, then the pay ladder per role |
| Login | Get in | The form |

## Layouts

Unchanged from Desk: top bar with breadcrumb, add action and account menu; 80px icon rail (Employees, Insights); employee list with faceted filter menus (search inside Country, Department, Job title), sortable table and row menu; employee detail with header (back, avatar, name, status, meta, "N of M" pager, menu, Change salary) and Profile / Salary / History tabs in the URL; Insights cards (summary, pay by role, distribution, gender gap, countries).

## Filter menus

Open-ended lists (Country, Department, Job title) have a search box at the top of the menu: focused on open, case-insensitive, arrow keys move through results, Enter toggles, Esc closes, "No matches" when empty. Short fixed lists do not. Counts come from the facets endpoint.

## Interaction rules

- The list's filters, sort and page live in the URL; the detail pager "3 of 2,818" is the position within that list query. The detail tab is in the URL (`?tab=history`).
- Row menu: View, Edit, Change salary, Delete. Detail menu: Edit details, Delete. Delete always asks first.

## Anti-slop checklist (every screen, before commit)

- [ ] No gradient, no decorative shadow, no decorative dot.
- [ ] No all-caps labels, no eyebrows, no arrows in button text, no emoji, no dash in copy.
- [ ] Buttons name the action; toasts repeat it.
- [ ] Money right-aligned, tabular, local format.
- [ ] Loading is a skeleton of the real layout; empty states say what to do next; errors use shared messages.
- [ ] Keyboard: every action reachable, focus visible, dialogs trap focus, Esc closes.
- [ ] Colour never carries meaning alone (the band has its numbers beside it; gap direction is in words).
- [ ] `sloplint --scope app` run: 0 FAIL, 0 REFLEX.
