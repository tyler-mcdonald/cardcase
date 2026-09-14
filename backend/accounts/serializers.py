from typing import ClassVar

from rest_framework import serializers

from .models import Account


class AccountSerializer(serializers.ModelSerializer[Account]):
    class Meta:
        model = Account
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "description",
            "type",
            "expires_on",
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
