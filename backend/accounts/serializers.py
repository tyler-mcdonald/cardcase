from typing import Any, ClassVar

from rest_framework import serializers

from .models import Account


class AccountSerializer(serializers.ModelSerializer[Account]):
    expiration_date = serializers.DateField(
        source="expires_at", required=False, allow_null=True
    )

    class Meta:
        model = Account
        fields: ClassVar[list[str]] = [
            "id",
            "name",
            "description",
            "type",
            "expiration_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields: ClassVar[list[str]] = ["id", "created_at", "updated_at"]

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is not None and "type" in attrs:
            raise serializers.ValidationError(
                {"type": "This field cannot be changed after creation."}
            )
        return attrs
