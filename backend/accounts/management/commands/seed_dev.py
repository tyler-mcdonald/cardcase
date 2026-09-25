from datetime import timedelta
from typing import Any

from allauth.account.models import EmailAddress
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.utils import timezone

from accounts.models import Account
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
        for name, defaults in self._accounts().items():
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

    def _accounts(self) -> dict[str, dict[str, Any]]:
        today = timezone.localdate()
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
