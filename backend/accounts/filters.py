from django_filters import rest_framework as filters

from .models import Transaction


class TransactionFilter(filters.FilterSet):  # type: ignore[misc]
    account = filters.UUIDFilter()

    class Meta:
        model = Transaction
        fields = ("account",)
