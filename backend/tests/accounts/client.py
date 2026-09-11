from typing import Any

from django.http import HttpResponseBase
from django.test import Client

from tests import client as base_client

BASE = "/v1"


def get(client: Client, path: str) -> HttpResponseBase:
    return base_client.get(client, path, base=BASE)


def post(client: Client, path: str, data: dict[str, Any]) -> HttpResponseBase:
    return base_client.post(client, path, data, base=BASE)


def patch(client: Client, path: str, data: dict[str, Any]) -> HttpResponseBase:
    return base_client.patch(client, path, data, base=BASE)


def delete(client: Client, path: str) -> HttpResponseBase:
    return base_client.delete(client, path, base=BASE)
