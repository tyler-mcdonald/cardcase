from __future__ import annotations

import json
from typing import TYPE_CHECKING, Any

import pytest
from django.core import mail
from django.test import Client
from pytest_django import Settings

from tests.client import BROWSER_CLIENT_BASE, csrf_token, get_session

if TYPE_CHECKING:
    from django.test.client import _MonkeyPatchedWSGIResponse as ClientResponse

MUTATING_ENDPOINT = "/auth/code/request"
REQUEST_EMAIL = "new@example.com"
UNTRUSTED_ORIGIN = "https://malicious.example"


def _post_with_origin(client: Client, origin: str, **headers: Any) -> ClientResponse:
    return client.post(
        f"{BROWSER_CLIENT_BASE}{MUTATING_ENDPOINT}",
        data=json.dumps({"email": REQUEST_EMAIL}),
        content_type="application/json",
        HTTP_ORIGIN=origin,
        **headers,
    )


def _preflight(client: Client, origin: str) -> ClientResponse:
    return client.options(
        f"{BROWSER_CLIENT_BASE}{MUTATING_ENDPOINT}",
        HTTP_ORIGIN=origin,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="x-csrftoken",
    )


@pytest.mark.parametrize("headers", [{}, {"HTTP_X_CSRFTOKEN": "not-a-real-token"}])
def test_post_without_valid_csrf_token_is_rejected(
    client: Client, headers: dict[str, Any]
) -> None:
    get_session(client)

    response = client.post(
        f"{BROWSER_CLIENT_BASE}{MUTATING_ENDPOINT}",
        data=json.dumps({"email": REQUEST_EMAIL}),
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 403
    assert len(mail.outbox) == 0


def test_post_from_untrusted_origin_is_rejected(client: Client) -> None:
    response = _post_with_origin(
        client, UNTRUSTED_ORIGIN, HTTP_X_CSRFTOKEN=csrf_token(client)
    )

    assert response.status_code == 403
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_post_from_frontend_origin_is_accepted(
    client: Client, settings: Settings
) -> None:
    response = _post_with_origin(
        client, settings.FRONTEND_URL, HTTP_X_CSRFTOKEN=csrf_token(client)
    )

    assert response.status_code == 401
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_cors_headers_present_on_actual_response_for_frontend_origin(
    client: Client, settings: Settings
) -> None:
    response = _post_with_origin(
        client, settings.FRONTEND_URL, HTTP_X_CSRFTOKEN=csrf_token(client)
    )

    assert response["Access-Control-Allow-Origin"] == settings.FRONTEND_URL
    assert response["Access-Control-Allow-Credentials"] == "true"


def test_cors_preflight_allows_frontend_origin(
    client: Client, settings: Settings
) -> None:
    response = _preflight(client, settings.FRONTEND_URL)

    assert response["Access-Control-Allow-Origin"] == settings.FRONTEND_URL
    assert response["Access-Control-Allow-Credentials"] == "true"


def test_cors_preflight_from_untrusted_origin_gets_no_cors_headers(
    client: Client,
) -> None:
    response = _preflight(client, UNTRUSTED_ORIGIN)

    assert "Access-Control-Allow-Origin" not in response
