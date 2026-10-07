from datetime import date

import pytest
from django.db import connection
from django.test import Client
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from accounts import serializers
from accounts.models import MAX_ACCOUNTS_PER_USER, Account
from accounts.views import AccountPagination
from tests.accounts.client import delete, get, patch, post, post_account
from tests.accounts.factories import (
    create_account,
    create_accounts,
    create_transaction,
)
from tests.client import csrf_token
from users.models import User

TEST_ACCOUNT_LIMIT = 5


@pytest.fixture
def account_limit(monkeypatch: pytest.MonkeyPatch) -> int:
    monkeypatch.setattr(serializers, "MAX_ACCOUNTS_PER_USER", TEST_ACCOUNT_LIMIT)
    monkeypatch.setattr(AccountPagination, "max_page_size", TEST_ACCOUNT_LIMIT)
    return TEST_ACCOUNT_LIMIT


@pytest.mark.django_db
def test_create_account_success(auth_client: Client, user: User) -> None:
    response = post(
        auth_client,
        "/accounts",
        {
            "name": "Amazon",
            "description": "Birthday gift",
            "type": "gift_card",
            "expires_on": "2027-01-01",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["name"] == "Amazon"
    assert payload["description"] == "Birthday gift"
    assert payload["type"] == "gift_card"
    assert payload["expires_on"] == "2027-01-01"
    assert payload["id"]

    account = Account.objects.get(id=payload["id"])
    assert account.user == user


@pytest.mark.django_db
def test_create_account_without_expires_on_defaults_to_null(
    auth_client: Client,
) -> None:
    response = post(auth_client, "/accounts", {"name": "Delta", "type": "gift_card"})

    assert response.status_code == 201
    assert response.json()["expires_on"] is None


@pytest.mark.django_db
@pytest.mark.parametrize(
    "payload",
    [
        {"type": "gift_card"},
        {"name": "Amazon"},
        {"name": "Amazon", "type": "not_a_real_type"},
    ],
)
def test_create_account_validation_errors(
    auth_client: Client, payload: dict[str, str]
) -> None:
    response = post(auth_client, "/accounts", payload)
    assert response.status_code == 400


@pytest.mark.django_db
def test_create_account_below_limit_succeeds(
    auth_client: Client, user: User, account_limit: int
) -> None:
    create_accounts(user, account_limit - 1)

    response = post_account(auth_client)

    assert response.status_code == 201
    assert Account.objects.filter(user=user).count() == account_limit


@pytest.mark.django_db
def test_create_account_at_limit_is_rejected(
    auth_client: Client, user: User, account_limit: int
) -> None:
    create_accounts(user, account_limit)

    response = post_account(auth_client)

    assert response.status_code == 400
    assert response.json() == {
        "non_field_errors": [f"You can only have up to {account_limit} accounts."]
    }
    assert Account.objects.filter(user=user).count() == account_limit


@pytest.mark.django_db
def test_create_account_locks_user(auth_client: Client) -> None:
    with CaptureQueriesContext(connection) as queries:
        post_account(auth_client)

    assert any("FOR UPDATE" in query["sql"] for query in queries.captured_queries)


@pytest.mark.django_db
def test_soft_deleted_accounts_do_not_count_toward_limit(
    auth_client: Client, user: User, account_limit: int
) -> None:
    accounts = create_accounts(user, account_limit)
    accounts[0].soft_delete()

    response = post_account(auth_client)

    assert response.status_code == 201


@pytest.mark.django_db
def test_other_users_accounts_do_not_count_toward_limit(
    auth_client: Client, other_user: User, account_limit: int
) -> None:
    create_accounts(other_user, account_limit)

    response = post_account(auth_client)

    assert response.status_code == 201


@pytest.mark.django_db
def test_update_account_at_limit_succeeds(
    auth_client: Client, user: User, account_limit: int
) -> None:
    accounts = create_accounts(user, account_limit)

    response = patch(auth_client, f"/accounts/{accounts[0].id}", {"name": "Renamed"})

    assert response.status_code == 200


@pytest.mark.django_db
def test_list_only_returns_own_accounts(
    auth_client: Client, user: User, other_user: User
) -> None:
    mine = create_account(user, name="Mine")
    create_account(other_user, name="Not mine")

    response = get(auth_client, "/accounts")

    assert response.status_code == 200
    results = response.json()["results"]
    assert [r["id"] for r in results] == [str(mine.id)]


@pytest.mark.django_db
def test_retrieve_own_account(auth_client: Client, user: User) -> None:
    account = create_account(user)

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.status_code == 200
    assert response.json()["id"] == str(account.id)


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("field", "api_value", "model_attr", "model_value"),
    [
        ("name", "Amazon.com", "name", "Amazon.com"),
        ("description", "Updated description", "description", "Updated description"),
        ("expires_on", "2028-06-15", "expires_on", date(2028, 6, 15)),
    ],
)
def test_update_account_fields(
    auth_client: Client,
    user: User,
    field: str,
    api_value: str,
    model_attr: str,
    model_value: object,
) -> None:
    account = create_account(user, name="Amazon")

    response = patch(auth_client, f"/accounts/{account.id}", {field: api_value})

    assert response.status_code == 200
    assert response.json()[field] == api_value
    account.refresh_from_db()
    assert getattr(account, model_attr) == model_value


@pytest.mark.django_db
@pytest.mark.parametrize("new_type", ["flight_credit", "gift_card"])
def test_update_rejects_type_field(
    auth_client: Client, user: User, new_type: str
) -> None:
    account = create_account(user, type=Account.Type.GIFT_CARD)

    response = patch(auth_client, f"/accounts/{account.id}", {"type": new_type})

    assert response.status_code == 400
    account.refresh_from_db()
    assert account.type == Account.Type.GIFT_CARD


@pytest.mark.django_db
def test_put_is_not_allowed(auth_client: Client, user: User) -> None:
    account = create_account(user)

    response = auth_client.put(
        f"/v1/accounts/{account.id}",
        data='{"name": "Amazon", "type": "gift_card"}',
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(auth_client),
    )

    assert response.status_code == 405


@pytest.mark.django_db
def test_delete_soft_deletes_and_hides_account(auth_client: Client, user: User) -> None:
    account = create_account(user)

    response = delete(auth_client, f"/accounts/{account.id}")

    assert response.status_code == 204
    assert get(auth_client, f"/accounts/{account.id}").status_code == 404

    account.refresh_from_db()
    assert account.deleted_at is not None
    assert Account.all_objects.filter(id=account.id).exists()


@pytest.mark.django_db
def test_soft_deleted_account_excluded_from_list(
    auth_client: Client, user: User
) -> None:
    account = create_account(user)
    account.soft_delete()

    response = get(auth_client, "/accounts")

    assert response.json()["results"] == []


@pytest.mark.django_db
def test_cannot_retrieve_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.status_code == 404


@pytest.mark.django_db
def test_cannot_update_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)

    response = patch(auth_client, f"/accounts/{account.id}", {"name": "Hijacked"})

    assert response.status_code == 404
    account.refresh_from_db()
    assert account.name != "Hijacked"


