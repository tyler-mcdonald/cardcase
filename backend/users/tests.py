import json

import pytest
from django.core import mail

from users.adapter import AccountAdapter
from users.checks import check_frontend_url_configured_for_signup
from users.models import User


def test_open_for_signup_when_flag_enabled(settings):
    settings.ALLOW_SIGNUP = True
    assert AccountAdapter().is_open_for_signup(None) is True


def test_closed_for_signup_when_flag_disabled(settings):
    settings.ALLOW_SIGNUP = False
    assert AccountAdapter().is_open_for_signup(None) is False


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
def test_check_passes_otherwise(settings, allow_signup, frontend_url):
    settings.ALLOW_SIGNUP = allow_signup
    settings.FRONTEND_URL = frontend_url

    assert check_frontend_url_configured_for_signup(None) == []


def _post(client, path, data, session_token=None):
    extra = {}
    if session_token:
        extra["HTTP_X_SESSION_TOKEN"] = session_token
    return client.post(
        f"/_allauth/app/v1{path}",
        data=json.dumps(data),
        content_type="application/json",
        **extra,
    )


def _get(client, path, session_token=None):
    extra = {}
    if session_token:
        extra["HTTP_X_SESSION_TOKEN"] = session_token
    return client.get(f"/_allauth/app/v1{path}", **extra)


def _delete(client, path, session_token=None):
    extra = {}
    if session_token:
        extra["HTTP_X_SESSION_TOKEN"] = session_token
    return client.delete(f"/_allauth/app/v1{path}", **extra)


@pytest.fixture
def existing_user(db):
    return User.objects.create_user(email="existing@example.com")


def _request_and_confirm_code(client, email):
    request_response = _post(client, "/auth/code/request", {"email": email})
    session_token = request_response.json()["meta"]["session_token"]
    code = mail.outbox[-1].body.split("\n\n")[2].strip()

    return _post(
        client, "/auth/code/confirm", {"code": code}, session_token=session_token
    )


@pytest.mark.django_db
def test_request_code_for_unknown_email_does_not_create_user_or_send_code(client):
    response = _post(client, "/auth/code/request", {"email": "new@example.com"})

    assert not User.objects.filter(email="new@example.com").exists()
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
    assert "session_token" in payload["meta"]


@pytest.mark.django_db
def test_signup_endpoint_forbidden_when_signup_disabled(client, settings):
    settings.ALLOW_SIGNUP = False

    response = _post(
        client,
        "/auth/signup",
        {"email": "new@example.com", "password": "a-strong-password-123"},
    )

    assert response.status_code == 403
    assert not User.objects.filter(email="new@example.com").exists()


@pytest.mark.django_db
def test_logout_invalidates_the_session(client, existing_user):
    session_token = _request_and_confirm_code(client, existing_user.email).json()[
        "meta"
    ]["session_token"]
    assert _get(client, "/auth/session", session_token=session_token).status_code == 200

    response = _delete(client, "/auth/session", session_token=session_token)

    assert response.status_code == 401
    assert response.json()["meta"]["is_authenticated"] is False
    stale_response = _get(client, "/auth/session", session_token=session_token)
    assert stale_response.status_code == 410
