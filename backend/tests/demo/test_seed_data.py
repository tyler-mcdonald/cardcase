import pytest

from accounts.models import Account, Transaction
from demo.seed_data import (
    GENERATED_SPENDS_PER_ACCOUNT,
    SeedAccount,
    SeedResult,
    SeedTransaction,
    seed_accounts_and_transactions,
)
from tests.accounts.factories import create_account
from users.models import User

pytestmark = pytest.mark.django_db

TWINS = (
    SeedAccount(
        name="Twin",
        type=Account.Type.GIFT_CARD,
        transactions=(SeedTransaction("10.00", "First twin load", 1),),
    ),
    SeedAccount(
        name="Twin",
        type=Account.Type.GIFT_CARD,
        transactions=(SeedTransaction("20.00", "Second twin load", 2),),
    ),
)


def _generated_spends(account: Account) -> set[tuple[str, str]]:
    return {
        (str(t.amount), t.description)
        for t in account.transactions.filter(description=f"{account.name} purchase")
    }


def test_seed_user_keeps_same_name_accounts_and_their_transactions_apart(
    user: User,
) -> None:
    result = seed_accounts_and_transactions(user, TWINS)

    assert result == SeedResult(2, 2 * (1 + GENERATED_SPENDS_PER_ACCOUNT))
    first = Account.objects.get(user=user, transactions__description="First twin load")
    second = Account.objects.get(
        user=user, transactions__description="Second twin load"
    )
    assert first != second
    assert first.name == second.name == "Twin"
    assert _generated_spends(first) != _generated_spends(second)


def test_seed_user_adds_nothing_when_user_has_accounts(user: User) -> None:
    create_account(user)

    result = seed_accounts_and_transactions(user, TWINS)

    assert result == SeedResult()
    assert Account.objects.filter(user=user).count() == 1
    assert not Transaction.objects.filter(account__user=user).exists()
