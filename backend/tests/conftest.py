import pytest
from django.core.cache import cache
from django.test import Client

from users.models import User


@pytest.fixture
def client() -> Client:
    return Client(enforce_csrf_checks=True)


@pytest.fixture(autouse=True)
def _clear_cache() -> None:
    cache.clear()


@pytest.fixture
def user(db: None) -> User:
    return User.objects.create_user(email="owner@example.com")


@pytest.fixture
def other_user(db: None) -> User:
    return User.objects.create_user(email="other@example.com")


@pytest.fixture
def auth_client(client: Client, user: User) -> Client:
    client.force_login(user)
    return client
