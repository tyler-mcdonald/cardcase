import pytest
from allauth.account.models import EmailAddress
from django.test import Client
from rest_framework.exceptions import NotAuthenticated

from accounts.models import Account, Transaction
from tests.accounts.factories import create_account, create_transaction
from tests.client import ApiResponse, get_session, scoped
from users.models import User

pytestmark = pytest.mark.django_db

api = scoped("/v1")


def _delete_me(client: Client) -> ApiResponse:
    return api.delete(client, "/me")


def _create_data(owner: User) -> None:
    EmailAddress.objects.create(
        user=owner, email=owner.email, verified=True, primary=True
    )
    create_transaction(create_account(owner))
    deleted = create_account(owner, name="Old")
    create_transaction(deleted)
    deleted.soft_delete()


def test_delete_removes_user_and_all_their_data(
    auth_client: Client, user: User
) -> None:
    _create_data(user)

    response = _delete_me(auth_client)

    assert response.status_code == 204
    assert not User.objects.filter(pk=user.pk).exists()
    assert not EmailAddress.objects.filter(user_id=user.pk).exists()
    assert not Account.all_objects.filter(user_id=user.pk).exists()
    assert not Transaction.objects.filter(account__user_id=user.pk).exists()


def test_delete_leaves_other_users_data_untouched(
    auth_client: Client, other_user: User
) -> None:
    _create_data(other_user)

    _delete_me(auth_client)

    assert User.objects.filter(pk=other_user.pk).exists()
    assert EmailAddress.objects.filter(user=other_user).count() == 1
    assert Account.all_objects.filter(user=other_user).count() == 2
    assert Transaction.objects.filter(account__user=other_user).count() == 2


def test_delete_ends_the_session(auth_client: Client) -> None:
    assert get_session(auth_client).status_code == 200

    _delete_me(auth_client)

    assert get_session(auth_client).status_code == 401


def test_signed_out_delete_is_rejected(client: Client, user: User) -> None:
    response = _delete_me(client)

    assert response.status_code == 403
    assert response.json()["detail"] == NotAuthenticated.default_detail
    assert User.objects.filter(pk=user.pk).exists()


def test_delete_without_csrf_token_is_rejected(client: Client, user: User) -> None:
    client.force_login(user)

    response = client.delete("/v1/me")

    assert response.status_code == 403
    assert User.objects.filter(pk=user.pk).exists()
