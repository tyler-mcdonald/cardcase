#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
from pathlib import Path


def main() -> None:
    """Run administrative tasks."""
    try:
        import environ
        from django.core.exceptions import ImproperlyConfigured
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    environ.Env.read_env(Path(__file__).resolve().parent / ".env")
    try:
        execute_from_command_line(sys.argv)
    except ImproperlyConfigured:
        if "DJANGO_SETTINGS_MODULE" in os.environ:
            raise
        sys.exit(
            "DJANGO_SETTINGS_MODULE is not set. Set it in the environment; for "
            "local development, add it to backend/.env as shown in "
            "backend/.env.example."
        )


if __name__ == "__main__":
    main()
