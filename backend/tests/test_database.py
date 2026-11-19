import importlib
from collections.abc import Iterator
from typing import Any

import pytest
from django.conf import settings
from django.db import connections

import config.settings.base


def _fresh_connection_setting(name: str, options: dict[str, Any] | None = None) -> int:
    default = connections["default"]
    settings_dict = default.settings_dict
    if options is not None:
        settings_dict = {**settings_dict, "OPTIONS": options}
    connection = type(default)(settings_dict, "default")
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT setting::int FROM pg_settings WHERE name = %s", [name]
            )
            (value,) = cursor.fetchone()
    finally:
        connection.close()
    return int(value)


@pytest.fixture
def reload_base_settings(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    yield
    monkeypatch.undo()
    importlib.reload(config.settings.base)


@pytest.mark.django_db
def test_fresh_connection_has_statement_timeout() -> None:
    assert (
        _fresh_connection_setting("statement_timeout") == settings.DB_STATEMENT_TIMEOUT
    )


@pytest.mark.django_db
@pytest.mark.usefixtures("reload_base_settings")
def test_db_lock_timeout_reaches_fresh_connection(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("DB_LOCK_TIMEOUT", "1234")
    base = importlib.reload(config.settings.base)

    assert (
        _fresh_connection_setting("lock_timeout", base.DATABASES["default"]["OPTIONS"])
        == 1234
    )
