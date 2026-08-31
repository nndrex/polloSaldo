# polloSaldo — Plan

**One-page calculator:** how many minutes of work does a pollo a la brasa cost you,
based on daily-scraped prices from Peruvian pollerías.

- Method: Spec-Driven Development (lightweight) — specs first, every acceptance
  criterion maps to a test.
- Stack: Python scraper (httpx + BeautifulSoup + lxml + pdfplumber) · Vite + vanilla
  TypeScript web · GitHub Actions cron (once daily, 13:00 UTC) · GitHub Pages.
- Free-tier only: no servers, no databases, no auth. `data/prices.json` committed to
  the repo is the entire "backend"; git history is the price history.
- Monorepo, public repo.

## Documents

| Document | Role |
|---|---|
| `specs/contracts/prices.schema.json` | Data contract. Scraper validates on write; web consumes; CI enforces. |
| `specs/001-price-scraper/spec.md` | Scraper requirements + per-site recon + AC. |
| `specs/002-salary-calculator/spec.md` | Single-page calculator requirements + AC. |
| `.opencode/agents/` | `spec-writer`, `scraper-developer`, `web-developer` — SDD role agents. |

## Decision log

| Decision | Choice | Reason |
|---|---|---|
| Scrape frequency | Once daily | User requirement |
| Web scope | Calculator only, no login | User requirement |
| Architecture | Monorepo | Shared contract, one push updates both, scale doesn't justify splitting |
| Scraper language | Python | Best scraping ecosystem |
| Web stack | Vite + vanilla TS | Next.js rejected as overkill for one static page |
| Storage | JSON in repo | Zero infra, free, history via git |
| SDD tooling | Lightweight markdown specs | Chosen over Spec Kit |
| Headless browser | Out of scope v1 | Only escalate if a site truly requires it |
| Image-menu OCR | Out of scope v1 | Not worth the complexity |
| Delivery apps as source | Out of scope v1 | ToS risk, heavier scraping |

## Site status (detail and evidence in spec 001 §4)

| Restaurant | v1 status |
|---|---|
| Primos | ✅ IN — first adapter (Framer SSR HTML) |
| Villa Chicken | ✅ IN — carta URL confirmed; data via JSON API POST |
| Tori | ✅ IN — resolved 2026-08-29: static HTML menu, not a PDF |
| Granja Azul | ❌ BLOCKED — Wix "ComingSoon" placeholder |
| Roky's | ❌ BLOCKED — placeholder homepage, no carta in static HTML |
| Norkys | ❌ BLOCKED — placeholder site ("PRONTO REGRESAMOS") |
| Pardo's | ✅ IN — resolved 2026-08-29: correct domain pardoschicken.pe; public JSON API, adapter added |

## Execution order

| Step | Work | Owner | Gate |
|---|---|---|---|
| 1 | Schema contract + spec 001 + spec 002 | spec-writer | ✅ written — **user must approve** |
| 2 | Resolve CONDITIONAL/INSPECT sites (capture fixtures, record evidence in spec 001 §4) | scraper-developer + user | spec 001 §4 has a verdict per site |
| 3 | Implement scraper to spec 001 (adapters, orchestrator, tests) | scraper-developer | all IN-site ACs pass |
| 4 | Implement calculator to spec 002 | web-developer | AC-1…AC-8 pass |
| 5 | CI: daily scrape workflow (tests → scrape → schema-validate → commit) + Pages deploy workflow | primary agent | workflow green |
| 6 | Scaffold: git init, repo hygiene, README | primary agent | — |

## Current status

- [x] Step 1 artifacts written (schema, spec 001, spec 002, agents, this plan)
- [x] Agents: spec-writer (primary), scraper-developer + web-developer (subagents)
- [x] Session handoff doc written (`STATUS.md` — read that first when resuming)
- [x] **Spec 001 approved by user** (2026-08-29) — spec 002 still draft
- [ ] Step 2: site recon resolved ← next action
- [x] Step 2: site recon resolved (2026-08-29 — evidence in spec 001 §4)
- [x] Step 3: scraper implemented (2026-08-29 — 20 tests passing, live run OK)
- [x] Step 4: calculator implemented (2026-08-29, bun + vite + vanilla TS)
- [ ] Step 5: CI workflows
- [ ] Step 6: scaffold + README
