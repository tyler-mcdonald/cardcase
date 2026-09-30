from typing import Any

from allauth.account.models import EmailAddress
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.utils import timezone

from accounts.models import Account
from devtools.seed_data import sample_accounts
from users.models import User


class Command(BaseCommand):
    help = "Seed a user with sample accounts for local development."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", required=True)

    def handle(self, *args: Any, **options: Any) -> None:
        if not settings.DEBUG:
            raise CommandError("seed_dev only runs with DEBUG enabled.")

        email = User.objects.normalize_email(options["email"])
        user = User.objects.filter(email=email).first() or self._create_user(email)

        created_count = 0
        for name, defaults in sample_accounts(timezone.localdate()).items():
            _, created = Account.objects.get_or_create(
                user=user, name=name, defaults=defaults
            )
            created_count += created

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {created_count} new accounts for {email}.")
        )

    def _create_user(self, email: str) -> User:
        user = User.objects.create_user(email)
        EmailAddress.objects.create(user=user, email=email, verified=True, primary=True)
        return user
