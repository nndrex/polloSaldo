from __future__ import annotations


def merge(existing: dict | None, results: dict[str, list[dict]], now: str) -> dict:
    by_key: dict[tuple[str, str], dict] = {}
    for entry in (existing or {}).get("prices", []):
        by_key[(entry["restaurant"], entry["product"])] = entry
    for restaurant, records in results.items():
        for record in records:
            fresh = dict(record)
            fresh["scrapedAt"] = now
            by_key[(restaurant, fresh["product"])] = fresh
    prices = sorted(by_key.values(), key=lambda r: (r["restaurant"], r["product"]))
    return {"version": 1, "updatedAt": now, "prices": prices}
