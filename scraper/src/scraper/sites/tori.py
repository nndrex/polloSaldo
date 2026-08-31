from __future__ import annotations

import re

from ..models import Item, Price

RESTAURANT = "tori"
SOURCE_URL = "https://www.tori.pe/carta-delivery"

_SECTION_RE = re.compile(r'menu-section-title">\s*(?P<section>[^<]+?)\s*<')
_ITEM_RE = re.compile(
    r'menu-item-title">\s*(?P<name>[^<]+?)\s*</div>.{0,1500}?'
    r'class="currency-sign">[^<]*</span>\s*(?P<price>[0-9]+(?:\.[0-9]+)?)',
    re.S,
)

CANONICAL_PRODUCTS = {
    ("1 POLLO", "POLLO TORI"): "pollo-entero",
    ("1/2 POLLO", "1/2 DÚO PERFECTO"): "medio-pollo",
    ("1/4 DE POLLO", "1/4 DÚO PERFECTO"): "cuarto-pollo",
}


def parse_items(html: str) -> list[tuple[str, Item]]:
    sections = _SECTION_RE.finditer(html)
    section_spans = [(m.group("section").strip(), m.end()) for m in sections]
    section_spans.append(("", len(html)))
    results: list[tuple[str, Item]] = []
    seen: set[tuple[str, str]] = set()
    for (section, start), (_, end) in zip(section_spans, section_spans[1:]):
        for match in _ITEM_RE.finditer(html, start, end):
            name = match.group("name").strip()
            key = (section, name)
            if key in seen:
                continue
            seen.add(key)
            results.append((section, Item(name=name, price=float(match.group("price")))))
    return results


def to_records(items: list[tuple[str, Item]], now: str, source_url: str = SOURCE_URL) -> list[Price]:
    records = []
    for section, item in items:
        product = CANONICAL_PRODUCTS.get((section.upper(), item.name.upper()))
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
