#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""

import os
import sys
from pathlib import Path


def main() -> None:
    """Run administrative tasks."""
    try:
        import environ
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    environ.Env.read_env(Path(__file__).resolve().parent / ".env")
    if "DJANGO_SETTINGS_MODULE" not in os.environ and not any(
        arg.startswith("--settings") for arg in sys.argv
    ):
        sys.exit(
            "DJANGO_SETTINGS_MODULE is not set. Add "
            "DJANGO_SETTINGS_MODULE=config.settings.local to backend/.env "
            "(see backend/.env.example)."
        )
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
