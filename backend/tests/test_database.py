import pytest
from django.db import connections


@pytest.mark.django_db
def test_fresh_connection_has_statement_timeout() -> None:
    connection = connections.create_connection("default")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SHOW statement_timeout")
            (timeout,) = cursor.fetchone()
    finally:
        connection.close()

    assert timeout == "5s"
