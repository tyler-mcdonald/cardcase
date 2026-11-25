import os
from typing import Any

from django.contrib.staticfiles.management.commands.runserver import (
    Command as RunserverCommand,
)
from django.core.management import call_command
from django.utils.autoreload import DJANGO_AUTORELOAD_ENV


class Command(RunserverCommand):
    help = "Apply migrations, then run the development server, in one process."

    def handle(self, *args: Any, **options: Any) -> None:
        if os.environ.get(DJANGO_AUTORELOAD_ENV) != "true":
            call_command("migrate", skip_checks=True)
        super().handle(*args, **options)
