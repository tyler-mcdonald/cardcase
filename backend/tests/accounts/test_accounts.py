from datetime import date

import pytest
from django.test import Client
from django.utils import timezone

from accounts.models import Account
from tests.accounts.client import delete, get, patch, post
from tests.client import csrf_token
from users.models import User


def _create_account(owner: User, **overrides: object) -> Account:
    defaults: dict[str, object] = {"name": "Amazon", "type": Account.Type.GIFT_CARD}
    defaults.update(overrides)
    return Account.objects.create(user=owner, **defaults)


@pytest.mark.django_db
def test_list_requires_authentication(client: Client) -> None:
    assert get(client, "/accounts").status_code == 403


@pytest.mark.django_db
def test_create_requires_authentication(client: Client) -> None:
    response = post(client, "/accounts", {"name": "Amazon", "type": "gift_card"})
    assert response.status_code == 403


@pytest.mark.django_db
def test_update_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)

    response = patch(client, f"/accounts/{account.id}", {"name": "Hijacked"})

    assert response.status_code == 403


@pytest.mark.django_db
def test_delete_requires_authentication(client: Client, user: User) -> None:
    account = _create_account(user)

    response = delete(client, f"/accounts/{account.id}")

    assert response.status_code == 403


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
def test_list_only_returns_own_accounts(
    auth_client: Client, user: User, other_user: User
) -> None:
    mine = _create_account(user, name="Mine")
    _create_account(other_user, name="Not mine")

    response = get(auth_client, "/accounts")

    assert response.status_code == 200
    results = response.json()["results"]
    assert [r["id"] for r in results] == [str(mine.id)]


@pytest.mark.django_db
def test_retrieve_own_account(auth_client: Client, user: User) -> None:
    account = _create_account(user)

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
    account = _create_account(user, name="Amazon")

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
    account = _create_account(user, type=Account.Type.GIFT_CARD)

    response = patch(auth_client, f"/accounts/{account.id}", {"type": new_type})

    assert response.status_code == 400
    account.refresh_from_db()
    assert account.type == Account.Type.GIFT_CARD


@pytest.mark.django_db
def test_put_is_not_allowed(auth_client: Client, user: User) -> None:
    account = _create_account(user)

    response = auth_client.put(
        f"/v1/accounts/{account.id}",
        data='{"name": "Amazon", "type": "gift_card"}',
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(auth_client),
    )

    assert response.status_code == 405


@pytest.mark.django_db
def test_delete_soft_deletes_and_hides_account(auth_client: Client, user: User) -> None:
    account = _create_account(user)

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
    account = _create_account(user)
    account.soft_delete()

    response = get(auth_client, "/accounts")

    assert response.json()["results"] == []


@pytest.mark.django_db
def test_cannot_retrieve_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)

    response = get(auth_client, f"/accounts/{account.id}")

    assert response.status_code == 404


@pytest.mark.django_db
def test_cannot_update_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)

    response = patch(auth_client, f"/accounts/{account.id}", {"name": "Hijacked"})

    assert response.status_code == 404
    account.refresh_from_db()
    assert account.name != "Hijacked"


@pytest.mark.django_db
def test_cannot_delete_another_users_account(
    auth_client: Client, other_user: User
) -> None:
    account = _create_account(other_user)

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
    accounts = [_create_account(user, name=f"Account {i}") for i in range(55)]
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
def test_deleting_user_cascades_to_soft_deleted_accounts(user: User) -> None:
    account = _create_account(user)
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
