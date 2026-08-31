# Spec 003 — Security Review, Test Gate, and Public Launch

Status: **approved** (2026-08-31 — user requested spec + immediate execution in one instruction)
Owner: primary agent (spec-writer), security review delegated to the `security-reviewer` agent
Depends on: `specs/001-price-scraper/spec.md`, `specs/002-salary-calculator/spec.md`, `specs/contracts/prices.schema.json`

## 1. Goal

polloSaldo is about to become a **public repo** with a scheduled CI job and a live
GitHub Pages site. Before that happens: audit every attack surface, prove the whole
test suite is green, and only then create the repo and its deployments. Launch is a
gated process — a BLOCKER finding or a red test stops Phase C.

## 2. Threat model (what "all possible attacks" means for this project)

The attack surface is small but real. Assets: the public repo, the Actions
runners, the Pages site, and `data/prices.json`. Untrusted inputs:

- **Scraped content** (restaurant sites): product names, prices, HTML/JSON payloads.
  This data lands in `data/prices.json` and is rendered by the web app — treat it
  as attacker-controlled (a compromised/malicious restaurant site can inject
  arbitrary strings).
- **GitHub-facing surfaces**: PRs, issues, workflow triggers, fork pushes.
- **Dependencies**: pip packages, bun/npm packages, GitHub Actions.
- The salary input is local-only (R3 of spec 002) and never transmitted — not an
  attack surface beyond DOM logic.

Attack categories to check, mapped to concrete checks:

| # | Category | Concrete checks |
|---|---|---|
| A1 | Secrets in repo | No tokens, keys, passwords, cookies, session IDs in any tracked file (including fixtures, prototypes, `.opencode/`, `data/`) |
| A2 | Personal data / identity | No private emails, phone numbers, addresses; git commit identity uses GitHub noreply email, not a placeholder or private address |
| A3 | Actions: script injection | No untrusted data interpolated into `run:` blocks via `${{ }}` (PR titles, branch names, commit messages); middle-step outputs handled via env vars or files |
| A4 | Actions: untrusted checkout | No `pull_request_target` (or equivalent) that runs untrusted code with write permissions/secrets; workflows triggered by push/schedule/dispatch only |
| A5 | Actions: least privilege | Every workflow declares top-level `permissions:` with only what it needs (`contents: write` for the scrape commit; `pages: write` + `id-token: write` for deploy); no workflow has blanket write access |
| A6 | Actions: supply chain | All third-party actions pinned to full commit SHAs (mutable tags rejected); first-party `actions/*` also pinned |
| A7 | Dependency supply chain | Lockfile (`bun.lock`) committed; pip deps pinned with minimum bounds; Dependabot enabled for pip, bun/npm, and GitHub Actions |
| A8 | Scraper runtime | No `eval`/`exec`/`subprocess`; fetches only the fixed per-adapter URL allowlist (no URLs derived from response content); HTTP timeout set; response size implicitly bounded by parsing; no shell-outs to parse HTML |
| A9 | Scraper → data integrity | Output validated against the schema contract before write (spec 001 R4); schema enums constrain `restaurant`/`product`; `price` numeric with bounds; free-text `productName` is the only unvalidated-into-DOM string |
| A10 | Web: XSS | Every dynamic string rendered with `textContent`/`createElement` — zero `innerHTML`/`insertAdjacentHTML` with data; the only network request is same-origin `/prices.json`; no `eval`, no `new Function`, no remote scripts |
| A11 | Web: state | No cookies, localStorage, sessionStorage, analytics, or third-party embeds (spec 002 R1/R3) |
| A12 | Repo hygiene | `.gitignore` actually excludes `.venv/`, `node_modules/`, `dist/`, env files; no build artifacts or caches committed; no stray fixtures with live personal data |
| A13 | Deployment hardening | Branch `main` protected (no force push, no delete); secret scanning + push protection enabled; Pages deployed via the pinned-Actions workflow with `pages: write`, not by a PAT |

Non-goals (accepted risks, documented): a repo collaborator/attacker with write
access to `main` could poison `data/prices.json` — mitigated by branch protection
and the schema gate, not eliminated; scraped prices can be wrong — staleness and
`sourceUrl` provenance are the existing mitigations; `follow_redirects=True` in
`scraper/http.py` is left unguarded (redirect-target allowlisting was reviewed and
rejected as security theater: the process holds no credentials, fetch URLs are a
static per-adapter allowlist, runners are isolated VMs, and DNS-rebinding guards
would not add real protection — A8 covers the meaningful constraints).

