import pytest
from django.core.cache import cache
from django.test import Client


@pytest.fixture
def client():
    return Client(enforce_csrf_checks=True)


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
