import json

import pytest
from django.core import mail

from users.adapter import AccountAdapter
from users.checks import check_frontend_url_configured_for_signup
from users.models import User

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"
NEW_USER_EMAIL = "new@example.com"


@pytest.mark.parametrize(
    ("allow_signup", "expected"),
    [
        (True, True),
        (False, False),
    ],
)
def test_open_for_signup_reflects_allow_signup_flag(settings, allow_signup, expected):
    settings.ALLOW_SIGNUP = allow_signup
    assert AccountAdapter().is_open_for_signup(None) is expected


def test_check_flags_signup_open_with_placeholder_frontend_url(settings):
    settings.ALLOW_SIGNUP = True
    settings.FRONTEND_URL = "http://localhost:3000"

    errors = check_frontend_url_configured_for_signup(None)

    assert [e.id for e in errors] == ["users.E001"]


@pytest.mark.parametrize(
    ("allow_signup", "frontend_url"),
    [
        (False, "http://localhost:3000"),
        (True, "https://app.cardcase.example"),
    ],
)
def test_check_passes_when_signup_disabled_or_frontend_url_configured(
    settings, allow_signup, frontend_url
):
    settings.ALLOW_SIGNUP = allow_signup
    settings.FRONTEND_URL = frontend_url

    assert check_frontend_url_configured_for_signup(None) == []


def _get(client, path):
    return client.get(f"{BROWSER_CLIENT_BASE}{path}")


def _csrf_token(client):
    if "csrftoken" not in client.cookies:
        _get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def _post(client, path, data):
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=_csrf_token(client),
    )


def _delete(client, path):
    return client.delete(
        f"{BROWSER_CLIENT_BASE}{path}",
        HTTP_X_CSRFTOKEN=_csrf_token(client),
    )


def _get_session(client):
    return _get(client, "/auth/session")


def _logout(client):
    return _delete(client, "/auth/session")


def _request_code(client, email):
    return _post(client, "/auth/code/request", {"email": email})


def _confirm_code(client, code):
    return _post(client, "/auth/code/confirm", {"code": code})


def _request_and_confirm_code(client, email):
    _request_code(client, email)
    code = mail.outbox[-1].body.split("\n\n")[2].strip()
    return _confirm_code(client, code)


def _signup(client, email, **extra):
    return _post(client, "/auth/signup", {"email": email, **extra})


def _new_user_exists():
    return User.objects.filter(email=NEW_USER_EMAIL).exists()


@pytest.fixture
def existing_user(db):
    return User.objects.create_user(email="existing@example.com")


@pytest.mark.django_db
@pytest.mark.parametrize("headers", [{}, {"HTTP_X_CSRFTOKEN": "not-a-real-token"}])
def test_post_without_valid_csrf_token_is_rejected(client, headers):
    _get_session(client)

    response = client.post(
        f"{BROWSER_CLIENT_BASE}/auth/code/request",
        data=json.dumps({"email": NEW_USER_EMAIL}),
        content_type="application/json",
        **headers,
    )

    assert response.status_code == 403
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_request_code_for_unknown_email_does_not_create_user_or_send_code(client):
    response = _request_code(client, NEW_USER_EMAIL)

    assert not _new_user_exists()
    assert len(mail.outbox) == 1
    assert "code" not in mail.outbox[0].body.lower()
    assert response.status_code == 401


@pytest.mark.django_db
def test_request_and_confirm_code_for_existing_user_creates_session(
    client, existing_user
):
    response = _request_and_confirm_code(client, existing_user.email)

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["user"]["id"]


@pytest.mark.django_db
def test_signup_endpoint_forbidden_when_signup_disabled(client, settings):
    settings.ALLOW_SIGNUP = False

    response = _signup(client, NEW_USER_EMAIL, password="a-strong-password-123")

    assert response.status_code == 403
    assert not _new_user_exists()


@pytest.mark.django_db
def test_signup_endpoint_creates_user_when_signup_enabled(client, settings):
    settings.ALLOW_SIGNUP = True

    response = _signup(client, NEW_USER_EMAIL)

    assert response.status_code == 200
    assert _new_user_exists()


@pytest.mark.django_db
def test_logout_invalidates_the_session(client, existing_user):
    _request_and_confirm_code(client, existing_user.email)
    assert _get_session(client).status_code == 200

    response = _logout(client)

    assert response.status_code == 401
    assert response.json()["meta"]["is_authenticated"] is False
    assert _get_session(client).status_code == 401


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path",
    [
        "/auth/password/request",
        "/auth/password/reset",
        "/auth/login",
        "/auth/phone/verify",
        "/auth/phone/verify/resend",
        "/auth/reauthenticate",
        "/auth/email/verify",
        "/auth/email/verify/resend",
        "/account/password/change",
        "/account/email",
        "/account/phone",
        "/tokens/refresh",
        "/config",
    ],
)
def test_unused_headless_routes_are_not_exposed(client, path):
    assert _get(client, path).status_code == 404


@pytest.mark.django_db
def test_app_client_is_not_mounted(client):
    response = client.get("/_allauth/app/v1/auth/session")

    assert response.status_code == 404


@pytest.mark.django_db
def test_django_admin_is_not_mounted(client):
    response = client.get("/admin/")

    assert response.status_code == 404
