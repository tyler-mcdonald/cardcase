from decimal import Decimal, DefaultContext
from typing import Any, ClassVar

from django.utils import timezone
from rest_framework import serializers

from .models import MAX_ACCOUNTS_PER_USER, MAX_TRANSACTION_AMOUNT, Account, Transaction

_AMOUNT_FIELD = Transaction._meta.get_field("amount")


class AccountSerializer(serializers.ModelSerializer[Account]):
    balance = serializers.DecimalField(
        max_digits=DefaultContext.prec, decimal_places=2, required=False
    )
    initial_balance = serializers.DecimalField(
        max_digits=_AMOUNT_FIELD.max_digits,
        decimal_places=_AMOUNT_FIELD.decimal_places,
        min_value=Decimal(0),
        default=Decimal(0),
        write_only=True,
    )

    class Meta:
        model = Account
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "description",
            "type",
            "brand_domain",
            "expires_on",
            "balance",
            "initial_balance",
            "created_at",
            "updated_at",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "created_at", "updated_at"]

    def _create_only[T](self, value: T) -> T:
        if self.instance is not None:
            raise serializers.ValidationError(
                "This field cannot be changed after creation."
            )
        return value

    validate_type = _create_only
    validate_initial_balance = _create_only

    def validate_brand_domain(self, value: str) -> str:
        return value.lower()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is None and self._at_account_limit():
            raise serializers.ValidationError(
                f"You can only have up to {MAX_ACCOUNTS_PER_USER} accounts."
            )
        balance = attrs.pop("balance", None)
        if self.instance is not None and balance is not None:
            attrs["balance_change"] = self._balance_change(self.instance, balance)
        return attrs

    def create(self, validated_data: dict[str, Any]) -> Account:
        initial_balance = validated_data.pop("initial_balance")
        account = super().create(validated_data)
        if initial_balance > 0:
            Transaction.objects.create(
                account=account,
                amount=initial_balance,
                description="Initial balance",
                occurred_on=timezone.localdate(),
            )
        return account

    def update(self, instance: Account, validated_data: dict[str, Any]) -> Account:
        balance_change = validated_data.pop("balance_change", Decimal(0))
        account = super().update(instance, validated_data)
        if balance_change != 0:
            Transaction.objects.create(
                account=account,
                amount=balance_change,
                description="Manual Balance Adjustment",
                occurred_on=timezone.localdate(),
            )
        return account

    def _balance_change(self, account: Account, balance: Decimal) -> Decimal:
        current: Decimal = account.balance  # type: ignore[attr-defined]
        change = balance - current
        if abs(change) > MAX_TRANSACTION_AMOUNT:
            raise serializers.ValidationError(
                {
                    "balance": f"Ensure the balance changes by no more than {MAX_TRANSACTION_AMOUNT}."
                }
            )
        return change

    def _at_account_limit(self) -> bool:
        user = self.context["request"].user
        return Account.objects.filter(user=user).count() >= MAX_ACCOUNTS_PER_USER


class TransactionAccountSerializer(AccountSerializer):
    class Meta(AccountSerializer.Meta):
        fields: ClassVar[list[str]] = ["id", "name", "type"]


class TransactionSerializer(serializers.ModelSerializer[Transaction]):
    account = TransactionAccountSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields: ClassVar[list[str]] = [
            "id",
            "account",
            "amount",
            "description",
            "occurred_on",
            "created_at",
            "updated_at",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "created_at", "updated_at"]
