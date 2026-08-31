from __future__ import annotations

from scraper.sites import primos

NOW = "2026-08-29T13:00:00Z"


def test_parses_every_canonical_price_from_fixture(primos_html):
    records = primos.parse(primos_html, NOW)
    by_product = {r.product: r for r in records}

    assert set(by_product) == {"pollo-entero", "medio-pollo", "cuarto-pollo"}
    assert by_product["pollo-entero"].price == 89.0
    assert by_product["medio-pollo"].price == 53.0
    assert by_product["cuarto-pollo"].price == 35.0


def test_parsed_items_cover_full_menu(primos_html):
    items = primos.parse_items(primos_html)

    assert len(items) >= 50


def test_records_match_schema_shape(primos_html, schema_file):
    from scraper.schema import validate_dataset

    records = primos.parse(primos_html, NOW)
    dataset = {
        "version": 1,
        "updatedAt": NOW,
        "prices": [r.to_record() for r in records],
    }

    validate_dataset(dataset, schema_file)
    assert all(r.productName for r in records)
    assert all(r.sourceUrl == primos.SOURCE_URL for r in records)
