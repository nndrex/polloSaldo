from __future__ import annotations

from scraper.sites import tori

NOW = "2026-08-29T13:00:00Z"


def test_parses_every_canonical_price_from_fixture(tori_html):
    records = tori.parse(tori_html, NOW)
    by_product = {r.product: r for r in records}

    assert set(by_product) == {"pollo-entero", "medio-pollo", "cuarto-pollo"}
    assert by_product["pollo-entero"].price == 58.90
    assert by_product["medio-pollo"].price == 44.90
    assert by_product["cuarto-pollo"].price == 29.90


def test_parsed_items_cover_pollo_sections(tori_html):
    items = tori.parse_items(tori_html)
    names = {item.name for _, item in items}

    assert {"POLLO TORI", "1/2 DÚO PERFECTO", "1/4 DÚO PERFECTO"} <= names
    assert len(items) >= 15


def test_records_match_schema_shape(tori_html, schema_file):
    from scraper.schema import validate_dataset

    records = tori.parse(tori_html, NOW)
    dataset = {
        "version": 1,
        "updatedAt": NOW,
        "prices": [r.to_record() for r in records],
    }

    validate_dataset(dataset, schema_file)
    assert all(r.sourceUrl == tori.SOURCE_URL for r in records)
