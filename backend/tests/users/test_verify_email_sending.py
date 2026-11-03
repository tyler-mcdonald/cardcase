from typing import Any

import pytest
from django.core import mail
from django.core.mail.backends.locmem import EmailBackend
from django.core.management import CommandError, call_command
from pytest_django import Settings

from users.management.commands.verify_email_sending import DEFAULT_RECIPIENT


def test_verify_email_sending_sends_from_default_address(settings: Settings) -> None:
    call_command("verify_email_sending")

    assert len(mail.outbox) == 1
    assert mail.outbox[0].from_email == settings.DEFAULT_FROM_EMAIL
    assert mail.outbox[0].to == [DEFAULT_RECIPIENT]


def test_verify_email_sending_sends_to_override_address() -> None:
    call_command("verify_email_sending", to="someone@example.com")

    assert mail.outbox[0].to == ["someone@example.com"]


def test_verify_email_sending_raises_when_send_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    def fail(self: EmailBackend, messages: Any) -> int:
        raise RuntimeError("domain not verified")

    monkeypatch.setattr(EmailBackend, "send_messages", fail)

    with pytest.raises(CommandError, match="domain not verified"):
        call_command("verify_email_sending")


def test_verify_email_sending_raises_when_nothing_sent(monkeypatch: pytest.MonkeyPatch) -> None:
    def send_none(self: EmailBackend, messages: Any) -> int:
        return 0

    monkeypatch.setattr(EmailBackend, "send_messages", send_none)

    with pytest.raises(CommandError, match="Failed to send email"):
        call_command("verify_email_sending")
