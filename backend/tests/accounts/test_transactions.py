from collections.abc import Callable
from datetime import date
from decimal import Decimal

import pytest
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext
from pytest_django import Settings

from accounts.models import Account, Transaction
from tests.accounts.client import delete, get, patch, post
from tests.accounts.factories import create_account, create_transaction
from tests.client import csrf_token, result_ids, results
from users.models import User

MALFORMED_IDS = [
    "not-a-uuid",
    "12345",
    "11111111-1111-1111-1111-11111111111",
]


def transaction_list_url(account: Account) -> str:
    return f"/accounts/{account.id}/transactions"


def transaction_detail_url(account: Account, transaction: Transaction) -> str:
    return f"/accounts/{account.id}/transactions/{transaction.id}"


@pytest.mark.django_db
def test_create_transaction_success(auth_client: Client, user: User) -> None:
    account = create_account(user)

    response = post(
        auth_client,
        transaction_list_url(account),
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
    assert payload["account"] == {
        "id": str(account.id),
        "name": account.name,
        "type": account.type,
    }

    transaction = Transaction.objects.get(id=payload["id"])
    assert transaction.account == account


@pytest.mark.django_db
def test_create_transaction_without_description_defaults_to_empty(
    auth_client: Client, user: User
) -> None:
    account = create_account(user)

    response = post(
        auth_client,
        transaction_list_url(account),
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
    account = create_account(user)

    response = post(auth_client, transaction_list_url(account), payload)

    assert response.status_code == 400


@pytest.mark.django_db
def test_create_transaction_for_another_users_account_returns_404(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)

    response = post(
        auth_client,
        transaction_list_url(account),
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
    account = create_account(user, name="Mine")
    other_account = create_account(user, name="Also mine")
    mine = create_transaction(account, amount="10.00")
    create_transaction(other_account, amount="20.00")

    response = get(auth_client, transaction_list_url(account))

    assert response.status_code == 200
    assert result_ids(response) == [str(mine.id)]


@pytest.mark.django_db
def test_list_orders_by_occurred_on_descending(auth_client: Client, user: User) -> None:
    account = create_account(user)
    older = create_transaction(account, amount="1.00", occurred_on="2026-01-01")
    newer = create_transaction(account, amount="2.00", occurred_on="2026-02-01")

    response = get(auth_client, transaction_list_url(account))

    assert result_ids(response) == [str(newer.id), str(older.id)]


@pytest.mark.django_db
def test_list_for_another_users_account_returns_404(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)
    create_transaction(account)

    response = get(auth_client, transaction_list_url(account))

    assert response.status_code == 404


@pytest.mark.django_db
def test_retrieve_own_transaction(auth_client: Client, user: User) -> None:
    account = create_account(user)
    transaction = create_transaction(account)

    response = get(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 200
    assert response.json()["id"] == str(transaction.id)


@pytest.mark.django_db
def test_cannot_retrieve_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)
    transaction = create_transaction(account)

    response = get(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 404


@pytest.mark.django_db
def test_cannot_retrieve_transaction_via_a_different_owned_account(
    auth_client: Client, user: User
) -> None:
    account = create_account(user, name="Mine")
    other_account = create_account(user, name="Also mine")
    transaction = create_transaction(other_account)

    response = get(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "api_value", "model_value"),
    [
        ("amount", "42.50", Decimal("42.50")),
        ("description", "Updated description", "Updated description"),
        ("occurred_on", "2026-03-01", date(2026, 3, 1)),
    ],
)
def test_update_transaction_fields(
    auth_client: Client,
    user: User,
    field: str,
    api_value: str,
    model_value: object,
) -> None:
    account = create_account(user)
    transaction = create_transaction(account)

    response = patch(
        auth_client, transaction_detail_url(account, transaction), {field: api_value}
    )

    assert response.status_code == 200
    assert response.json()[field] == api_value
    transaction.refresh_from_db()
    assert getattr(transaction, field) == model_value


@pytest.mark.django_db
def test_cannot_update_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)
    transaction = create_transaction(account, amount="10.00")

    response = patch(
        auth_client,
        transaction_detail_url(account, transaction),
        {"amount": "999.00"},
    )

    assert response.status_code == 404
    transaction.refresh_from_db()
    assert str(transaction.amount) == "10.00"


@pytest.mark.django_db
def test_cannot_update_transaction_via_a_different_owned_account(
    auth_client: Client, user: User
) -> None:
    account = create_account(user, name="Mine")
    other_account = create_account(user, name="Also mine")
    transaction = create_transaction(other_account, amount="10.00")

    response = patch(
        auth_client,
        transaction_detail_url(account, transaction),
        {"amount": "999.00"},
    )

    assert response.status_code == 404
    transaction.refresh_from_db()
    assert str(transaction.amount) == "10.00"


@pytest.mark.django_db
def test_put_is_not_allowed(auth_client: Client, user: User) -> None:
    account = create_account(user)
    transaction = create_transaction(account)

    response = auth_client.put(
        f"/v1{transaction_detail_url(account, transaction)}",
        data='{"amount": "1.00", "occurred_on": "2026-01-01"}',
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(auth_client),
    )

    assert response.status_code == 405


@pytest.mark.django_db
def test_delete_hard_deletes_transaction(auth_client: Client, user: User) -> None:
    account = create_account(user)
    transaction = create_transaction(account)

    response = delete(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 204
    assert not Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
def test_cannot_delete_transaction_on_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)
    transaction = create_transaction(account)

    response = delete(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 404
    assert Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
def test_cannot_delete_transaction_via_a_different_owned_account(
    auth_client: Client, user: User
) -> None:
    account = create_account(user, name="Mine")
    other_account = create_account(user, name="Also mine")
    transaction = create_transaction(other_account)

    response = delete(auth_client, transaction_detail_url(account, transaction))

    assert response.status_code == 404
    assert Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
def test_deleting_account_cascades_to_transactions(user: User) -> None:
    account = create_account(user)
    transaction = create_transaction(account)

    account.delete()

    assert not Transaction.objects.filter(id=transaction.id).exists()


@pytest.mark.django_db
@pytest.mark.parametrize("case", ["list", "create", "retrieve", "update", "delete"])
def test_transaction_endpoints_404_after_account_soft_deleted(
    auth_client: Client, user: User, case: str
) -> None:
    account = create_account(user)
    transaction = create_transaction(account)
    account.soft_delete()
    list_path = transaction_list_url(account)
    detail_path = transaction_detail_url(account, transaction)

    responses = {
        "list": lambda: get(auth_client, list_path),
        "create": lambda: post(
            auth_client, list_path, {"amount": "10.00", "occurred_on": "2026-01-01"}
        ),
        "retrieve": lambda: get(auth_client, detail_path),
        "update": lambda: patch(auth_client, detail_path, {"amount": "5.00"}),
        "delete": lambda: delete(auth_client, detail_path),
    }

    assert responses[case]().status_code == 404


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
    account = create_account(user)
    assert get(auth_client, f"/accounts/{account.id}/transactions/").status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize("malformed_id", MALFORMED_IDS)
def test_malformed_account_id_returns_not_found(
    auth_client: Client, malformed_id: str
) -> None:
    assert get(auth_client, f"/accounts/{malformed_id}/transactions").status_code == 404


@pytest.mark.django_db
@pytest.mark.parametrize("malformed_id", MALFORMED_IDS)
def test_malformed_transaction_id_returns_not_found(
    auth_client: Client, user: User, malformed_id: str
) -> None:
    account = create_account(user)
    response = get(auth_client, f"/accounts/{account.id}/transactions/{malformed_id}")
    assert response.status_code == 404


@pytest.mark.django_db
def test_list_all_returns_own_transactions_across_accounts(
    auth_client: Client, user: User, other_user: User
) -> None:
    first = create_transaction(create_account(user, name="Amazon"))
    second = create_transaction(create_account(user, name="Delta"))
    create_transaction(create_account(other_user))

    response = get(auth_client, "/transactions")

    assert response.status_code == 200
    assert set(result_ids(response)) == {str(first.id), str(second.id)}


@pytest.mark.django_db
def test_list_all_excludes_soft_deleted_accounts(
    auth_client: Client, user: User
) -> None:
    kept = create_transaction(create_account(user, name="Kept"))
    deleted_account = create_account(user, name="Deleted")
    create_transaction(deleted_account)
    deleted_account.soft_delete()

    response = get(auth_client, "/transactions")

    assert result_ids(response) == [str(kept.id)]


@pytest.mark.django_db
def test_list_all_orders_by_date_then_account_name_then_newest_created(
    auth_client: Client, user: User
) -> None:
    amazon = create_account(user, name="Amazon")
    delta = create_account(user, name="Delta")
    older = create_transaction(amazon, occurred_on="2026-01-01")
    delta_same_day = create_transaction(delta, occurred_on="2026-02-01")
    amazon_first_created = create_transaction(amazon, occurred_on="2026-02-01")
    amazon_last_created = create_transaction(amazon, occurred_on="2026-02-01")

    response = get(auth_client, "/transactions")

    assert result_ids(response) == [
        str(amazon_last_created.id),
        str(amazon_first_created.id),
        str(delta_same_day.id),
        str(older.id),
    ]


@pytest.mark.django_db
def test_list_all_includes_account_summary(auth_client: Client, user: User) -> None:
    account = create_account(user, name="Delta", type=Account.Type.FLIGHT_CREDIT)
    create_transaction(account)

    response = get(auth_client, "/transactions")

    assert results(response)[0]["account"] == {
        "id": str(account.id),
        "name": "Delta",
        "type": "flight_credit",
    }


@pytest.mark.django_db
def test_list_all_is_paginated(
    auth_client: Client, user: User, settings: Settings
) -> None:
    page_size = settings.REST_FRAMEWORK["PAGE_SIZE"]
    account = create_account(user)
    Transaction.objects.bulk_create(
        Transaction(account=account, amount="1.00", occurred_on="2026-01-01")
        for _ in range(page_size + 1)
    )

    page_1 = get(auth_client, "/transactions")
    assert page_1.json()["count"] == page_size + 1
    assert len(results(page_1)) == page_size
    assert page_1.json()["next"] is not None

    page_2 = get(auth_client, "/transactions?page=2")
    assert len(results(page_2)) == 1
    assert page_2.json()["next"] is None


@pytest.mark.django_db
@pytest.mark.parametrize(
    "path",
    [
        lambda account: "/transactions",
        lambda account: f"/accounts/{account.id}/transactions",
    ],
    ids=["all", "per-account"],
)
def test_list_avoids_n_plus_one_queries(
    auth_client: Client, user: User, path: Callable[[Account], str]
) -> None:
    account = create_account(user)
    create_transaction(account)
    with CaptureQueriesContext(connection) as one_transaction:
        get(auth_client, path(account))

    for _ in range(5):
        create_transaction(create_account(user))
        create_transaction(account)
    with CaptureQueriesContext(connection) as many_transactions:
        get(auth_client, path(account))

    assert len(many_transactions) == len(one_transaction)
