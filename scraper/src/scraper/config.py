from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_FILE = REPO_ROOT / "data" / "prices.json"
SCHEMA_FILE = REPO_ROOT / "specs" / "contracts" / "prices.schema.json"
USER_AGENT = "polloSaldo-scraper/0.1"
HTTP_TIMEOUT_SECONDS = 30.0
