from collections.abc import Callable

import pytest
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext
from pytest_django import Settings

from accounts.models import Account, Transaction
from tests.accounts.client import get
from tests.accounts.factories import create_account, create_transaction
from tests.client import result_ids, results
from users.models import User


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
