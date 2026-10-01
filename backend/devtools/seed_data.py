from datetime import date, timedelta
from typing import Any

from allauth.account.models import EmailAddress
from django.utils import timezone

from accounts.models import Account
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


def _create_verified_user(email: str) -> User:
    user = User.objects.create_user(email)
    EmailAddress.objects.create(user=user, email=email, verified=True, primary=True)
    return user
