import pytest
from django.conf import settings
from django.db import connections


@pytest.mark.django_db
def test_fresh_connection_has_statement_timeout() -> None:
    connection = connections.create_connection("default")
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT setting::int FROM pg_settings WHERE name = 'statement_timeout'"
            )
            (timeout_ms,) = cursor.fetchone()
    finally:
        connection.close()

    assert timeout_ms == settings.DB_STATEMENT_TIMEOUT
