import re
from datetime import timedelta
from typing import Any

import pytest
import time_machine
from allauth.account import app_settings as allauth_settings
from allauth.account.models import EmailAddress
from django.core import mail
from django.core.mail import EmailMessage
from django.db import IntegrityError
from django.http import HttpRequest
from django.test import Client
from pytest_django import Settings

from tests.client import AUTH_BASE, ApiResponse, get_session, scoped
from users.adapter import AccountAdapter
from users.checks import check_frontend_url_configured_for_signup
from users.models import User

_client = scoped(AUTH_BASE)
get = _client.get
post = _client.post
delete = _client.delete

NEW_USER_EMAIL = "new@example.com"
CODE_PATTERN = re.compile(r"\d{6}|[A-Z0-9]{4}-[A-Z0-9]{4}")

# allauth hardcodes the confirm_email rate limit to "1/10s/key" when
# EMAIL_VERIFICATION_BY_CODE_ENABLED is True; it isn't exposed as a
# named Django setting we can read, so this mirrors that internal value.
EMAIL_VERIFICATION_RESEND_RATE_LIMIT_SECONDS = 10


@pytest.mark.parametrize(
    ("allow_signup", "expected"),
    [
        (True, True),
        (False, False),
    ],
)
def test_open_for_signup_reflects_allow_signup_flag(
    settings: Settings, allow_signup: bool, expected: bool
) -> None:
    settings.ALLOW_SIGNUP = allow_signup
    assert AccountAdapter().is_open_for_signup(HttpRequest()) is expected


def test_check_flags_signup_open_with_placeholder_frontend_url(
    settings: Settings,
) -> None:
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
    settings: Settings, allow_signup: bool, frontend_url: str
) -> None:
    settings.ALLOW_SIGNUP = allow_signup
    settings.FRONTEND_URL = frontend_url

    assert check_frontend_url_configured_for_signup(None) == []


def _logout(client: Client) -> ApiResponse:
    return delete(client, "/auth/session")


def _request_code(client: Client, email: str) -> ApiResponse:
    return post(client, "/auth/code/request", {"email": email})


def _resend_code(client: Client) -> ApiResponse:
    return post(client, "/auth/code/resend", {})


def _confirm_code(client: Client, code: str) -> ApiResponse:
    return post(client, "/auth/code/confirm", {"code": code})


def _extract_code_from_email() -> str:
    match = CODE_PATTERN.search(str(mail.outbox[-1].body))
    assert match is not None
    return match.group()


def _has_code(message: EmailMessage) -> bool:
    return CODE_PATTERN.search(str(message.body)) is not None


def _is_welcome_email(message: EmailMessage) -> bool:
    return "Confirm" in message.subject


def _login(client: Client, email: str) -> ApiResponse:
    _request_code(client, email)
    return _confirm_code(client, _extract_code_from_email())


def _signup(client: Client, email: str, **extra: Any) -> ApiResponse:
    return post(client, "/auth/signup", {"email": email, **extra})


def _verify_email(client: Client, key: str) -> ApiResponse:
    return post(client, "/auth/email/verify", {"key": key})


def _resend_email_verification(client: Client) -> ApiResponse:
    return post(client, "/auth/email/verify/resend", {})


def _signup_and_verify(client: Client, email: str) -> ApiResponse:
    _signup(client, email)
    return _verify_email(client, _extract_code_from_email())


def _new_user_exists() -> bool:
    return User.objects.filter(email=NEW_USER_EMAIL).exists()


@pytest.fixture
def existing_user(db: None) -> User:
    user = User.objects.create_user(email="existing@example.com")
    EmailAddress.objects.create(
        user=user, email=user.email, verified=True, primary=True
    )
    return user


@pytest.mark.django_db
def test_request_code_for_unknown_email_does_not_create_user_or_send_code_when_signup_disabled(
    client: Client, settings: Settings
) -> None:
    settings.ALLOW_SIGNUP = False

    response = _request_code(client, NEW_USER_EMAIL)

    assert not _new_user_exists()
    assert len(mail.outbox) == 1
    assert "code" not in mail.outbox[0].body.lower()
    assert response.status_code == 401


