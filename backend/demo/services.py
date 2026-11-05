import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from demo.seed_data import create_verified_user, seed_accounts, seed_transactions
from users.models import User

DEMO_EMAIL_DOMAIN = "demo.invalid"
DEMO_LIFETIME = timedelta(hours=24)


def delete_expired_demo_users() -> None:
    cutoff = timezone.now() - DEMO_LIFETIME
    User.objects.filter(is_demo=True, created_at__lt=cutoff).delete()


@transaction.atomic
def start_demo() -> User:
    user = create_verified_user(
        f"demo-{uuid.uuid4()}@{DEMO_EMAIL_DOMAIN}", is_demo=True
    )
    seed_accounts(user)
    seed_transactions(user)
    return user
