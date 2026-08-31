# Spec 002 — Salary Calculator (single page)

Status: **approved** (2026-08-29) — amended 2026-08-30 (design §6; salary period §7; copy & chart §8)
Owner: web-developer agent
Depends on: `specs/contracts/prices.schema.json`, data produced by Spec 001

## 1. Goal

A single static page where a user enters their hourly salary (in S/) and sees how much
work time each pollería's pollo a la brasa costs them. No login, no navigation,
no history UI — one page, one input, one answer.

## 2. Requirements

### R1 — Single page, static
- One route only. Built with Vite + vanilla TypeScript, no framework, no router.
- Deployed as static files (GitHub Pages). No server, no cookies, no analytics,
  no authentication of any kind.

### R2 — Data source
- The page fetches `/prices.json` (the file produced by Spec 001) at load time.
- If the fetch fails or the JSON fails to validate against the schema contract,
  the page MUST show an honest error state ("No hay datos disponibles ahora"),
  never fabricated prices.

### R3 — Input
- One numeric input: hourly salary in soles (S/ por hora).
- Input is free and local; nothing is stored, submitted, or persisted
  (reloading clears it — this is acceptable and intended).

### R4 — Calculation (the only formula in the project)
- For each price entry: `minutes = (price / hourlySalary) * 60`.
- Display as hours + minutes, rounded to the nearest minute (e.g. "2 h 48 min").
- The user selects which product to compare (default: `pollo-entero`);
  entries for the selected product across all restaurants are shown.

### R5 — Display
- A list, one row per restaurant, sorted from cheapest work-time to most expensive:
  restaurant name, product name (as scraped), price in S/, and the work time.
- The date of the data (`updatedAt`) is displayed prominently so staleness is obvious,
  plus each row's own `scrapedAt` if it differs meaningfully from the snapshot date.
- Stale entries (scrapedAt more than 3 days old) are visually flagged.
- No charts, no history graphs in v1.

### R6 — Edge cases
| Case | Required behavior |
|---|---|
| Salary empty | Show hint text, no rows |
| Salary ≤ 0 | Show validation message, no rows |
| Salary extremely high (rows round to 0 min) | Show "< 1 min de trabajo" |
| No prices for selected product | Show "Sin datos para este producto" |
| prices.json missing/invalid | Error state per R2 |
| Single restaurant only | List works normally with 1 row |

### R7 — Language
- UI copy in Spanish (Peru). Keep all user-visible strings in one place in the code
  (constants), so they can be edited without touching logic.

## 3. Deploy behavior (workflow, to be implemented in step 5)

- On every push affecting `web/` or `data/prices.json`: run tests, `vite build`,
  deploy static output to GitHub Pages.
- The daily prices commit therefore auto-publishes fresh prices — no separate
  publish step.

## 4. Acceptance criteria

- **AC-1**: Given salary S/15.00 and a price of S/42.00, the rendered time is
  exactly "2 h 48 min" (42/15*60 = 168 min).
- **AC-2**: Given salary S/20.00 and price S/3.00, the rendered time is "9 min"
  (not "0 h 9 min" and not "0 min").
- **AC-3**: Given a price that rounds to 0 minutes, the UI shows "< 1 min de trabajo".
- **AC-4**: Empty, zero, and negative salary inputs render the required hint/validation
  per R6 and never a division result.
- **AC-5**: Rows are sorted by work time ascending; this holds when two rows tie
  (deterministic tie-break: alphabetical by restaurant name).
- **AC-6**: A corrupted/missing prices.json renders the R2 error state, verified
  with a mocked fetch in tests.
- **AC-7**: All formula and sorting logic is implemented as pure functions
  (separate module) and tested directly with vitest, independent of the DOM.
- **AC-8**: The production build contains no network call other than the
  `prices.json` fetch, and no storage of user input anywhere.

## 5. Out of scope (v1)

- Auth, accounts, persistence of salary
- History charts / price evolution UI
- Multi-language
- Mobile app / PWA

## 6. Design adaptation (amendment, 2026-08-30)

