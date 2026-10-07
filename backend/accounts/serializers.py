from typing import Any, ClassVar

from rest_framework import serializers

from .models import MAX_ACCOUNTS_PER_USER, Account, Transaction


class AccountSerializer(serializers.ModelSerializer[Account]):
    balance = serializers.DecimalField(
        max_digits=None, decimal_places=2, read_only=True
    )

    class Meta:
        model = Account
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "description",
            "type",
            "expires_on",
            "balance",
            "created_at",
            "updated_at",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "created_at", "updated_at"]

    def validate_type(self, value: str) -> str:
        if self.instance is not None:
            raise serializers.ValidationError(
                "This field cannot be changed after creation."
            )
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is None and self._at_account_limit():
            raise serializers.ValidationError(
                f"You can only have up to {MAX_ACCOUNTS_PER_USER} accounts."
            )
        return attrs

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
