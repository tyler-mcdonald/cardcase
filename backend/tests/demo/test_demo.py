from datetime import timedelta

import pytest
import time_machine
from allauth.account.models import EmailAddress
from django.core import mail
from django.test import Client
from django.utils import timezone

from accounts.models import Account, Transaction
from demo.seed_data import create_verified_user
from demo.services import DEMO_EMAIL_DOMAIN, DEMO_LIFETIME
from tests.accounts.factories import create_account, create_transaction
from tests.client import AUTH_BASE, ApiResponse, get_session, scoped
from users.adapter import AccountAdapter
from users.models import User

pytestmark = pytest.mark.django_db

DEMO_START_RATE_LIMIT = 5

auth = scoped(AUTH_BASE)
api = scoped("/v1")


def _start(client: Client) -> ApiResponse:
    return api.post(client, "/demo/start", {})


def _demo_users() -> list[User]:
    return list(User.objects.filter(is_demo=True))


def _create_user(created_ago: timedelta, *, is_demo: bool = True) -> User:
    domain = DEMO_EMAIL_DOMAIN if is_demo else "example.com"
    with time_machine.travel(timezone.now() - created_ago, tick=False):
        return create_verified_user(
            f"user-{created_ago.total_seconds()}@{domain}", is_demo=is_demo
        )


def test_anonymous_start_creates_and_logs_in_seeded_demo_user(client: Client) -> None:
    response = _start(client)

    assert response.status_code == 204
    [user] = _demo_users()
    assert user.email.startswith("demo-")
    assert user.email.endswith(f"@{DEMO_EMAIL_DOMAIN}")
    assert EmailAddress.objects.filter(user=user, verified=True, primary=True).exists()
    assert Account.objects.filter(user=user).exists()
    assert Transaction.objects.filter(account__user=user).exists()
    session = get_session(client)
    assert session.status_code == 200
    assert session.json()["data"]["user"]["is_demo"] is True
    assert client.session.get_expiry_age() == DEMO_LIFETIME.total_seconds()


def test_start_as_demo_user_does_not_create_another(client: Client) -> None:
    _start(client)

    response = _start(client)

    assert response.status_code == 204
    assert len(_demo_users()) == 1


def test_start_as_real_user_is_conflict(auth_client: Client) -> None:
    response = _start(auth_client)

    assert response.status_code == 409
    assert _demo_users() == []


def test_start_requires_csrf_token(client: Client) -> None:
    get_session(client)

    response = client.post("/v1/demo/start", content_type="application/json")

    assert response.status_code == 403
    assert _demo_users() == []


def test_start_is_throttled_per_ip() -> None:
    for _ in range(DEMO_START_RATE_LIMIT):
        assert _start(Client(enforce_csrf_checks=True)).status_code == 204

    response = _start(Client(enforce_csrf_checks=True))

    assert response.status_code == 429
    assert len(_demo_users()) == DEMO_START_RATE_LIMIT


def test_start_deletes_only_expired_demo_users(client: Client) -> None:
    expired = _create_user(DEMO_LIFETIME + timedelta(minutes=1))
    user = _create_user(DEMO_LIFETIME * 2, is_demo=False)
    deleted_account = create_account(expired, name="Deleted")
    deleted_account.soft_delete()
    create_transaction(create_account(expired))
    create_transaction(deleted_account)
    fresh = _create_user(DEMO_LIFETIME - timedelta(minutes=1))
    create_transaction(create_account(user))

    _start(client)

    assert not User.objects.filter(pk=expired.pk).exists()
    assert not Account.all_objects.filter(user_id=expired.pk).exists()
    assert not Transaction.objects.filter(account__user_id=expired.pk).exists()
    assert User.objects.filter(pk=fresh.pk).exists()
    assert Transaction.objects.filter(account__user=user).exists()


def test_session_reports_real_user_is_not_demo(auth_client: Client) -> None:
    assert get_session(auth_client).json()["data"]["user"]["is_demo"] is False


def test_no_email_is_sent_to_demo_addresses() -> None:
    AccountAdapter().send_mail(
        "account/email/login_code",
        f"someone@{DEMO_EMAIL_DOMAIN}",
        {"code": "123456"},
    )

    assert mail.outbox == []


def test_login_code_request_for_demo_user_sends_no_email(client: Client) -> None:
    _start(Client(enforce_csrf_checks=True))
    [user] = _demo_users()

    auth.post(client, "/auth/code/request", {"email": user.email})

    assert mail.outbox == []
