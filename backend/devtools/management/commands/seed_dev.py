from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError, CommandParser

from devtools.seed_data import (
    get_or_create_seed_user,
    seed_accounts,
    seed_transactions,
)
from users.models import User


class Command(BaseCommand):
    help = "Seed a user with sample accounts and transactions for local development."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("--email", required=True)

    def handle(self, *args: Any, **options: Any) -> None:
        if not settings.DEBUG:
            raise CommandError("seed_dev only runs with DEBUG enabled.")

        email = User.objects.normalize_email(options["email"])
        user = get_or_create_seed_user(email)
        account_count = seed_accounts(user)
        transaction_count = seed_transactions(user)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {account_count} new accounts and "
                f"{transaction_count} new transactions for {email}."
            )
        )
