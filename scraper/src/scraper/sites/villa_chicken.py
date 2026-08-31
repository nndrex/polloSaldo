from __future__ import annotations

import json

from ..models import Item, Price

RESTAURANT = "villa-chicken"
CARTA_URL = "https://villachicken.com.pe/villaweb/carta"
API_URL = (
    "https://villachicken.com.pe/villaweb/Controller/Principal"
    "?p=Listar_Servicios_Inicio"
)

CANONICAL_PRODUCTS = {
    "1 POLLO + PAPAS GRANDES + ENSALADA CLASICA": "pollo-entero",
    "1/2 POLLO + PAPAS MEDIANAS + ENSALADA CLASICA": "medio-pollo",
    "1/4 POLLO + PAPAS REGULARES + ENSALADA CLASICA": "cuarto-pollo",
}


def parse_items(payload: str | dict) -> list[Item]:
    data = json.loads(payload) if isinstance(payload, str) else payload
    items: dict[str, Item] = {}

    def walk(node) -> None:
        if isinstance(node, dict):
            if node.get("type") == "paquetes" and "attributes" in node:
                attrs = node["attributes"]
                name = str(attrs.get("title", "")).strip()
                price = attrs.get("precion_base")
                if name and price is not None:
                    try:
                        items.setdefault(name, Item(name=name, price=float(price)))
                    except (TypeError, ValueError):
                        pass
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)

    walk(data)
    return list(items.values())


def to_records(items: list[Item], now: str, source_url: str = CARTA_URL) -> list[Price]:
    records = []
    for item in items:
        product = CANONICAL_PRODUCTS.get(item.name.upper())
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
    response = client.post(API_URL, data={"valor": "1"})
    response.raise_for_status()
    return parse(response.text, now)
