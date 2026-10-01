#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
from pathlib import Path
from typing import NoReturn


def settings_module_is_set() -> bool:
    return bool(os.environ.get("DJANGO_SETTINGS_MODULE"))


def exit_settings_module_unset() -> NoReturn:
    sys.exit(
        "DJANGO_SETTINGS_MODULE is not set. Set it in the environment; for "
        "local development, add it to backend/.env as shown in "
        "backend/.env.example."
    )


def main() -> None:
    """Run administrative tasks."""
    try:
        import environ
        from django.core.exceptions import ImproperlyConfigured
        from django.core.management import (
            BaseCommand,
            ManagementUtility,
            get_commands,
        )
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    environ.Env.read_env(Path(__file__).resolve().parent / ".env")

    class SettingsModuleUtility(ManagementUtility):
        def fetch_command(self, subcommand: str) -> BaseCommand:
            if subcommand not in get_commands() and not settings_module_is_set():
                exit_settings_module_unset()
            return super().fetch_command(subcommand)

    try:
        SettingsModuleUtility(sys.argv).execute()
    except ImproperlyConfigured:
        if settings_module_is_set():
            raise
        exit_settings_module_unset()


if __name__ == "__main__":
    main()
