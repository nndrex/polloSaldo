from __future__ import annotations

import json

from ..models import Item, Price

RESTAURANT = "pardos"
SOURCE_URL = "https://www.pardoschicken.pe/categorias/pardos-brasa"
API_BASE = "https://api.pardoschicken.pe/api/v2/categories"
ACCEPT_HEADER = "application/vnd.pardos.v2+json"
DEFAULT_ESTABLISHMENT_UUID = "07accaf0-b8fa-11e7-bc6a-e5b83cb342d2"
DEFAULT_CHANNEL_ID = 1
CATEGORY_SLUGS = ("1-pardos-brasa", "12-pardos-brasa", "14-pardos-brasa")

CANONICAL_PRODUCTS = {
    "1-pardos-brasa": {
        "1 Pardos Brasa": "pollo-entero",
    },
    "12-pardos-brasa": {
        "1/2 Pardos Brasa con una porción de papas fritas personal y guarnición de ensalada Pardos": "medio-pollo",
    },
    "14-pardos-brasa": {
        "1/4 Pardos Brasa con papas fritas o doradas y guarnición de ensalada Pardos": "cuarto-pollo",
    },
}


def parse_items(payload: str | dict) -> list[tuple[str, Item]]:
    data = json.loads(payload) if isinstance(payload, str) else payload
    results: list[tuple[str, Item]] = []
    seen: set[tuple[str, str]] = set()
    for slug in CATEGORY_SLUGS:
        response = data.get(slug, data)
        for category in response.get("data", []) if isinstance(response, dict) else []:
            for product in category.get("products") or []:
                name = str(product.get("name", "")).strip()
                price = product.get("price")
                key = (slug, name)
                if not name or price is None or key in seen:
                    continue
                seen.add(key)
                results.append((slug, Item(name=name, price=float(price))))
    return results


def to_records(
    items: list[tuple[str, Item]], now: str, source_url: str = SOURCE_URL
) -> list[Price]:
    records = []
    for slug, item in items:
        product = CANONICAL_PRODUCTS.get(slug, {}).get(item.name)
        if product is None:
            continue
        records.append(
            Price(
                restaurant=RESTAURANT,
                product=product,
                productName=item.name,
                price=item.price,
                currency="PEN",
                scrapedAt=now,
                sourceUrl=source_url,
            )
        )
    return records


def parse(payload: str | dict, now: str) -> list[Price]:
    return to_records(parse_items(payload), now)


def fetch(client, now: str) -> list[Price]:
    payloads: dict = {}
    for slug in CATEGORY_SLUGS:
        url = f"{API_BASE}/{slug}/establishments/{DEFAULT_ESTABLISHMENT_UUID}/channels/{DEFAULT_CHANNEL_ID}/products"
        response = client.get(url, headers={"Accept": ACCEPT_HEADER})
        response.raise_for_status()
        payloads[slug] = response.json()
    return parse(payloads, now)
