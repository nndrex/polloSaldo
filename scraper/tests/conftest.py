from __future__ import annotations

import json
from pathlib import Path

import pytest

FIXTURES_DIR = Path(__file__).parent / "fixtures"
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_FILE = REPO_ROOT / "specs" / "contracts" / "prices.schema.json"

NOW = "2026-08-29T13:00:00Z"


@pytest.fixture
def primos_html() -> str:
    return (FIXTURES_DIR / "primos_carta.html").read_text(encoding="utf-8")


@pytest.fixture
def villa_payload() -> str:
    return (FIXTURES_DIR / "villa_carta_api.json").read_text(encoding="utf-8")


@pytest.fixture
def tori_html() -> str:
    return (FIXTURES_DIR / "tori_carta_delivery.html").read_text(encoding="utf-8")


@pytest.fixture
def schema_file() -> str:
    return str(SCHEMA_FILE)


def prior_dataset(scraped_at: str = "2026-08-20T13:00:00Z") -> dict:
    return {
        "version": 1,
        "updatedAt": scraped_at,
        "prices": [
            {
                "restaurant": "primos",
                "product": "pollo-entero",
                "productName": "1 Pollo + Papas fritas + Ensalada",
                "price": 79.0,
                "currency": "PEN",
                "scrapedAt": scraped_at,
                "sourceUrl": "https://www.primoschickenbar.pe/carta",
            },
            {
                "restaurant": "villa-chicken",
                "product": "pollo-entero",
                "productName": "1 POLLO + PAPAS GRANDES + ENSALADA CLASICA",
                "price": 69.9,
                "currency": "PEN",
                "scrapedAt": scraped_at,
                "sourceUrl": "https://villachicken.com.pe/villaweb/carta",
            },
        ],
    }


@pytest.fixture
def write_data_file(tmp_path: Path):
    def _write(dataset: dict | None) -> Path:
        data_file = tmp_path / "data" / "prices.json"
        data_file.parent.mkdir(parents=True, exist_ok=True)
        if dataset is not None:
            data_file.write_text(json.dumps(dataset), encoding="utf-8")
        return data_file

    return _write
