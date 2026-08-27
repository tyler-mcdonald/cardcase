import json

import pytest
from django.core import mail

from tests.client import BROWSER_CLIENT_BASE, csrf_token, get_session

REQUEST_EMAIL = "new@example.com"


def _post_with_origin(client, path, data, origin):
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
        HTTP_ORIGIN=origin,
    )


@pytest.mark.django_db
@pytest.mark.parametrize("headers", [{}, {"HTTP_X_CSRFTOKEN": "not-a-real-token"}])
def test_post_without_valid_csrf_token_is_rejected(client, headers):
    get_session(client)

    response = client.post(
        f"{BROWSER_CLIENT_BASE}/auth/code/request",
        data=json.dumps({"email": REQUEST_EMAIL}),
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 403
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_post_from_untrusted_origin_is_rejected(client):
    get_session(client)

    response = _post_with_origin(
        client, "/auth/code/request", {"email": REQUEST_EMAIL}, "https://evil.example"
    )

    assert response.status_code == 403
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_post_from_frontend_origin_is_accepted(client, settings):
    response = _post_with_origin(
        client, "/auth/code/request", {"email": REQUEST_EMAIL}, settings.FRONTEND_URL
    )

    assert response.status_code == 401
    assert len(mail.outbox) == 1


@pytest.mark.django_db
def test_cors_preflight_allows_frontend_origin(client, settings):
    response = client.options(
        f"{BROWSER_CLIENT_BASE}/auth/code/request",
        HTTP_ORIGIN=settings.FRONTEND_URL,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="x-csrftoken",
    )

    assert response["Access-Control-Allow-Origin"] == settings.FRONTEND_URL
    assert response["Access-Control-Allow-Credentials"] == "true"


@pytest.mark.django_db
def test_cors_preflight_from_untrusted_origin_gets_no_cors_headers(client):
    response = client.options(
        f"{BROWSER_CLIENT_BASE}/auth/code/request",
        HTTP_ORIGIN="https://evil.example",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="x-csrftoken",
    )

    assert "Access-Control-Allow-Origin" not in response
