import random
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from allauth.account.models import EmailAddress
from django.utils import timezone

from accounts.models import Account, Transaction
from users.models import User

GENERATED_SPENDS_PER_ACCOUNT = 17
GENERATED_SPEND_CENTS_RANGE = (100, 2000)
GENERATED_SPEND_DAYS_AGO_RANGE = (0, 120)
GENERATED_SPENDS_RANDOM_SEED = 0


@dataclass(frozen=True)
class SeedTransaction:
    amount: str
    description: str
    days_ago: int


@dataclass(frozen=True)
class SeedAccount:
    name: str
    type: Account.Type
    brand_domain: str = ""
    description: str = ""
    expires_in_days: int | None = None
    transactions: tuple[SeedTransaction, ...] = ()


@dataclass(frozen=True)
class SeedResult:
    account_count: int = 0
    transaction_count: int = 0


def get_or_create_seed_user(email: str) -> User:
    return User.objects.filter(email=email).first() or create_verified_user(email)


def seed_user(user: User, dataset: Sequence[SeedAccount]) -> SeedResult:
    if Account.objects.filter(user=user).exists():
        return SeedResult()
    today = timezone.localdate()
    rng = random.Random(GENERATED_SPENDS_RANDOM_SEED)
    accounts = Account.objects.bulk_create(
        _build_account(user, seed, today) for seed in dataset
    )
    transactions = Transaction.objects.bulk_create(
        transaction
        for account, seed in zip(accounts, dataset, strict=True)
        for transaction in _build_transactions(account, seed, today, rng)
    )
    return SeedResult(len(accounts), len(transactions))


def _build_account(user: User, seed: SeedAccount, today: date) -> Account:
    expires_on = (
        None
        if seed.expires_in_days is None
        else today + timedelta(days=seed.expires_in_days)
    )
    return Account(
        user=user,
        name=seed.name,
        type=seed.type,
        brand_domain=seed.brand_domain,
        description=seed.description,
        expires_on=expires_on,
    )


def _build_transactions(
    account: Account, seed: SeedAccount, today: date, rng: random.Random
) -> list[Transaction]:
    rows = list(seed.transactions) + [
        _random_spend(rng, seed.name) for _ in range(GENERATED_SPENDS_PER_ACCOUNT)
    ]
    return [
        Transaction(
            account=account,
            amount=Decimal(row.amount),
            description=row.description,
            occurred_on=today - timedelta(days=row.days_ago),
        )
        for row in rows
    ]


def _random_spend(rng: random.Random, name: str) -> SeedTransaction:
    cents = rng.randint(*GENERATED_SPEND_CENTS_RANGE)
    days_ago = rng.randint(*GENERATED_SPEND_DAYS_AGO_RANGE)
    return SeedTransaction(str(-Decimal(cents) / 100), f"{name} purchase", days_ago)


def create_verified_user(email: str, **extra_fields: Any) -> User:
    user = User.objects.create_user(email, **extra_fields)
    EmailAddress.objects.create(user=user, email=email, verified=True, primary=True)
    return user
