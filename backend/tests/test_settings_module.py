import os
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent


@pytest.mark.parametrize("entry_point", ["config.wsgi", "config.asgi"])
def test_entry_point_fails_without_settings_module(entry_point: str) -> None:
    env = {k: v for k, v in os.environ.items() if k != "DJANGO_SETTINGS_MODULE"}

    result = subprocess.run(
        [sys.executable, "-c", f"import {entry_point}"],
        cwd=BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode != 0
    assert "DJANGO_SETTINGS_MODULE" in result.stderr
