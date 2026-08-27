import json
from typing import Any

from django.http import HttpResponseBase
from django.test import Client

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


def get(client: Client, path: str) -> HttpResponseBase:
    return client.get(f"{BROWSER_CLIENT_BASE}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(client: Client, path: str, data: dict[str, Any]) -> HttpResponseBase:
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client: Client, path: str) -> HttpResponseBase:
    return client.delete(
        f"{BROWSER_CLIENT_BASE}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> HttpResponseBase:
    return get(client, "/auth/session")
