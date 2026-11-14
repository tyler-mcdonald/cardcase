from django_filters import rest_framework as filters


class TransactionFilter(filters.FilterSet):  # type: ignore[misc]
    account = filters.UUIDFilter()
