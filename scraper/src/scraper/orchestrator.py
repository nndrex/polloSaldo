from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from importlib import import_module

from . import config, schema
from .merge import merge

log = logging.getLogger(__name__)

ADAPTER_MODULE_NAMES = ["primos", "villa_chicken", "tori", "pardos"]


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_existing(data_file) -> dict | None:
    if not os.path.exists(data_file):
        return None
    try:
        with open(data_file, encoding="utf-8") as fh:
            data = json.load(fh)
    except (json.JSONDecodeError, OSError):
        log.warning("could not read existing %s; starting from empty dataset", data_file)
        return None
    if not isinstance(data, dict) or "prices" not in data:
        log.warning("existing %s has unexpected shape; starting from empty dataset", data_file)
        return None
    return data


def run(adapters=None, data_file=None, schema_file=None, now=None, client=None) -> int:
    from .http import make_client

    adapters = adapters or [import_module(f".sites.{name}", __package__) for name in ADAPTER_MODULE_NAMES]
    data_file = data_file or config.DATA_FILE
    now = now or utc_now_iso()
    owns_client = client is None
    client = client or make_client()
    try:
        results: dict[str, list[dict]] = {}
        for adapter in adapters:
            name = getattr(adapter, "RESTAURANT", None) or getattr(adapter, "__name__", "unknown")
            try:
                records = adapter.fetch(client, now)
                if not records:
                    raise RuntimeError(f"adapter returned no prices")
                results[name] = [record.to_record() for record in records]
                log.info("%s: %d prices", name, len(records))
            except Exception:
                log.exception("%s: adapter failed; continuing without it", name)

        if not results:
            log.error("all adapters failed; no snapshot written, %s untouched", data_file)
            return 1

        existing = load_existing(data_file)
        dataset = merge(existing, results, now)

        try:
            schema.validate_dataset(dataset, schema_file)
        except (ValueError, OSError) as exc:
            log.error("schema validation failed; no snapshot written: %s", exc)
            return 2

        os.makedirs(os.path.dirname(data_file), exist_ok=True)
        tmp_file = f"{data_file}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as fh:
            json.dump(dataset, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        os.replace(tmp_file, data_file)
        log.info("wrote %s (%d prices, updatedAt=%s)", data_file, len(dataset["prices"]), now)
        return 0
    finally:
        if owns_client:
            client.close()


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    return run()


if __name__ == "__main__":
    raise SystemExit(main())
