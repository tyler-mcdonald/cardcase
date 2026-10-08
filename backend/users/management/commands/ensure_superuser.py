import os
from typing import Any

from allauth.account.models import EmailAddress
from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from users.models import User


class Command(BaseCommand):
    help = (
        "Create the superuser named by DJANGO_SUPERUSER_EMAIL if it doesn't exist. "
        "Safe to run on every deploy."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip()
        if not email:
            self.stdout.write("DJANGO_SUPERUSER_EMAIL is not set; skipping.")
            return

        existing = User.objects.filter(email__iexact=email).first()
        if existing is None:
            with transaction.atomic():
                call_command(
                    "createsuperuser",
                    interactive=False,
                    email=email,
                    stdout=self.stdout,
                    stderr=self.stderr,
                )
                user = User.objects.get(email__iexact=email)
                EmailAddress.objects.create(
                    user=user, email=user.email, verified=True, primary=True
                )
            return

        if existing.is_staff and existing.is_superuser:
            self.stdout.write(f"Superuser {existing.email} already exists; skipping.")
            return

        raise CommandError(
            f"{existing.email} already exists as a regular user; "
            "refusing to promote it to superuser."
        )
