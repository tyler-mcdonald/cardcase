import string
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.crypto import get_random_string

from demo.seed_data import create_verified_user, seed_accounts, seed_transactions
from users.models import User

DEMO_EMAIL_DOMAIN = "demo.invalid"
DEMO_EMAIL_SUFFIX_CHARS = string.ascii_lowercase + string.digits
DEMO_LIFETIME = timedelta(hours=24)


def delete_expired_demo_users() -> None:
    cutoff = timezone.now() - DEMO_LIFETIME
    User.objects.filter(is_demo=True, created_at__lt=cutoff).delete()


def new_demo_email() -> str:
    while True:
        suffix = get_random_string(8, allowed_chars=DEMO_EMAIL_SUFFIX_CHARS)
        email = f"demo-{suffix}@{DEMO_EMAIL_DOMAIN}"
        if not User.objects.filter(email=email).exists():
            return email


@transaction.atomic
def start_demo() -> User:
    user = create_verified_user(new_demo_email(), is_demo=True)
    seed_accounts(user)
    seed_transactions(user)
    return user
