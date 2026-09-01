# STATUS — Session Handoff

_Last updated: 2026-09-01. Read PLAN.md for the full plan and decision log; this file
is the "where we are" snapshot for continuing sessions._

## Launch state: ✅ LIVE

- Repo: https://github.com/nndrex/polloSaldo (public, pushed 2026-08-31)
- Site: https://nndrex.github.io/polloSaldo/ (HTTP 200, serving real data)
- Daily scrape cron: ran successfully 2026-08-31 and 2026-09-01 (13:00 UTC,
  `chore: daily prices` bot commits)

## What exists right now

| Item | State |
|---|---|
| `specs/contracts/prices.schema.json` | ✅ Schema v1, 7 restaurant ids reserved |
| `specs/001-price-scraper/spec.md` | ✅ Approved (2026-08-29) |
| `specs/002-salary-calculator/spec.md` | ✅ Approved; §6–§8 amendments implemented |
| `specs/003-launch-security-deploy/spec.md` | ✅ Approved (2026-08-31) — **executed**: security review, test gate, repo creation, deploy |
| `scraper/` | ✅ 4 adapters (primos, villa-chicken, tori, pardos); tests via `.venv/bin/pytest scraper/tests` |
| `web/` | ✅ Vite + vanilla TS calculator; dev/build/test via **bun** |
| `.github/workflows/scrape.yml` | ✅ Green — cron `0 13 * * *`, least-privilege, SHAs pinned |
| `.github/workflows/deploy.yml` | ✅ Green — Pages deploy on push to `web/**` or `data/prices.json` |
| `data/prices.json` | ✅ Auto-updated daily by CI (schema-valid) |
| README.md / SECURITY.md / dependabot.yml | ✅ Committed |

## AC-7 remote settings — verified 2026-09-01

| Setting | State |
|---|---|
| Repo public | ✅ |
| Branch protection on `main` | ✅ enabled |
| Secret scanning | ✅ enabled |
| Secret scanning push protection | ✅ enabled |
| Dependabot security updates (alerts) | ✅ enabled |
| Dependabot version updates | ✅ enabled (8 update PRs open) |

## Open items (next actions)

1. **8 open Dependabot PRs (#1–#8)** — all major-version bumps, need user decision:
   actions/checkout 4→7, setup-python 5→7, deploy-pages 4→5, upload-pages-artifact 3→5,
   setup-bun 2.0.1→2.2.0, typescript 5.9.3→7.0.2, vite 6.4.3→8.2.2, vitest 2.1.9→4.1.11.
   Merge one at a time; `bun run test && bun run build` must stay green (Actions bumps
   verified by green workflow runs).
2. Security findings report (spec 003 AC-1) was delivered in chat only — not persisted
   in the repo. If wanted, capture it under `specs/003-launch-security-deploy/`.
3. Optional hardening (all non-blocking): secret scanning validity checks and
   non-provider patterns are `disabled` by default; enable in Settings → Code security
   if desired.
