from accounts.models import Account, Transaction
from users.models import User


def create_account(owner: User, **overrides: object) -> Account:
    defaults: dict[str, object] = {"name": "Amazon", "type": Account.Type.GIFT_CARD}
    defaults.update(overrides)
    return Account.objects.create(user=owner, **defaults)


def create_transaction(account: Account, **overrides: object) -> Transaction:
    defaults: dict[str, object] = {"amount": "10.00", "occurred_on": "2026-01-01"}
    defaults.update(overrides)
    return Transaction.objects.create(account=account, **defaults)
