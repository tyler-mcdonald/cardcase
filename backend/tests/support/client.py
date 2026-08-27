import json
from typing import Any, Protocol

from django.test import Client

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


# Client.get/post/delete actually return django.test.client._MonkeyPatchedWSGIResponse,
# but that class is @type_check_only and can't be imported, so this is a structural
# stand-in covering only what tests actually use.
class TestResponse(Protocol):
    status_code: int

    def json(self) -> Any: ...
    def __getitem__(self, header: str) -> str: ...
    def __contains__(self, header: str) -> bool: ...


def get(client: Client, path: str) -> TestResponse:
    return client.get(f"{BROWSER_CLIENT_BASE}{path}")


def csrf_token(client: Client) -> str:
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(client: Client, path: str, data: dict[str, Any]) -> TestResponse:
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client: Client, path: str) -> TestResponse:
    return client.delete(
        f"{BROWSER_CLIENT_BASE}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client: Client) -> TestResponse:
    return get(client, "/auth/session")
