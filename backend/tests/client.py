import json
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from django.test import Client

if TYPE_CHECKING:
    # The real object django.test.Client returns: a normal HttpResponse
    # with .json() monkey-patched on by Django's test client.
    from django.test.client import _MonkeyPatchedWSGIResponse as TestResponse
else:
    TestResponse = Any

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


def get(client: Client, path: str, base: str = BROWSER_CLIENT_BASE) -> TestResponse:
    return client.get(f"{base}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(
    client: Client, path: str, data: dict[str, Any], base: str = BROWSER_CLIENT_BASE
) -> TestResponse:
    return client.post(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def patch(
    client: Client, path: str, data: dict[str, Any], base: str = BROWSER_CLIENT_BASE
) -> TestResponse:
    return client.patch(
        f"{base}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client: Client, path: str, base: str = BROWSER_CLIENT_BASE) -> TestResponse:
    return client.delete(
        f"{base}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> TestResponse:
    return get(client, "/auth/session")


@dataclass
class ScopedClient:
    base: str

    def get(self, client: Client, path: str) -> TestResponse:
        return get(client, path, base=self.base)

    def post(self, client: Client, path: str, data: dict[str, Any]) -> TestResponse:
        return post(client, path, data, base=self.base)

    def patch(self, client: Client, path: str, data: dict[str, Any]) -> TestResponse:
        return patch(client, path, data, base=self.base)

    def delete(self, client: Client, path: str) -> TestResponse:
        return delete(client, path, base=self.base)


def scoped(base: str) -> ScopedClient:
    return ScopedClient(base)
