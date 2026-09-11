import json
from typing import Any

from django.http import HttpResponseBase
from django.test import Client

from tests.client import csrf_token

BASE = "/v1"


def get(client: Client, path: str) -> HttpResponseBase:
    return client.get(f"{BASE}{path}")


def post(client: Client, path: str, data: dict[str, Any]) -> HttpResponseBase:
    return client.post(
        f"{BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def patch(client: Client, path: str, data: dict[str, Any]) -> HttpResponseBase:
    return client.patch(
        f"{BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client: Client, path: str) -> HttpResponseBase:
    return client.delete(
        f"{BASE}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )
