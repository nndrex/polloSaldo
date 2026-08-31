from __future__ import annotations

import httpx

from . import config


def make_client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": config.USER_AGENT},
        timeout=config.HTTP_TIMEOUT_SECONDS,
        follow_redirects=True,
    )
