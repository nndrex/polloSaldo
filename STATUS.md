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

1. ~~8 open Dependabot PRs~~ — **3 merged 2026-09-01 after per-branch verification**
   (full gate `bun install → vitest → tsc + vite build` run in isolated worktrees):
   - ✅ #7 vite 6.4.3→8.2.2 (safe)
   - ✅ #5 vitest 2.1.9→4.1.11 (safe; dependabot auto-rebased onto vite-8 main)
   - ✅ #8 typescript 5.9.3→7.0.2 — **was breaking on the old base** (TS7 native
     compiler rejected the side-effect CSS import, TS2882); resolved by the rebase
     onto main: `vite-env.d.ts` + vite 8's `vite/client` types declare `*.css`.
     Final combined stack (vite 8 + vitest 4 + ts 7): 36/36 tests, build clean,
     deploy green, live bundle verified.
   - ⏳ Remaining open (workflow-only, low risk): #1 setup-python 7, #2 deploy-pages 5,
     #3 checkout 7, #4 upload-pages-artifact 5, #6 setup-bun 2.2.0.
2. ~~Dependabot critical vulnerability alert~~ — most likely fixed by the vite 8
   merge; **verify** at https://github.com/nndrex/polloSaldo/security/dependabot
   (alert details need `security_events:read` — token got 403 on 2026-09-01).
3. Security findings report (spec 003 AC-1) was delivered in chat only — not persisted
   in the repo. If wanted, capture it under `specs/003-launch-security-deploy/`.
4. Optional hardening (all non-blocking): secret scanning validity checks and
   non-provider patterns are `disabled` by default; enable in Settings → Code security
   if desired.
5. Gap noted 2026-09-01: no CI runs on PRs (workflows trigger on push/schedule only),
   so Dependabot PRs arrive unverified. Options: add a `pull_request`-triggered
   test workflow (safe here — no secrets, untrusted-checkout rules respected), or
   keep manual verification per merge.
