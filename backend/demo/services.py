import string
from contextlib import suppress
from datetime import timedelta

from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.crypto import get_random_string

from demo.seed_data import create_verified_user, seed_accounts, seed_transactions
from users.models import User

DEMO_EMAIL_DOMAIN = "demo.invalid"
DEMO_EMAIL_SUFFIX_CHARS = string.ascii_lowercase + string.digits
DEMO_EMAIL_ATTEMPTS = 5
DEMO_LIFETIME = timedelta(hours=24)


def delete_expired_demo_users() -> None:
    cutoff = timezone.now() - DEMO_LIFETIME
    User.objects.filter(is_demo=True, created_at__lt=cutoff).delete()


def new_demo_email() -> str:
    suffix = get_random_string(8, allowed_chars=DEMO_EMAIL_SUFFIX_CHARS)
    return f"demo-{suffix}@{DEMO_EMAIL_DOMAIN}"


def create_demo_user() -> User:
    for _ in range(DEMO_EMAIL_ATTEMPTS - 1):
        with suppress(IntegrityError), transaction.atomic():
            return create_verified_user(new_demo_email(), is_demo=True)
    with transaction.atomic():
        return create_verified_user(new_demo_email(), is_demo=True)


@transaction.atomic
def start_demo() -> User:
    user = create_demo_user()
    seed_accounts(user)
    seed_transactions(user)
    return user
