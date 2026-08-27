from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

from django.test import Client

if TYPE_CHECKING:
    from django.test.client import _MonkeyPatchedWSGIResponse as ClientResponse

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


def get(client: Client, path: str) -> ClientResponse:
    return client.get(f"{BROWSER_CLIENT_BASE}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(client: Client, path: str, data: dict[str, Any]) -> ClientResponse:
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client: Client, path: str) -> ClientResponse:
    return client.delete(
        f"{BROWSER_CLIENT_BASE}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> ClientResponse:
    return get(client, "/auth/session")
