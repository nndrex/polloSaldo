from __future__ import annotations

from dataclasses import dataclass, asdict


@dataclass(frozen=True)
class Price:
    restaurant: str
    product: str
    productName: str
    price: float
    currency: str
    scrapedAt: str
    sourceUrl: str

    def to_record(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class Item:
    name: str
    price: float