@pytest.mark.django_db
def test_request_code_for_new_email_creates_unverified_user_and_sends_welcome_code(
    client: Client,
) -> None:
    response = _request_code(client, NEW_USER_EMAIL)

    assert response.status_code == 401
    assert _new_user_exists()
    assert not EmailAddress.objects.get(email=NEW_USER_EMAIL).verified
    assert len(mail.outbox) == 1
    assert _is_welcome_email(mail.outbox[0])
    assert _has_code(mail.outbox[0])


@pytest.mark.django_db
def test_confirming_code_for_new_email_verifies_email_and_creates_session(
    client: Client,
) -> None:
    response = _login(client, NEW_USER_EMAIL)

    assert response.status_code == 200
    assert response.json()["meta"]["is_authenticated"] is True
    assert EmailAddress.objects.get(email=NEW_USER_EMAIL).verified


@pytest.mark.django_db
def test_resending_code_for_new_email_sends_welcome_email(client: Client) -> None:
    _request_code(client, NEW_USER_EMAIL)

    _resend_code(client)

    assert len(mail.outbox) == 2
    assert _is_welcome_email(mail.outbox[-1])


@pytest.mark.django_db
def test_existing_user_gets_login_code_email(
    client: Client, existing_user: User
) -> None:
    _request_code(client, existing_user.email)

    assert len(mail.outbox) == 1
    assert not _is_welcome_email(mail.outbox[0])


@pytest.mark.django_db
def test_request_code_response_is_the_same_for_new_and_existing_emails(
    client: Client, other_client: Client, existing_user: User
) -> None:
    new_user_response = _request_code(client, NEW_USER_EMAIL)
    existing_user_response = _request_code(other_client, existing_user.email)

    assert new_user_response.status_code == existing_user_response.status_code
    assert new_user_response.json() == existing_user_response.json()


@pytest.mark.django_db
def test_code_requests_for_new_email_are_rate_limited(client: Client) -> None:
    for _ in range(3):
        _request_code(client, NEW_USER_EMAIL)

    response = _request_code(client, NEW_USER_EMAIL)

    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "too_many_login_attempts"
    assert User.objects.filter(email=NEW_USER_EMAIL).count() == 1


@pytest.mark.django_db
def test_request_code_for_deactivated_user_matches_new_email_response(
    client: Client, other_client: Client, existing_user: User
) -> None:
    existing_user.is_active = False
    existing_user.save(update_fields=["is_active"])

    new_user_response = _request_code(client, NEW_USER_EMAIL)
    mail.outbox.clear()
    deactivated_user_response = _request_code(other_client, existing_user.email)

    assert deactivated_user_response.status_code == new_user_response.status_code
    assert deactivated_user_response.json() == new_user_response.json()
    assert User.objects.filter(email__iexact=existing_user.email).count() == 1
    assert not _has_code(mail.outbox[-1])


@pytest.mark.django_db
def test_request_code_logs_in_existing_user_matched_case_insensitively(
    client: Client,
) -> None:
    User.objects.create_user(email="Alice@example.com")

    _request_code(client, "alice@example.com")

    assert User.objects.filter(email__iexact="alice@example.com").count() == 1
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ["alice@example.com"]
    assert _has_code(mail.outbox[0])


