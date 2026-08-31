# polloSaldo

**¿Cuántos pollos a la brasa vale una hora de tu vida?**

A one-page calculator that converts pollo a la brasa prices into work time:
type your salary, see how many hours of work each pollería's pollo costs you.
Prices are scraped once a day from the public menu pages of Peruvian
pollerías.

**No affiliation** with any of the restaurants listed. All product names and
prices belong to their respective owners; this project only reads their
public menu pages once per day and shows the numbers with provenance
(`sourceUrl` per price).

## How it works

```
scraper/  (Python, httpx + BS4)  ── daily at 13:00 UTC ──▶  data/prices.json
                                                                    │
web/  (Vite + vanilla TS)  ◀── fetched at page load ────────────────┘
        │
        └── deployed to GitHub Pages on every push affecting web/ or data/
```

- `data/prices.json` is the entire backend — a single schema-validated file,
  committed by GitHub Actions. Price history is git history.
- The site is fully static: no backend, no auth, no cookies, no analytics.
  Your salary never leaves the browser.

## Repo layout

| Path | What |
|---|---|
| `specs/` | Spec-driven development: contracts + per-component specs |
| `scraper/` | Python scraper (one adapter per restaurant, fixture-based tests) |
| `web/` | The calculator (vanilla TypeScript, vitest) |
| `data/prices.json` | Latest snapshot (schema in `specs/contracts/`) |
| `.github/workflows/` | Daily scrape cron + Pages deploy |

## Development

Scraper (Python 3.9+):

```bash
python3 -m venv .venv
.venv/bin/pip install -e "./scraper[dev]"
.venv/bin/pytest scraper/tests   # offline, fixture-based
.venv/bin/python -m scraper      # live run, writes data/prices.json
```

Web (Bun):

```bash
cd web
bun install
bun run dev      # local dev server
bun run test     # vitest
bun run build    # typecheck + production build
```

All changes to the data shape go through the contract first:
`specs/contracts/prices.schema.json`, and every behavior change starts as a
spec under `specs/`.
