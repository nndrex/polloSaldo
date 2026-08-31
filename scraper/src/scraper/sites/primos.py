from __future__ import annotations

import re

from ..http import make_client
from ..models import Item, Price

RESTAURANT = "primos"
SOURCE_URL = "https://www.primoschickenbar.pe/carta"

_ITEM_RE = re.compile(
    r'data-framer-name="Nombre"[^>]*>\s*<p[^>]*>(?P<name>[^<]+)</p>.{0,3000}?'
    r'data-framer-name="Precio"[^>]*>\s*<p[^>]*>\s*S/\.\s*(?P<price>[0-9]+(?:\.[0-9]+)?)',
    re.S,
)

CANONICAL_PRODUCTS = {
    "1 Pollo + Papas fritas + Ensalada": "pollo-entero",
    "1/2 Pollo": "medio-pollo",
    "1/4 Pollo (Pecho)": "cuarto-pollo",
}


def parse_items(html: str) -> list[Item]:
    items: dict[str, Item] = {}
    for match in _ITEM_RE.finditer(html):
        name = match.group("name").strip()
        if name not in items:
            items[name] = Item(name=name, price=float(match.group("price")))
    return list(items.values())


def to_records(items: list[Item], now: str, source_url: str = SOURCE_URL) -> list[Price]:
    records = []
    for item in items:
        product = CANONICAL_PRODUCTS.get(item.name)
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


def parse(html: str, now: str) -> list[Price]:
    return to_records(parse_items(html), now)


def fetch(client, now: str) -> list[Price]:
    response = client.get(SOURCE_URL)
    response.raise_for_status()
    return parse(response.text, now)