The UI adopts the visual design of `prototypes/pollo-a-la-brasa-v2.html`
(dark oklch palette, serif display type, ember/smoke hero, animated horizontal
bars, closing footer). This amendment records where the prototype's
presentation differs from the literal wording of R1/R5. All acceptance
criteria (AC-1…AC-8) are unchanged.

- **R5 presentation**: the sorted list is rendered as a horizontal bar chart —
  one bar per restaurant, bar length proportional to work time, sorted
  cheapest-first. Each bar still carries the full R5 row data: restaurant
  name, product name (as scraped), price in S/, work time, stale flag.
  This is a *current-state* chart; history charts remain out of scope (§5).
- **R1 page scope**: the page keeps three presentational acts (hero, results
  chart, closing footer) around the single input. Still one route, one input,
  no navigation, no auth.
- **Copy/branding**: headline is "¿Cuántos pollos a la brasa vale una hora de
  tu vida?" (user-approved 2026-08-30). Results remain in spec units — minutes
  of work per pollo (R4). All user-visible strings stay in `strings.ts` (R7).
- **Form behavior**: CTA button validates the salary (R6) and smooth-scrolls
  to the results; results also update live while typing.
- **Motion**: parallax and reveal animations respect `prefers-reduced-motion`.
- **AC-8 guard**: the design introduces no new network requests (system fonts,
  inline SVG grain); the only fetch remains `/prices.json`.

## 7. Salary period selector (amendment, 2026-08-30)

R3's single "hourly salary" input becomes a salary **amount + period** pair:

- A numeric amount (same R6 edge cases: empty, ≤ 0, non-numeric).
- A dropdown with four periods, **monthly by default**: `Por mes`, `Por día`,
  `Por hora`, `Por año`.
- The amount is converted to an hourly value before applying the R4 formula
  (`minutes = (price / hourlySalary) * 60`). Conversion constants live in one
  module and are documented:

| Period | Hourly conversion | Basis |
|---|---|---|
| Por hora | amount | — |
| Por día | amount / 8 | 8-hour workday |
| Por mes | amount / 240 | 30 days × 8 h (Peruvian labor convention) |
| Por año | amount / 2880 | 12 × 240 |

- All periods compute the same rows; only the input interpretation changes.
- Conversion is a pure function (`toHourly`) tested directly (AC-7 style);
  existing ACs unchanged. Default remains monthly, so a first-time visitor
  types a familiar full salary.

## 8. Copy & chart adjustments (amendment, 2026-08-30)

User-approved presentation adjustments; they do not change the calculation
(R4) or any data contract:

- **Default product**: `cuarto-pollo` (was `pollo-entero` in R4). Rows for the
  selected product still include all restaurants; the selector still allows
  all three products.
- **Chart measure**: bar values and the axis are expressed in **hours**
  (e.g. "2.8 h", axis label "Horas de trabajo / pollo"), not minutes. Values
  < 1 minute render as "< 1 min" (R6 extreme-salary case).
- **CTA**: "Calcular" (was "Prende la brasa").
- **Chart legend**: the chart footer legend shows the converted hourly salary
  when a valid amount is entered — "Horas de trabajo / pollo · S/ {hourly}/h"
  (es-PE, 2 decimals); it falls back to the plain label otherwise.
- **Copy**: the "sin trucos" phrase was removed from the order note; meta
  description and chart title use hours wording. Eyebrow is "Lima, Perú"
  (brand name removed) and the hero headline is the user-approved single
  question "¿Cuántas horas de tu sudor te costaría comerte un pollito a la
  brasa?".
- **Closing footer merged into the chart (user-approved 2026-08-30)**: the
  standalone third act is gone. A slim **full-width** footer lives inside the
  chart section — darker surface band, centered row — containing only the
  **GitHub link placeholder** (`github.com/flavio/polloSaldo`, to be updated
  when the repo goes public) and the **"Volver ↑"** button. The status line,
  credit text and display sentence were removed entirely; the R2 error state
  is shown only in the chart area. This supersedes §6's "closing footer is a
  sibling of the bars section" note.
- Sorting remains work-time ascending (R5/AC-5) — unchanged.
