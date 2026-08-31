from __future__ import annotations

from scraper.merge import merge

NOW = "2026-08-29T13:00:00Z"


def record(restaurant, product, price, scraped_at="2026-08-01T00:00:00Z"):
    return {
        "restaurant": restaurant,
        "product": product,
        "productName": f"{restaurant} {product}",
        "price": price,
        "currency": "PEN",
        "scrapedAt": scraped_at,
        "sourceUrl": f"https://example.com/{restaurant}",
    }


def test_merge_with_no_existing_keeps_only_new():
    dataset = merge(None, {"primos": [record("primos", "pollo-entero", 89.0)]}, NOW)

    assert dataset["version"] == 1
    assert dataset["updatedAt"] == NOW
    assert [p["product"] for p in dataset["prices"]] == ["pollo-entero"]


def test_failed_restaurants_keep_stale_entries():
    existing = {
        "version": 1,
        "updatedAt": "2026-08-20T13:00:00Z",
        "prices": [
            record("villa-chicken", "pollo-entero", 69.9, "2026-08-20T13:00:00Z"),
            record("tori", "pollo-entero", 55.0, "2026-08-20T13:00:00Z"),
        ],
    }

    dataset = merge(existing, {"primos": [record("primos", "pollo-entero", 89.0)]}, NOW)

    stale = {p["restaurant"]: p for p in dataset["prices"]}
    assert stale["villa-chicken"]["scrapedAt"] == "2026-08-20T13:00:00Z"
    assert stale["villa-chicken"]["price"] == 69.9
    assert stale["tori"]["scrapedAt"] == "2026-08-20T13:00:00Z"
    assert dataset["updatedAt"] == NOW


def test_successful_restaurants_get_fresh_timestamp():
    existing = {
        "version": 1,
        "updatedAt": "2026-08-20T13:00:00Z",
        "prices": [record("primos", "pollo-entero", 79.0, "2026-08-20T13:00:00Z")],
    }

    dataset = merge(existing, {"primos": [record("primos", "pollo-entero", 89.0)]}, NOW)

    assert len(dataset["prices"]) == 1
    assert dataset["prices"][0]["price"] == 89.0
    assert dataset["prices"][0]["scrapedAt"] == NOW
