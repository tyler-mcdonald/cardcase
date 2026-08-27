# mypy: disable-error-code="no-untyped-def, no-untyped-call"
from unittest.mock import Mock

import pytest
from django.db import DatabaseError

# Checks the /health/ endpoint must report on. Add to this list as more
# checks (cache, storage, etc.) get wired into HealthCheckView.
REQUIRED_HEALTH_CHECKS = ["Database"]


@pytest.mark.django_db
def test_health_endpoint_returns_ok_when_all_checks_pass(client):
    response = client.get("/health/?format=json")

    assert response.status_code == 200
    checks = response.json()
    for required in REQUIRED_HEALTH_CHECKS:
        assert any(required in check for check in checks)


@pytest.mark.django_db
def test_health_endpoint_returns_error_when_db_down(client, monkeypatch):
    monkeypatch.setattr(
        "django.db.backends.base.base.BaseDatabaseWrapper.cursor",
        Mock(side_effect=DatabaseError("simulated connection failure")),
    )

    response = client.get("/health/?format=json")

    assert response.status_code == 500
