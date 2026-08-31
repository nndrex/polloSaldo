from __future__ import annotations

import json
from types import SimpleNamespace

import pytest

from scraper import orchestrator

from conftest import NOW, prior_dataset


def adapter(name, fetch):
    return SimpleNamespace(RESTAURANT=name, fetch=fetch)


def ok(name, price):
    def fetch(client, now):
        from scraper.models import Price

        return [
            Price(
                restaurant=name,
                product="pollo-entero",
                productName=f"{name} entero",
                price=price,
                currency="PEN",
                scrapedAt=now,
                sourceUrl=f"https://example.com/{name}",
            )
        ]

    return adapter(name, fetch)


def boom(name):
    def fetch(client, now):
        raise RuntimeError("site down")

    return adapter(name, fetch)


class DummyClient:
    def close(self):
        pass


def test_all_adapters_fail_exits_nonzero_and_writes_nothing(tmp_path, write_data_file):
    data_file = write_data_file(prior_dataset())
    before = data_file.read_text(encoding="utf-8")

    exit_code = orchestrator.run(
        adapters=[boom("primos"), boom("villa-chicken"), boom("tori")],
        data_file=data_file,
        client=DummyClient(),
        now=NOW,
    )

    assert exit_code != 0
    assert data_file.read_text(encoding="utf-8") == before


def test_all_adapters_fail_no_file_created(tmp_path):
    data_file = tmp_path / "data" / "prices.json"

    exit_code = orchestrator.run(
        adapters=[boom("primos"), boom("villa-chicken"), boom("tori")],
        data_file=data_file,
        client=DummyClient(),
        now=NOW,
    )

    assert exit_code != 0
    assert not data_file.exists()


def test_partial_success_keeps_stale_and_updates_fresh(write_data_file):
    data_file = write_data_file(prior_dataset())
    old_stale = {p["restaurant"]: p for p in prior_dataset()["prices"]}

    exit_code = orchestrator.run(
        adapters=[ok("primos", 89.0), boom("villa-chicken"), boom("tori")],
        data_file=data_file,
        client=DummyClient(),
        now=NOW,
    )
    dataset = json.loads(data_file.read_text(encoding="utf-8"))

    assert exit_code == 0
    by_restaurant = {p["restaurant"]: p for p in dataset["prices"]}
    assert by_restaurant["primos"]["price"] == 89.0
    assert by_restaurant["primos"]["scrapedAt"] == NOW
    assert by_restaurant["villa-chicken"]["scrapedAt"] == old_stale["villa-chicken"]["scrapedAt"]
    assert by_restaurant["villa-chicken"]["price"] == old_stale["villa-chicken"]["price"]
    assert dataset["updatedAt"] == NOW


def test_invalid_record_makes_run_fail_without_writing(write_data_file):
    data_file = write_data_file(prior_dataset())
    before = data_file.read_text(encoding="utf-8")

    def bad_fetch(client, now):
        records = ok("primos", 89.0).fetch(client, now)
        broken = dict(records[0].to_record())
        broken["price"] = "89.0"
        return [SimpleNamespace(to_record=lambda b=broken: b)]

    exit_code = orchestrator.run(
        adapters=[adapter("primos", bad_fetch), boom("villa-chicken"), boom("tori")],
        data_file=data_file,
        client=DummyClient(),
        now=NOW,
    )

    assert exit_code != 0
    assert data_file.read_text(encoding="utf-8") == before


def test_merged_output_validates_against_repo_schema(write_data_file, schema_file):
    from scraper.schema import validate_dataset

    data_file = write_data_file(prior_dataset())

    exit_code = orchestrator.run(
        adapters=[ok("primos", 89.0), ok("villa-chicken", 78.2), ok("tori", 58.9)],
        data_file=data_file,
        schema_file=schema_file,
        client=DummyClient(),
        now=NOW,
    )
    dataset = json.loads(data_file.read_text(encoding="utf-8"))

    assert exit_code == 0
    validate_dataset(dataset, schema_file)


@pytest.mark.parametrize("value", [0, -1, 20000])
def test_price_bounds_enforced(value, write_data_file):
    data_file = write_data_file(prior_dataset())

    exit_code = orchestrator.run(
        adapters=[ok("primos", value), boom("villa-chicken"), boom("tori")],
        data_file=data_file,
        client=DummyClient(),
        now=NOW,
    )

    assert exit_code != 0
