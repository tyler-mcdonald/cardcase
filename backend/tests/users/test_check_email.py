from typing import Any

import pytest
from django.core import mail
from django.core.mail.backends.locmem import EmailBackend
from django.core.management import CommandError, call_command
from pytest_django import Settings


def test_check_email_sends_from_default_address(settings: Settings) -> None:
    call_command("check_email")

    assert len(mail.outbox) == 1
    assert mail.outbox[0].from_email == settings.DEFAULT_FROM_EMAIL
    assert mail.outbox[0].to == ["delivered+build-check@resend.dev"]


def test_check_email_sends_to_override_address() -> None:
    call_command("check_email", to="someone@example.com")

    assert mail.outbox[0].to == ["someone@example.com"]


def test_check_email_raises_when_send_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail(self: EmailBackend, messages: Any) -> int:
        raise RuntimeError("domain not verified")

    monkeypatch.setattr(EmailBackend, "send_messages", fail)

    with pytest.raises(CommandError, match="domain not verified"):
        call_command("check_email")