@pytest.mark.django_db
def test_cannot_delete_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = create_account(other_user)

    response = delete(auth_client, f"/accounts/{account.id}")

    assert response.status_code == 404
    account.refresh_from_db()
    assert account.deleted_at is None


def test_post_without_csrf_token_is_rejected(client: Client, user: User) -> None:
    client.force_login(user)

    response = client.post(
        "/v1/accounts",
        data='{"name": "Amazon", "type": "gift_card"}',
        content_type="application/json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_trailing_slash_urls_are_not_routed(client: Client) -> None:
    assert get(client, "/accounts/").status_code == 404


@pytest.mark.django_db
def test_list_pagination_covers_all_accounts_without_duplicates(
    auth_client: Client, user: User
) -> None:
    accounts = Account.objects.bulk_create(
        [
            Account(user=user, name=f"Account {i}", type=Account.Type.GIFT_CARD)
            for i in range(55)
        ]
    )
    # Force identical created_at across every row so the list ordering has to
    # rely on the -id tiebreaker instead of natural timestamp variance.
    Account.objects.filter(id__in=[a.id for a in accounts]).update(
        created_at=timezone.now()
    )

    page_1 = get(auth_client, "/accounts").json()
    assert page_1["count"] == 55
    assert len(page_1["results"]) == 50
    assert page_1["previous"] is None
    assert page_1["next"] is not None

    page_2 = get(auth_client, "/accounts?page=2").json()
    assert len(page_2["results"]) == 5
    assert page_2["next"] is None
    assert page_2["previous"] is not None

    seen_ids = [r["id"] for r in page_1["results"] + page_2["results"]]
    assert len(seen_ids) == len(set(seen_ids)) == 55
    assert set(seen_ids) == {str(a.id) for a in accounts}

    expected_ids = [
        str(a.id) for a in sorted(accounts, key=lambda a: a.id, reverse=True)
    ]
    assert seen_ids == expected_ids


@pytest.mark.django_db
def test_list_page_size_at_limit_returns_all_accounts(
    auth_client: Client, user: User
) -> None:
    create_accounts(user, MAX_ACCOUNTS_PER_USER)

    page = get(auth_client, f"/accounts?page_size={MAX_ACCOUNTS_PER_USER}").json()

    assert page["count"] == MAX_ACCOUNTS_PER_USER
    assert len(page["results"]) == MAX_ACCOUNTS_PER_USER
    assert page["next"] is None


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("page_size", "expected_results"),
    [
        ("", TEST_ACCOUNT_LIMIT + 1),
        ("2", 2),
        ("1000", TEST_ACCOUNT_LIMIT),
        ("0", TEST_ACCOUNT_LIMIT + 1),
        ("-1", TEST_ACCOUNT_LIMIT + 1),
        ("abc", TEST_ACCOUNT_LIMIT + 1),
    ],
)
def test_list_page_size(
    auth_client: Client,
    user: User,
    account_limit: int,
    page_size: str,
    expected_results: int,
) -> None:
    create_accounts(user, account_limit + 1)

    page = get(auth_client, f"/accounts?page_size={page_size}").json()

    assert len(page["results"]) == expected_results


