# STATUS — Session Handoff

_Last updated: 2026-08-29. Read PLAN.md for the full plan and decision log; this file
is the "where we are" snapshot for continuing sessions._

## What exists right now

| File | State |
|---|---|
| `specs/contracts/prices.schema.json` | ✅ Written (schema v1, 7 restaurant ids reserved) |
| `specs/001-price-scraper/spec.md` | ✅ **Approved** (2026-08-29) — implementation may proceed |
| `specs/002-salary-calculator/spec.md` | ✅ **Approved** (2026-08-29) — **amended 2026-08-30 §6**: UI adopts `prototypes/pollo-a-la-brasa-v2.html` design (bar chart as R5 list, 3-act page, headline "¿Cuántos pollos a la brasa vale una hora de tu vida?"); ACs unchanged |
| `.opencode/agents/spec-writer.md` | ✅ Written — mode: **primary** |
| `.opencode/agents/scraper-developer.md` | ✅ Written — mode: **subagent** |
| `.opencode/agents/web-developer.md` | ✅ Written — mode: **subagent** |
| `PLAN.md` | ✅ Written — decisions, site status, execution order |
| `scraper/`, `web/`, `.github/`, git repo | ❌ Not created yet — **intentionally**, per user: no code/settings until specs are approved |
| `scraper/` (package + tests + fixtures) | ✅ **Built 2026-08-29** — 4 adapters (primos, villa-chicken, tori, pardos), 23 tests passing, live run wrote schema-valid `data/prices.json` |
| `web/` (Vite + vanilla TS calculator) | ✅ **Built 2026-08-30 — redesigned** per spec 002 §6 (2 acts: hero + chart with slim merged footer per §8), **§7 salary period selector** (monthly default), **§8 copy/chart adjustments** (default cuarto-pollo, hours-based chart, "Calcular" CTA, hourly-salary legend); 36 vitest tests green, build clean; dev/build/test via **bun** |
| `data/prices.json` | ✅ Latest snapshot 2026-08-29 — 12 prices (4 restaurants × 3 products) |

## Key facts a new session must know

- Project: one-page calculator "how many minutes of work = a pollo a la brasa",
  fed by once-daily scraped prices. Monorepo, public repo, free-tier only.
- Stack decided: Python scraper (httpx + BS4 + lxml + pdfplumber) · Vite + vanilla TS
  web · GitHub Actions cron 13:00 UTC · GitHub Pages. No auth, no DB, no servers.
- SDD lightweight: specs first, every AC maps to a test. Specs are the gate —
  **do not implement against a draft spec**.
- Recon done 2026-08-29 (evidence in spec 001 §4):
  - ✅ IN: Primos (first adapter), Villa Chicken
  - ⚠️ CONDITIONAL/INSPECT: Tori (PDF?), Granja Azul (Wix), Roky's (JS-heavy)
  - ❌ BLOCKED: Norkys (placeholder site), Pardo's (domain unreachable)
- The scraper-developer/web-developer agents are subagents; delegate via
  `@scraper-developer` / `@web-developer`. spec-writer is primary.

## Next actions (in order)

1. ~~User approves specs 001 + 002~~ — **spec 001 approved 2026-08-29** (spec 002 still draft).
1b. ~~Step 2 + 3~~ — **done 2026-08-29**: recon resolved (Tori IN via static HTML; Granja Azul + Roky's BLOCKED), scraper implemented, 20 tests green, live run OK. Run tests with `.venv/bin/pytest scraper/tests` (venv at repo root, `pip install -e ./scraper`).
2. ~~Step 4~~ — **done + redesigned 2026-08-30** (spec 002 §6 design adaptation implemented by `@web-developer`; 27 tests green).
3. Step 5: CI workflows (scrape cron + Pages deploy). Step 6: git init, README, repo hygiene.
