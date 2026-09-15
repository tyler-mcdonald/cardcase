from datetime import date
from decimal import Decimal

import pytest
from django.test import Client

from accounts.models import Account, Transaction
from tests.accounts.client import delete, get, patch, post
from tests.client import csrf_token
from users.models import User


def _create_account(owner: User, **overrides: object) -> Account:
    defaults: dict[str, object] = {"name": "Amazon", "type": Account.Type.GIFT_CARD}
    defaults.update(overrides)
    return Account.objects.create(user=owner, **defaults)


def _create_transaction(account: Account, **overrides: object) -> Transaction:
    defaults: dict[str, object] = {"amount": "10.00", "occurred_on": "2026-01-01"}
    defaults.update(overrides)
    return Transaction.objects.create(account=account, **defaults)


@pytest.mark.django_db
def test_list_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)
    assert get(client, f"/accounts/{account.id}/transactions").status_code == 403


@pytest.mark.django_db
def test_create_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)

    response = post(
        client,
        f"/accounts/{account.id}/transactions",
        {"amount": "10.00", "occurred_on": "2026-01-01"},
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_retrieve_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = get(client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 403


@pytest.mark.django_db
def test_update_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = patch(
        client, f"/accounts/{account.id}/transactions/{transaction.id}", {"amount": "5.00"}
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = delete(client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 403


@pytest.mark.django_db
def test_create_transaction_success(auth_client: Client, user: User) -> None:
    account = _create_account(user)

    response = post(
        auth_client,
        f"/accounts/{account.id}/transactions",
        {
            "amount": "-12.50",
            "description": "Coffee",
            "occurred_on": "2026-01-15",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["amount"] == "-12.50"
    assert payload["description"] == "Coffee"
    assert payload["occurred_on"] == "2026-01-15"
    assert payload["id"]
    assert "account" not in payload

    transaction = Transaction.objects.get(id=payload["id"])
    assert transaction.account == account


@pytest.mark.django_db
def test_create_transaction_without_description_defaults_to_empty(
    auth_client: Client, user: User
) -> None:
    account = _create_account(user)

    response = post(
        auth_client,
        f"/accounts/{account.id}/transactions",
        {"amount": "10.00", "occurred_on": "2026-01-01"},
    )

    assert response.status_code == 201
    assert response.json()["description"] == ""


@pytest.mark.django_db
@pytest.mark.parametrize(
    "payload",
    [
        {"occurred_on": "2026-01-01"},
        {"amount": "10.00"},
        {"amount": "not-a-number", "occurred_on": "2026-01-01"},
        {"amount": "10.00", "occurred_on": "not-a-date"},
    ],
)
def test_create_transaction_validation_errors(
    auth_client: Client, user: User, payload: dict[str, str]
) -> None:
    account = _create_account(user)

    response = post(auth_client, f"/accounts/{account.id}/transactions", payload)

    assert response.status_code == 400


@pytest.mark.django_db
def test_create_transaction_for_another_users_account_returns_404(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)

    response = post(
        auth_client,
        f"/accounts/{account.id}/transactions",
        {"amount": "10.00", "occurred_on": "2026-01-01"},
    )

    assert response.status_code == 404
    assert not Transaction.objects.filter(account=account).exists()


@pytest.mark.django_db
def test_create_transaction_for_nonexistent_account_returns_404(
    auth_client: Client,
) -> None:
    response = post(
        auth_client,
        "/accounts/11111111-1111-1111-1111-111111111111/transactions",
        {"amount": "10.00", "occurred_on": "2026-01-01"},
    )

    assert response.status_code == 404


@pytest.mark.django_db
def test_list_only_returns_transactions_for_the_given_account(
    auth_client: Client, user: User
) -> None:
    account = _create_account(user, name="Mine")
    other_account = _create_account(user, name="Also mine")
    mine = _create_transaction(account, amount="10.00")
    _create_transaction(other_account, amount="20.00")

    response = get(auth_client, f"/accounts/{account.id}/transactions")

    assert response.status_code == 200
    results = response.json()["results"]
    assert [r["id"] for r in results] == [str(mine.id)]


@pytest.mark.django_db
def test_list_orders_by_occurred_on_descending(auth_client: Client, user: User) -> None:
    account = _create_account(user)
    older = _create_transaction(account, amount="1.00", occurred_on="2026-01-01")
    newer = _create_transaction(account, amount="2.00", occurred_on="2026-02-01")

    response = get(auth_client, f"/accounts/{account.id}/transactions")

    results = response.json()["results"]
    assert [r["id"] for r in results] == [str(newer.id), str(older.id)]


@pytest.mark.django_db
def test_list_for_another_users_account_returns_404(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)
    _create_transaction(account)

    response = get(auth_client, f"/accounts/{account.id}/transactions")

    assert response.status_code == 404


@pytest.mark.django_db
def test_retrieve_own_transaction(auth_client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = get(auth_client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(transaction.id)


@pytest.mark.django_db
def test_cannot_retrieve_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)
    transaction = _create_transaction(account)

    response = get(auth_client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "api_value", "model_attr", "model_value"),
    [
        ("amount", "42.50", "amount", Decimal("42.50")),
        ("description", "Updated description", "description", "Updated description"),
        ("occurred_on", "2026-03-01", "occurred_on", date(2026, 3, 1)),
    ],
)
def test_update_transaction_fields(
    auth_client: Client,
    user: User,
    field: str,
    api_value: str,
    model_attr: str,
    model_value: object,
) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = patch(
        auth_client, f"/accounts/{account.id}/transactions/{transaction.id}", {field: api_value}
    )

    assert response.status_code == 200
    assert response.json()[field] == api_value
    transaction.refresh_from_db()
    assert getattr(transaction, model_attr) == model_value


@pytest.mark.django_db
def test_cannot_update_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)
    transaction = _create_transaction(account, amount="10.00")

    response = patch(
        auth_client,
        f"/accounts/{account.id}/transactions/{transaction.id}",
        {"amount": "999.00"},
    )

    assert response.status_code == 404
    transaction.refresh_from_db()
    assert str(transaction.amount) == "10.00"


@pytest.mark.django_db
def test_put_is_not_allowed(auth_client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = auth_client.put(
        f"/v1/accounts/{account.id}/transactions/{transaction.id}",
        data='{"amount": "1.00", "occurred_on": "2026-01-01"}',
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(auth_client),
    )

    assert response.status_code == 405


@pytest.mark.django_db
def test_delete_hard_deletes_transaction(auth_client: Client, user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    response = delete(auth_client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 204
    assert not Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
def test_cannot_delete_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)
    transaction = _create_transaction(account)

    response = delete(auth_client, f"/accounts/{account.id}/transactions/{transaction.id}")

    assert response.status_code == 404
    assert Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
def test_deleting_account_cascades_to_transactions(user: User) -> None:
    account = _create_account(user)
    transaction = _create_transaction(account)

    account.delete()

    assert not Transaction.objects.filter(id=transaction.id).exists()


def test_post_without_csrf_token_is_rejected(client: Client, user: User) -> None:
    client.force_login(user)

    response = client.post(
        "/v1/accounts/11111111-1111-1111-1111-111111111111/transactions",
        data='{"amount": "1.00", "occurred_on": "2026-01-01"}',
        content_type="application/json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_trailing_slash_urls_are_not_routed(auth_client: Client, user: User) -> None:
    account = _create_account(user)
    assert get(auth_client, f"/accounts/{account.id}/transactions/").status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    "malformed_id",
    [
        "not-a-uuid",
        "12345",
        "11111111-1111-1111-1111-11111111111",
    ],
)
def test_malformed_account_id_returns_not_found(
    auth_client: Client, malformed_id: str
) -> None:
    assert get(auth_client, f"/accounts/{malformed_id}/transactions").status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    "malformed_id",
    [
        "not-a-uuid",
        "12345",
        "11111111-1111-1111-1111-11111111111",
    ],
)
def test_malformed_transaction_id_returns_not_found(
    auth_client: Client, user: User, malformed_id: str
) -> None:
    account = _create_account(user)
    response = get(auth_client, f"/accounts/{account.id}/transactions/{malformed_id}")
    assert response.status_code == 404
