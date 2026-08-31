from __future__ import annotations

import json

from jsonschema import Draft7Validator, FormatChecker

from . import config


def load_schema(schema_file=None) -> dict:
    path = schema_file or config.SCHEMA_FILE
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def validate_dataset(dataset: dict, schema_file=None) -> None:
    schema = load_schema(schema_file)
    validator = Draft7Validator(schema, format_checker=FormatChecker())
    errors = sorted(validator.iter_errors(dataset), key=lambda e: list(e.path))
    if errors:
        messages = "; ".join(
            f"{'/'.join(str(p) for p in err.path) or '<root>'}: {err.message}"
            for err in errors
        )
        raise ValueError(f"dataset does not validate against prices.schema.json: {messages}")
