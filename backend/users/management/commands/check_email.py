from argparse import ArgumentParser
from typing import Any

from django.conf import settings
from django.core.mail import EmailMessage
from django.core.management.base import BaseCommand, CommandError

DEFAULT_RECIPIENT = "delivered+build-check@resend.dev"


class Command(BaseCommand):
    help = (
        "Send one email from DEFAULT_FROM_EMAIL via the default mailer. "
        "Fails if the email can't be sent."
    )

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "--to",
            default=DEFAULT_RECIPIENT,
            help=f"Recipient address (default: {DEFAULT_RECIPIENT}).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        to = options["to"]
        message = EmailMessage(
            subject="Cardcase email check",
            body="This email confirms the backend can send email.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        try:
            sent = message.send()
        except Exception as error:
            raise CommandError(f"Failed to send email to {to}: {error}") from error
        if not sent:
            raise CommandError(f"Failed to send email to {to}.")
        self.stdout.write(f"Sent email from {settings.DEFAULT_FROM_EMAIL} to {to}.")