@pytest.mark.django_db
def test_request_code_when_user_creation_races_sends_code_to_winning_user(
    client: Client, other_client: Client, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Two concurrent requests for the same new email can both find no user and
    both try to create one; the slower insert fails on the unique email. The
    losing request must still send a login code to the user the other request
    created, with the usual response, instead of erroring or sending nothing.
    """
    new_user_response = _request_code(client, NEW_USER_EMAIL)

    def raise_integrity_error(request: HttpRequest, email: str) -> User:
        # Simulate losing the race: the other request's user lands first.
        User.objects.create_user(email=email)
        raise IntegrityError

    monkeypatch.setattr("users.views._create_unverified_user", raise_integrity_error)
    raced_user_response = _request_code(other_client, "raced@example.com")

    assert raced_user_response.status_code == new_user_response.status_code
    assert raced_user_response.json() == new_user_response.json()
    assert mail.outbox[-1].to == ["raced@example.com"]
    assert _has_code(mail.outbox[-1])


@pytest.mark.django_db
def test_verified_user_gets_login_code_email_when_another_user_has_unverified_address(
    client: Client, existing_user: User
) -> None:
    other = User.objects.create_user(email="other@example.com")
    EmailAddress.objects.create(
        user=other, email=existing_user.email, verified=False, primary=False
    )

    _request_code(client, existing_user.email)

    assert len(mail.outbox) == 1
    assert not _is_welcome_email(mail.outbox[0])


@pytest.mark.django_db
def test_login_for_existing_user_creates_session(
    client: Client, existing_user: User
) -> None:
    response = _login(client, existing_user.email)

    assert response.status_code == 200
    payload = response.json()
    assert payload["data"]["user"]["id"]


@pytest.mark.django_db
def test_login_code_email_wording(client: Client, existing_user: User) -> None:
    _request_code(client, existing_user.email)

    message = mail.outbox[-1]
    code = _extract_code_from_email()
    assert message.subject == "Your cardcase login code"
    assert message.body == (
        "Your cardcase login code is:\n"
        "\n"
        f"{code}\n"
        "\n"
        "If you didn't try to log in, you can ignore this email."
    )


@pytest.mark.django_db
def test_requesting_code_while_authenticated_returns_current_session(
    client: Client, existing_user: User
) -> None:
    _login(client, existing_user.email)

    response = _request_code(client, existing_user.email)

    assert response.status_code == 200
    assert response.json()["meta"]["is_authenticated"] is True


@pytest.mark.django_db
def test_new_code_request_invalidates_previous_code(
    client: Client, existing_user: User
) -> None:
    _request_code(client, existing_user.email)
    stale_code = _extract_code_from_email()

    _request_code(client, existing_user.email)

    response = _confirm_code(client, stale_code)
    assert response.status_code == 400


@pytest.mark.django_db
def test_code_resend_issues_new_code_and_invalidates_previous(
    client: Client, existing_user: User
) -> None:
    _request_code(client, existing_user.email)
    stale_code = _extract_code_from_email()

    response = _resend_code(client)

    assert response.status_code == 200
    assert _extract_code_from_email() != stale_code
    assert _confirm_code(client, stale_code).status_code == 400


@pytest.mark.django_db
def test_fourth_code_request_in_one_minute_is_rate_limited(
    client: Client, existing_user: User
) -> None:
    for _ in range(3):
        _request_code(client, existing_user.email)

    response = _request_code(client, existing_user.email)

    assert response.status_code == 400
    assert response.json()["errors"][0]["code"] == "too_many_login_attempts"


@pytest.mark.django_db
def test_exceeding_max_login_attempts_locks_out_even_the_correct_code(
    client: Client, existing_user: User
) -> None:
    _request_code(client, existing_user.email)
    real_code = _extract_code_from_email()

    for _ in range(allauth_settings.LOGIN_BY_CODE_MAX_ATTEMPTS + 1):
        response = _confirm_code(client, "000000")

    assert response.status_code == 409
    assert _confirm_code(client, real_code).status_code == 409


@pytest.mark.django_db
def test_code_expires_after_timeout(client: Client, existing_user: User) -> None:
    _request_code(client, existing_user.email)
    code = _extract_code_from_email()

    with time_machine.travel(
        timedelta(seconds=allauth_settings.LOGIN_BY_CODE_TIMEOUT + 1), tick=True
    ):
        response = _confirm_code(client, code)

    assert response.status_code == 409
    assert get_session(client).status_code != 200


@pytest.mark.django_db
def test_signup_endpoint_forbidden_when_signup_disabled(
    client: Client, settings: Settings
) -> None:
    settings.ALLOW_SIGNUP = False

    response = _signup(client, NEW_USER_EMAIL, password="a-strong-password-123")

    assert response.status_code == 403
    assert not _new_user_exists()


@pytest.mark.django_db
def test_signup_endpoint_creates_unverified_user_pending_email_verification(
    client: Client,
) -> None:
    response = _signup(client, NEW_USER_EMAIL)

    assert response.status_code == 401
    assert _new_user_exists()
    assert not EmailAddress.objects.get(email=NEW_USER_EMAIL).verified
    flow_ids = [f["id"] for f in response.json()["data"]["flows"]]
    assert "verify_email" in flow_ids


@pytest.mark.django_db
def test_signup_verification_email_wording(client: Client) -> None:
    _signup(client, NEW_USER_EMAIL)

    message = mail.outbox[-1]
    code = _extract_code_from_email()
    assert message.subject == "Confirm your email for cardcase"
    assert message.body == (
        "Welcome to cardcase! Enter this code to finish creating your account:\n"
        "\n"
        f"{code}\n"
        "\n"
        "If you didn't sign up, you can ignore this email."
    )


@pytest.mark.django_db
def test_signup_then_verify_email_grants_session(client: Client) -> None:
    response = _signup_and_verify(client, NEW_USER_EMAIL)

    assert response.status_code == 200
    assert response.json()["meta"]["is_authenticated"] is True
    assert get_session(client).status_code == 200


@pytest.mark.django_db
def test_verify_email_with_wrong_code_is_rejected(client: Client) -> None:
    _signup(client, NEW_USER_EMAIL)

    response = _verify_email(client, "ZZZZ-ZZZZ")

    assert response.status_code == 400
    assert get_session(client).status_code == 401


@pytest.mark.django_db
def test_exceeding_max_verify_attempts_locks_out_even_the_correct_code(
    client: Client,
) -> None:
    _signup(client, NEW_USER_EMAIL)
    real_code = _extract_code_from_email()

    for _ in range(allauth_settings.EMAIL_VERIFICATION_BY_CODE_MAX_ATTEMPTS + 1):
        response = _verify_email(client, "ZZZZ-ZZZZ")

    assert response.status_code == 409
    assert _verify_email(client, real_code).status_code == 409


@pytest.mark.django_db
def test_resend_email_verification_issues_new_code_and_invalidates_previous(
    client: Client,
) -> None:
    _signup(client, NEW_USER_EMAIL)
    stale_code = _extract_code_from_email()

    with time_machine.travel(
        timedelta(seconds=EMAIL_VERIFICATION_RESEND_RATE_LIMIT_SECONDS + 1), tick=True
    ):
        response = _resend_email_verification(client)
        new_code = _extract_code_from_email()

        assert response.status_code == 200
        assert new_code != stale_code
        assert _verify_email(client, stale_code).status_code == 400


@pytest.mark.django_db
def test_logout_invalidates_the_session(client: Client, existing_user: User) -> None:
    _login(client, existing_user.email)
    assert get_session(client).status_code == 200

    response = _logout(client)

    assert response.status_code == 401
    assert response.json()["meta"]["is_authenticated"] is False
    assert get_session(client).status_code == 401


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
        "/account/password/change",
        "/account/email",
        "/account/phone",
        "/tokens/refresh",
        "/config",
    ],
)
def test_unused_headless_routes_are_not_exposed(client: Client, path: str) -> None:
    assert get(client, path).status_code == 404


@pytest.mark.django_db
def test_app_client_is_not_mounted(client: Client) -> None:
    response = client.get("/_allauth/app/v1/auth/session")

    assert response.status_code == 404


@pytest.mark.django_db
def test_django_admin_is_not_mounted(client: Client) -> None:
    response = client.get("/admin/")

    assert response.status_code == 404
