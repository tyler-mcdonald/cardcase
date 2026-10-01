import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
SETTINGS_NOT_CONFIGURED = (
    "settings are not configured. You must either define the environment variable "
    "DJANGO_SETTINGS_MODULE"
)


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
    assert SETTINGS_NOT_CONFIGURED in result.stderr


PRINT_SETTINGS_MODULE = [
    "shell",
    "--no-imports",
    "-c",
    "from django.conf import settings; print(settings.SETTINGS_MODULE)",
]


def run_manage_py(
    tmp_path: Path, env_file: str | None, args: list[str]
) -> subprocess.CompletedProcess[str]:
    shutil.copy(BACKEND_DIR / "manage.py", tmp_path / "manage.py")
    if env_file is not None:
        (tmp_path / ".env").write_text(env_file)
    env = {k: v for k, v in os.environ.items() if k != "DJANGO_SETTINGS_MODULE"}
    env["PYTHONPATH"] = str(BACKEND_DIR)

    return subprocess.run(
        [sys.executable, "manage.py", *args],
        cwd=tmp_path,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def test_manage_py_reads_settings_module_from_env_file(tmp_path: Path) -> None:
    result = run_manage_py(
        tmp_path, "DJANGO_SETTINGS_MODULE=config.settings.test\n", PRINT_SETTINGS_MODULE
    )

    assert result.returncode == 0, result.stderr
    assert result.stdout.strip() == "config.settings.test"


@pytest.mark.parametrize("env_file", [None, "DJANGO_SETTINGS_MODULE=\n"])
def test_manage_py_fails_without_settings_module(
    tmp_path: Path, env_file: str | None
) -> None:
    result = run_manage_py(tmp_path, env_file, PRINT_SETTINGS_MODULE)

    assert result.returncode != 0
