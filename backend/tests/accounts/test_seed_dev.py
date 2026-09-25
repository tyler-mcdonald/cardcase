import re
from datetime import date

import pytest
import time_machine
from django.core import mail
from django.core.management import CommandError, call_command
from django.test import Client
from pytest_django import Settings

from accounts.models import Account
from tests.client import AUTH_BASE, get_session, scoped
from users.models import User

EMAIL = "dev@example.com"
CODE_PATTERN = re.compile(r"\d{6}")

auth = scoped(AUTH_BASE)


@pytest.fixture
def debug(settings: Settings) -> None:
    settings.DEBUG = True


@pytest.mark.django_db
@pytest.mark.usefixtures("debug")
@time_machine.travel(date(2026, 6, 15))
def test_seed_dev_creates_user_and_accounts() -> None:
    call_command("seed_dev", email=EMAIL)

    user = User.objects.get(email=EMAIL)
    accounts = {account.name: account for account in Account.objects.filter(user=user)}
    assert set(accounts) == {"Amazon", "Delta", "Starbucks"}

    assert accounts["Amazon"].type == Account.Type.GIFT_CARD
    assert accounts["Amazon"].expires_on is None
    assert accounts["Amazon"].description

    assert accounts["Delta"].type == Account.Type.FLIGHT_CREDIT
    assert accounts["Delta"].expires_on == date(2027, 6, 15)

    assert accounts["Starbucks"].type == Account.Type.GIFT_CARD
    assert accounts["Starbucks"].expires_on == date(2026, 5, 16)


@pytest.mark.django_db
@pytest.mark.usefixtures("debug")
def test_seed_dev_uses_existing_user(user: User) -> None:
    call_command("seed_dev", email=user.email)

    assert User.objects.count() == 1
    assert Account.objects.filter(user=user).count() == 3


@pytest.mark.django_db
@pytest.mark.usefixtures("debug")
def test_seed_dev_is_idempotent() -> None:
    call_command("seed_dev", email=EMAIL)
    call_command("seed_dev", email=EMAIL)

    assert User.objects.count() == 1
    assert Account.objects.count() == 3


@pytest.mark.django_db
def test_seed_dev_requires_debug(settings: Settings) -> None:
    settings.DEBUG = False

    with pytest.raises(CommandError):
        call_command("seed_dev", email=EMAIL)

    assert not User.objects.exists()


@pytest.mark.django_db
@pytest.mark.usefixtures("debug")
def test_seed_dev_user_can_log_in_by_code(client: Client) -> None:
    call_command("seed_dev", email=EMAIL)

    auth.post(client, "/auth/code/request", {"email": EMAIL})
    match = CODE_PATTERN.search(str(mail.outbox[-1].body))
    assert match is not None
    auth.post(client, "/auth/code/confirm", {"code": match.group()})

    assert get_session(client).status_code == 200