@pytest.mark.django_db
def test_deleting_user_cascades_to_soft_deleted_accounts(user: User) -> None:
    account = create_account(user)
    account.soft_delete()

    user.delete()

    assert not Account.all_objects.filter(id=account.id).exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "malformed_id",
    [
        "not-a-uuid",
        "12345",
        "11111111-1111-1111-1111-11111111111",
    ],
)
def test_malformed_id_returns_not_found(auth_client: Client, malformed_id: str) -> None:
    assert get(auth_client, f"/accounts/{malformed_id}").status_code == 404


@pytest.mark.django_db
def test_account_without_transactions_has_zero_balance(
    auth_client: Client, user: User
) -> None:
    account = create_account(user)

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.json()["balance"] == "0.00"


@pytest.mark.django_db
def test_balance_is_sum_of_transactions(auth_client: Client, user: User) -> None:
    account = create_account(user)
    create_transaction(account, amount="50.00")
    create_transaction(account, amount="-12.25")
    create_transaction(account, amount="5.10", occurred_on="2999-01-01")
    create_transaction(create_account(user), amount="100.00")

    retrieved = get(auth_client, f"/accounts/{account.id}").json()
    listed = get(auth_client, "/accounts").json()["results"]

    assert retrieved["balance"] == "42.85"
    assert {r["id"]: r["balance"] for r in listed}[str(account.id)] == "42.85"


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("amounts", "expected_balance"),
    [
        (["25.00"], "25.00"),
        (["-25.00"], "-25.00"),
        (["0.01", "0.02"], "0.03"),
        (["100.00", "-100.00"], "0.00"),
        (["10.00", "-30.50"], "-20.50"),
        (["-0.99", "-0.01"], "-1.00"),
        (["99999999.99", "99999999.99"], "199999999.98"),
        (["-99999999.99", "-99999999.99"], "-199999999.98"),
        (["1.10", "2.20", "3.30", "-0.60"], "6.00"),
    ],
)
def test_balance_sums_amounts(
    auth_client: Client, user: User, amounts: list[str], expected_balance: str
) -> None:
    account = create_account(user)
    for amount in amounts:
        create_transaction(account, amount=amount)

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.json()["balance"] == expected_balance


@pytest.mark.django_db
def test_negative_balance_is_returned_as_is(auth_client: Client, user: User) -> None:
    account = create_account(user)
    create_transaction(account, amount="-20.00")

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.json()["balance"] == "-20.00"


@pytest.mark.django_db
def test_create_account_returns_zero_balance(auth_client: Client) -> None:
    response = post_account(auth_client)

    assert response.status_code == 201
    assert response.json()["balance"] == "0.00"


@pytest.mark.django_db
def test_update_account_returns_balance(auth_client: Client, user: User) -> None:
    account = create_account(user)
    create_transaction(account, amount="30.00")

    response = patch(auth_client, f"/accounts/{account.id}", {"name": "Renamed"})

    assert response.json()["balance"] == "30.00"


@pytest.mark.django_db
def test_balance_cannot_be_set(auth_client: Client) -> None:
    created = post(
        auth_client,
        "/accounts",
        {"name": "Amazon", "type": "gift_card", "balance": "99.00"},
    ).json()
    updated = patch(auth_client, f"/accounts/{created['id']}", {"balance": "99.00"})

    assert created["balance"] == "0.00"
    assert updated.json()["balance"] == "0.00"


@pytest.mark.django_db
def test_balance_reflects_transaction_changes(auth_client: Client, user: User) -> None:
    account = create_account(user)

    def balance() -> str:
        return str(get(auth_client, f"/accounts/{account.id}").json()["balance"])

    created = post(
        auth_client,
        f"/accounts/{account.id}/transactions",
        {"amount": "25.00", "occurred_on": "2026-01-01"},
    ).json()
    assert balance() == "25.00"

    patch(
        auth_client,
        f"/accounts/{account.id}/transactions/{created['id']}",
        {"amount": "-5.00"},
    )
    assert balance() == "-5.00"

    delete(auth_client, f"/accounts/{account.id}/transactions/{created['id']}")
    assert balance() == "0.00"


@pytest.mark.django_db
def test_list_balance_avoids_n_plus_one_queries(
    auth_client: Client, user: User
) -> None:
    create_transaction(create_account(user))
    with CaptureQueriesContext(connection) as one_account:
        get(auth_client, "/accounts")

    for _ in range(5):
        create_transaction(create_account(user))
    with CaptureQueriesContext(connection) as many_accounts:
        get(auth_client, "/accounts")

    assert len(many_accounts) == len(one_account)
