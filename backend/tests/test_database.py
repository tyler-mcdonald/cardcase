import pytest
from django.conf import settings
from django.db import connections


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("name", "setting"),
    [
        ("statement_timeout", "DB_STATEMENT_TIMEOUT"),
        ("lock_timeout", "DB_LOCK_TIMEOUT"),
    ],
)
def test_fresh_connection_has_configured_timeout(name: str, setting: str) -> None:
    connection = connections.create_connection("default")
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT setting::int FROM pg_settings WHERE name = %s", [name]
            )
            (timeout_ms,) = cursor.fetchone()
    finally:
        connection.close()

    assert timeout_ms == getattr(settings, setting)
