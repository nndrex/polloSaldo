# Spec 001 — Price Scraper

Status: **approved** (2026-08-29)
Owner: scraper-developer agent
Depends on: `specs/contracts/prices.schema.json`

## 1. Goal

A Python scraper that, once per day, extracts pollo a la brasa prices from a fixed
list of Peruvian pollerías and writes a single snapshot to `data/prices.json`,
conforming to the schema contract.

## 2. Requirements

### R1 — Scheduled, not interactive
- The scraper runs unattended once per day (GitHub Actions cron, 13:00 UTC = 8:00 Peru).
- A manual local run (`python -m scraper`) must produce identical output format.
- The run MUST NOT require credentials, browser logins, or human interaction.

### R2 — One adapter per restaurant, fully isolated
- Each pollería has its own adapter module under `scraper/src/sites/`.
- An adapter only receives its own HTTP client and config; it knows nothing about other sites.
- The failure of any single adapter MUST NOT abort the run: the orchestrator logs the
  error, records the site as failed for that run, and continues.
- The run exits 0 if at least one adapter succeeds; exits non-zero only if ALL fail.

### R3 — Normalized output
- Every price is normalized into the shape defined by `prices.schema.json`.
- Restaurant ids and product slugs MUST come from the schema enums — no free-text ids.
- Adapter authors map site-specific names (e.g. "Pollo Entero" vs "Pollo La Brasa 1u")
  to canonical slugs (`pollo-entero`, `medio-pollo`, `cuarto-pollo`).
- Prices are stored as decimal numbers in PEN, never strings, never thousands separators.
- `data/prices.json` holds ONLY the latest snapshot. History is implicit in git.

### R4 — Schema validation gate
- The scraper MUST validate its merged output against `prices.schema.json` before writing.
- If validation fails, the run exits non-zero and does NOT write the file
  (the previous good snapshot survives).

### R5 — Write policy
- On success: merge new prices, update `updatedAt`, write `data/prices.json`.
- The write is atomic from git's perspective (single file, single commit by the workflow).
- A restaurant whose adapter failed keeps its previous price entry (stale data beats no data),
  but its `scrapedAt` remains the old timestamp, making staleness visible.

### R6 — Offline-testable
- All adapter tests run against committed HTML/PDF fixtures in `scraper/tests/fixtures/`.
  No test performs a live network request.
- Fixture files are real captures of the target pages (trimmed of scripts/assets).

### R7 — Dependency discipline
- Base stack: `httpx` + `beautifulsoup4` + `lxml` + `pdfplumber` (for PDF menus)
  + `jsonschema` (for R4) + `pytest` (for tests).
- Playwright is OUT OF SCOPE for v1. If a site proves unscrapeable without JS rendering,
  record it in §5 and defer.

## 3. Scrape schedule (workflow behavior, to be implemented in step 5)

- Cron: once daily, 13:00 UTC.
- Workflow steps: install deps → run pytest → run scraper → validate `data/prices.json`
  against schema → commit `data/prices.json` (single commit, message "chore: daily prices").
- The commit triggers the site redeploy (see Spec 002 §6).
- If the scraper fails entirely, the workflow does NOT commit and the site keeps
  serving the last good snapshot.

## 4. Site list and recon status (as of 2026-08-29)

| Restaurant | id (schema) | Source | Status for v1 |
|---|---|---|---|
| Primos Chicken Bar | `primos` | primoschickenbar.pe `/carta` | ✅ IN — Framer SSR HTML; items under `data-framer-name="Nombre"/"Precio"`, prices `S/. XX`. Fixture: `primos_carta.html` |
| Villa Chicken | `villa-chicken` | villachicken.com.pe — carta URL confirmed: `https://villachicken.com.pe/villaweb/carta`; data via POST `Controller/Principal?p=Listar_Servicios_Inicio` (`valor=1`), price field `precion_base` | ✅ IN — JSON API, no JS rendering needed. Fixture: `villa_carta_api.json` |
| Tori | `tori` | tori.pe `carta-delivery` — resolved 2026-08-29: menu is static Squarespace HTML (`menu-section-title` + `menu-item-title` + prices after `currency-sign` span), NOT a PDF | ✅ IN — pdfplumber not required for this site. Fixture: `tori_carta_delivery.html` |
| Granja Azul | `granja-azul` | granjaazul.com.pe (Wix) — resolved 2026-08-29: homepage renders a "ComingSoon_Granja(web)" Wix image, no menu content | ❌ BLOCKED — placeholder/coming-soon site |
| Roky's | `rokys` | rokys.com.pe — resolved 2026-08-29: homepage is a 19-line placeholder ("Derechos Reservados @ Rokys.com.pe"), no carta link in static HTML | ❌ BLOCKED — no usable static source |
| Norkys | `norkys` | norkys.pe | ❌ BLOCKED — homepage shows "PRONTO REGRESAMOS" placeholder; site also shows signs of compromise. Revisit when the site is live |
| Pardo's | `pardos` | pardoschicken.pe `/categorias/pardos-brasa` — resolved 2026-08-29: Angular app with public JSON API at `api.pardoschicken.pe/api/v2/categories/{slug}/establishments/{uuid}/channels/{channel}/products` (header `Accept: application/vnd.pardos.v2+json`, default establishment `07accaf0-b8fa-11e7-bc6a-e5b83cb342d2`, channel 1) | ✅ IN — adapter added 2026-08-29. Fixture: `pardos_brasa_products.json` |

Rules:
- A site marked CONDITIONAL/INSPECT must be resolved to IN or BLOCKED in this table
  (with evidence: URL + what was found) BEFORE its adapter is written.
- BLOCKED sites keep their schema id reserved but contribute no adapter code in v1.
- Every adapter in v1 needs a committed fixture before its tests are considered complete.

## 5. Acceptance criteria

Each criterion maps to a test or CI check. "Done" means the criterion has a passing test.

- **AC-1**: Given the Primos carta fixture, the Primos adapter extracts every product
  price present in the fixture, each matching the schema's `price` definition.
- **AC-2**: Given the Villa Chicken carta fixture, same guarantee as AC-1.
- **AC-3** *(only if Tori = IN)*: Given the Tori PDF fixture, pdfplumber-based extraction
  produces at least the `pollo-entero` price with correct value.
- **AC-4**: Running the orchestrator with all adapters mocked to fail exits non-zero,
  writes nothing, and the existing `data/prices.json` is untouched.
- **AC-5**: Running the orchestrator with only the Primos adapter succeeding (others fail)
  exits 0, keeps prior entries for the failed sites with their old `scrapedAt`, and
  updates only Primos prices + `updatedAt`.
- **AC-6**: The merged output always validates against `prices.schema.json`;
  injecting an invalid record (e.g. price as string) into an adapter's return value
  makes the run exit non-zero without writing.
- **AC-7**: No test in `scraper/tests/` performs a network request (enforced by
  fixture-based design; a CI-level guard may be added later).
- **AC-8**: `python -m scraper` locally produces a `data/prices.json` that passes schema
  validation, without any environment variables required.

## 6. Out of scope (v1)

- Playwright / headless browsers
- Delivery platforms (Rappi, PedidosYa)
- OCR for image menus
- Storing history beyond git history of `data/prices.json`
- Norkys and Pardo's adapters (blocked — see §4)
