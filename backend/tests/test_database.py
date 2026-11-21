import importlib
from collections.abc import Iterator
from types import ModuleType

import pytest
from django.conf import settings
from django.db import connections
from django.db.backends.base.base import BaseDatabaseWrapper

import config.settings.base


def _read_setting(connection: BaseDatabaseWrapper, name: str) -> int:
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
def base_settings_with_lock_timeout() -> Iterator[ModuleType]:
    with pytest.MonkeyPatch.context() as mp:
        mp.setenv("DB_LOCK_TIMEOUT", "1234")
        yield importlib.reload(config.settings.base)
    importlib.reload(config.settings.base)


@pytest.mark.django_db
def test_fresh_connection_has_statement_timeout() -> None:
    connection = connections.create_connection("default")

    timeout_ms = _read_setting(connection, "statement_timeout")

    assert timeout_ms == settings.DB_STATEMENT_TIMEOUT


@pytest.mark.django_db
def test_db_lock_timeout_reaches_fresh_connection(
    base_settings_with_lock_timeout: ModuleType,
) -> None:
    default = connections["default"]
    options = base_settings_with_lock_timeout.DATABASES["default"]["OPTIONS"]
    connection = type(default)({**default.settings_dict, "OPTIONS": options}, "default")

    timeout_ms = _read_setting(connection, "lock_timeout")

    assert timeout_ms == 1234
