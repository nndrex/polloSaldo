from __future__ import annotations

import json
from pathlib import Path

from scraper.sites import pardos

FIXTURE = Path(__file__).parent / "fixtures" / "pardos_brasa_products.json"
NOW = "2026-08-29T13:00:00Z"


def load_payload() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_parses_every_canonical_price_from_fixture():
    records = pardos.parse(load_payload(), NOW)
    by_product = {r.product: r for r in records}

    assert set(by_product) == {"pollo-entero", "medio-pollo", "cuarto-pollo"}
    assert by_product["pollo-entero"].price == 60.5
    assert by_product["medio-pollo"].price == 49.9
    assert by_product["cuarto-pollo"].price == 31.9


def test_parsed_items_cover_brasa_categories():
    items = pardos.parse_items(load_payload())

    assert len(items) >= 10
    names = {item.name for _, item in items}
    assert "1 Pardos Brasa" in names


def test_records_match_schema_shape(schema_file):
    from scraper.schema import validate_dataset

    records = pardos.parse(load_payload(), NOW)
    dataset = {
        "version": 1,
        "updatedAt": NOW,
        "prices": [r.to_record() for r in records],
    }

    validate_dataset(dataset, schema_file)
    assert all(r.restaurant == "pardos" for r in records)
    assert all(r.sourceUrl == pardos.SOURCE_URL for r in records)
