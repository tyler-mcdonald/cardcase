import json
from functools import partial
from typing import TYPE_CHECKING, Any

from django.test import Client

if TYPE_CHECKING:
    # The real object django.test.Client returns: a normal HttpResponse
    # with .json() monkey-patched on by Django's test client.
    from django.test.client import _MonkeyPatchedWSGIResponse as TestResponse
else:
    TestResponse = Any

AUTH_BASE = "/_allauth/browser/v1"


def _get(client: Client, path: str, base: str) -> TestResponse:
    return client.get(f"{base}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get_session(client)
    return client.cookies["csrftoken"].value


def _post(client: Client, path: str, data: dict[str, Any], base: str) -> TestResponse:
    return client.post(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def _patch(client: Client, path: str, data: dict[str, Any], base: str) -> TestResponse:
    return client.patch(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def _delete(client: Client, path: str, base: str) -> TestResponse:
    return client.delete(
        f"{base}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> TestResponse:
    return _get(client, "/auth/session", base=AUTH_BASE)


class ScopedClient:
    def __init__(self, base: str) -> None:
        self.get = partial(_get, base=base)
        self.post = partial(_post, base=base)
        self.patch = partial(_patch, base=base)
        self.delete = partial(_delete, base=base)


def scoped(base: str) -> ScopedClient:
    return ScopedClient(base)