## 3. Requirements

### Phase A — Security review (security-reviewer agent)

- Review every tracked file (scraper, web, specs, prototypes, `.opencode/`,
  `data/`, git-tracked configs) against A1–A12; review the workflows written in
  Phase C against A3–A6/A13 before they are pushed.
- Findings are classified **BLOCKER** (must fix before repo creation),
  **SHOULD** (fix in this pass if cheap), or **NOTE** (document, defer).
- Every BLOCKER gets a fix or an explicit user decision before Phase C.

### Phase B — Test gate

- Scraper: `.venv/bin/pytest scraper/tests` — all green.
- Web: `bun run test` (vitest) and `bun run build` (tsc + vite) — all green.
- Data: `data/prices.json` validates against `specs/contracts/prices.schema.json`.
- Phase C may only start when Phase A has zero open BLOCKERs and Phase B is fully green.

### Phase C — Repo creation and deployments (gated on A + B)

1. `git init`, set a **local** repo identity (GitHub username + noreply email),
   verify `git status` is clean of ignored artifacts, initial commit on `main`.
2. Add the two workflows from spec 001 §3 / spec 002 §3:
   - `scrape.yml`: cron `0 13 * * *` + `workflow_dispatch`; `permissions: contents: write`;
     steps = setup Python → install → pytest → run scraper → schema-validate →
     commit `data/prices.json` (only if it changed) as
     `chore: daily prices` → push (which triggers the deploy workflow).
   - `deploy.yml`: on push to `main` affecting `web/**` or `data/prices.json`;
     `permissions: pages: write, id-token: write`; steps = setup bun → install →
     vitest → build → upload artifact → deploy to GitHub Pages.
   - All actions pinned to full SHAs (A6).
3. Add `dependabot.yml` (pip, bun, actions, weekly), a README (what it is, how to
   run, data license note, no-affiliation disclaimer), and a `SECURITY.md`
   (no secrets in repo; report via GitHub private vulnerability reporting).
4. Create the public GitHub repo, push `main`.
5. Enable: GitHub Pages (source: GitHub Actions), secret scanning + push
   protection, Dependabot alerts + version updates, branch protection on `main`
   (block force push + deletion; no required reviews — solo project).
6. Verify the deploy workflow goes green and the Pages site serves the calculator
   with live data.

## 4. Acceptance criteria

- **AC-1**: The security review produced a findings report; zero BLOCKERs remain
  open at repo creation; remaining SHOULD/NOTE items are listed in the report.
- **AC-2**: No tracked file contains a secret/credential (A1); commit author
  identity is the GitHub noreply address (A2).
- **AC-3**: All GitHub Actions in the repo: least-privilege `permissions:`, no
  untrusted `${{ }}` interpolation, every action pinned to a full SHA (A3–A6).
- **AC-4**: Web app contains no `innerHTML`/`insertAdjacentHTML` with dynamic
  data, no `eval`/`new Function`, and exactly one network call (`/prices.json`)
  (A10–A11).
- **AC-5**: Scraper code contains no `eval`/`exec`/`subprocess` and fetches only
  the per-adapter allowlisted URLs (A8).
- **AC-6**: Scraper tests, web tests, web typecheck+build, and schema validation
  of `data/prices.json` all pass (Phase B) before the repo is created.
- **AC-7**: `flavio/polloSaldo` (or confirmed owner/repo name) exists, is **public**,
  `main` is pushed with workflows, and branch protection + secret scanning +
  Dependabot are enabled (A13).
- **AC-8**: The Pages deployment is green and the live site renders with real
  prices data; the daily scrape workflow exists and is schedulable (manual
  dispatch used for the first run).

## 5. Out of scope

- Custom domain, TLS config, CDN tuning (plain `*.github.io` is fine)
- Required PR reviews / CODEOWNERS (solo maintainer)
- Dependency auto-merge bots, fuzzing, SAST beyond the review above
- Rate-limit protection, WAF — static Pages site with no backend
- License selection (repo launches "all rights reserved" unless user asks)
