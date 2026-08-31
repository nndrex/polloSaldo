from __future__ import annotations

from scraper.sites import villa_chicken

NOW = "2026-08-29T13:00:00Z"


def test_parses_every_canonical_price_from_fixture(villa_payload):
    records = villa_chicken.parse(villa_payload, NOW)
    by_product = {r.product: r for r in records}

    assert set(by_product) == {"pollo-entero", "medio-pollo", "cuarto-pollo"}
    assert by_product["pollo-entero"].price == 78.2
    assert by_product["medio-pollo"].price == 45.8
    assert by_product["cuarto-pollo"].price == 26.9


def test_parsed_items_cover_full_carta(villa_payload):
    items = villa_chicken.parse_items(villa_payload)

    assert len(items) >= 50


def test_records_match_schema_shape(villa_payload, schema_file):
    from scraper.schema import validate_dataset

    records = villa_chicken.parse(villa_payload, NOW)
    dataset = {
        "version": 1,
        "updatedAt": NOW,
        "prices": [r.to_record() for r in records],
    }

    validate_dataset(dataset, schema_file)
    assert all(r.restaurant == "villa-chicken" for r in records)
    assert all(r.currency == "PEN" for r in records)
