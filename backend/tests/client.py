import json
from typing import Any

from django.http import HttpResponseBase
from django.test import Client

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


def get(client: Client, path: str, base: str = BROWSER_CLIENT_BASE) -> HttpResponseBase:
    return client.get(f"{base}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(
    client: Client, path: str, data: dict[str, Any], base: str = BROWSER_CLIENT_BASE
) -> HttpResponseBase:
    return client.post(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def patch(
    client: Client, path: str, data: dict[str, Any], base: str = BROWSER_CLIENT_BASE
) -> HttpResponseBase:
    return client.patch(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(
    client: Client, path: str, base: str = BROWSER_CLIENT_BASE
) -> HttpResponseBase:
    return client.delete(
        f"{base}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> HttpResponseBase:
    return get(client, "/auth/session")
