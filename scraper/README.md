# polloSaldo scraper

Daily pollo a la brasa price scraper (spec 001). Run it with:

```bash
# from repo root, using the project venv
pip install -e ./scraper        # once
python -m scraper               # writes data/prices.json
pytest ./scraper/tests          # offline test suite (fixtures only, no network)
```

- One adapter module per restaurant under `src/scraper/sites/` (`primos`,
  `villa_chicken`, `tori`, `pardos`). Each exposes `RESTAURANT`, `fetch(client, now)`
  and pure `parse(...)` helpers used by the fixture-based tests.
- The orchestrator (`src/scraper/orchestrator.py`) fetches every site,
  isolates failures, merges with the previous snapshot (stale entries for
  failed sites keep their old `scrapedAt`), validates the result against
  `specs/contracts/prices.schema.json` and only then writes
  `data/prices.json` atomically.
- Exit codes: `0` = at least one adapter succeeded and the snapshot is valid;
  `1` = all adapters failed; `2` = merged output failed schema validation.
- Fixtures in `tests/fixtures/` are real captures (scripts/assets trimmed).
  No test performs a network request.
- Blocked sites (Granja Azul, Roky's, Norkys) have their schema ids
  reserved but no adapter in v1 — see spec 001 §4 for evidence.
