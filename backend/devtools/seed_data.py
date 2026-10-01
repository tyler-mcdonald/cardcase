import random
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from allauth.account.models import EmailAddress
from django.utils import timezone

from accounts.models import Account, Transaction
from users.models import User


def sample_accounts(today: date) -> dict[str, dict[str, Any]]:
    return {
        "Amazon": {
            "type": Account.Type.GIFT_CARD,
            "description": "Birthday gift from Mom",
        },
        "Delta": {
            "type": Account.Type.FLIGHT_CREDIT,
            "expires_on": today + timedelta(days=365),
        },
        "Starbucks": {
            "type": Account.Type.GIFT_CARD,
            "expires_on": today - timedelta(days=30),
        },
    }


GENERATED_SPENDS_PER_ACCOUNT = 17


def sample_transactions(today: date) -> dict[str, list[tuple[str, str, date]]]:
    return {
        "Amazon": [
            ("100.00", "Birthday gift", today - timedelta(days=120)),
            ("-23.99", "Phone case", today - timedelta(days=60)),
            ("-12.49", "Kindle book", today - timedelta(days=7)),
        ],
        "Delta": [
            ("450.00", "Cancelled flight credit", today - timedelta(days=90)),
            ("-75.00", "Seat upgrade", today - timedelta(days=45)),
            ("-30.00", "Checked bag fee", today - timedelta(days=45)),
        ],
        "Starbucks": [
            ("50.00", "Gift card reload", today - timedelta(days=100)),
            ("-5.45", "Latte", today - timedelta(days=3)),
            ("-8.90", "Breakfast sandwich and coffee", today),
        ],
    }


def generated_spends(name: str, today: date) -> list[tuple[str, str, date]]:
    rng = random.Random(name)
    return [
        (
            str(-Decimal(rng.randint(100, 2000)) / 100),
            f"{name} purchase",
            today - timedelta(days=rng.randint(0, 120)),
        )
        for _ in range(GENERATED_SPENDS_PER_ACCOUNT)
    ]


def get_or_create_seed_user(email: str) -> User:
    return User.objects.filter(email=email).first() or _create_verified_user(email)


def seed_accounts(user: User) -> int:
    created_count = 0
    for name, defaults in sample_accounts(timezone.localdate()).items():
        _, created = Account.objects.get_or_create(
            user=user, name=name, defaults=defaults
        )
        created_count += created
    return created_count


def seed_transactions(user: User) -> int:
    today = timezone.localdate()
    created_count = 0
    for name, hand_written in sample_transactions(today).items():
        account = Account.objects.filter(user=user, name=name).first()
        if account is None or account.transactions.exists():
            continue
        rows = hand_written + generated_spends(name, today)
        Transaction.objects.bulk_create(
            Transaction(
                account=account,
                amount=amount,
                description=description,
                occurred_on=occurred_on,
            )
            for amount, description, occurred_on in rows
        )
        created_count += len(rows)
    return created_count


def _create_verified_user(email: str) -> User:
    user = User.objects.create_user(email)
    EmailAddress.objects.create(user=user, email=email, verified=True, primary=True)
    return user
