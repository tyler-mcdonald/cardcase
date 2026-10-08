import re

import pytest
from allauth.account.models import EmailAddress
from django.core import mail
from django.core.management import CommandError, call_command
from django.test import Client
from pytest_django import Settings

from tests.client import AUTH_BASE, get_session, scoped
from users.models import User

EMAIL = "admin@example.com"
CODE_PATTERN = re.compile(r"\d{6}")

auth = scoped(AUTH_BASE)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def superuser_email(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", EMAIL)
    monkeypatch.delenv("DJANGO_SUPERUSER_PASSWORD", raising=False)


def test_ensure_superuser_creates_passwordless_superuser() -> None:
    call_command("ensure_superuser")

    user = User.objects.get(email=EMAIL)
    assert user.is_staff
    assert user.is_superuser
    assert not user.has_usable_password()
    assert EmailAddress.objects.filter(
        user=user, email=EMAIL, verified=True, primary=True
    ).exists()


def test_ensure_superuser_skips_when_email_unset(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DJANGO_SUPERUSER_EMAIL")

    call_command("ensure_superuser")

    assert not User.objects.exists()


def test_ensure_superuser_is_idempotent() -> None:
    call_command("ensure_superuser")
    call_command("ensure_superuser")

    assert User.objects.count() == 1


def test_ensure_superuser_matches_existing_superuser_case_insensitively(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    call_command("ensure_superuser")
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", EMAIL.upper())

    call_command("ensure_superuser")

    assert User.objects.count() == 1


def test_ensure_superuser_refuses_to_promote_regular_user() -> None:
    User.objects.create_user(email=EMAIL)

    with pytest.raises(CommandError):
        call_command("ensure_superuser")

    user = User.objects.get(email=EMAIL)
    assert not user.is_staff
    assert not user.is_superuser


def test_ensure_superuser_rejects_invalid_email(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "not-an-email")

    with pytest.raises(CommandError):
        call_command("ensure_superuser")

    assert not User.objects.exists()


def test_superuser_can_log_in_by_code_with_signup_closed(
    client: Client, settings: Settings
) -> None:
    settings.ALLOW_SIGNUP = False
    call_command("ensure_superuser")

    auth.post(client, "/auth/code/request", {"email": EMAIL})
    match = CODE_PATTERN.search(str(mail.outbox[-1].body))
    assert match is not None
    auth.post(client, "/auth/code/confirm", {"code": match.group()})

    assert get_session(client).status_code == 200
