"""Create a passwordless superuser for DJANGO_SUPERUSER_EMAIL on every deploy.

No-op when the variable is unset or the superuser already exists; fails if the
email belongs to a regular user. Log in through the app's normal email-code
flow, which works even while signup is closed.

To use it in production, set DJANGO_SUPERUSER_EMAIL on the cardcase-backend
service in the Render dashboard, then deploy.

It runs in the Render build command (alongside migrate) because the free
instance type has no Render Shell or pre-deploy command
(https://render.com/docs/deploys#pre-deploy-command). Move both to
preDeployCommand if the service moves to a paid instance type.
"""

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
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
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
                user.set_unusable_password()
                user.save(update_fields=["password"])
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
