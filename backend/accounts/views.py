from typing import Any

from django.db import transaction
from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from users.models import User

from .models import MAX_ACCOUNTS_PER_USER, Account, Transaction
from .serializers import AccountSerializer, TransactionSerializer


class UserScopedViewSet(viewsets.ModelViewSet[Any]):
    @property
    def user(self) -> User:
        if not isinstance(self.request.user, User):
            raise TypeError(
                f"Expected request.user to be a User, got {type(self.request.user).__name__}."
            )
        return self.request.user


class AccountPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = MAX_ACCOUNTS_PER_USER


class AccountViewSet(UserScopedViewSet):
    serializer_class = AccountSerializer
    pagination_class = AccountPagination
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self) -> QuerySet[Account]:
        return Account.objects.filter(user=self.user)

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        with transaction.atomic():
            User.objects.select_for_update().get(pk=self.user.pk)
            return super().create(request, *args, **kwargs)

    def perform_create(self, serializer: BaseSerializer[Account]) -> None:
        serializer.save(user=self.user)

    def perform_destroy(self, instance: Account) -> None:
        instance.soft_delete()


class TransactionViewSet(UserScopedViewSet):
    serializer_class = TransactionSerializer

    def get_account(self) -> Account:
        return get_object_or_404(Account, id=self.kwargs["account_id"], user=self.user)

    def get_queryset(self) -> QuerySet[Transaction]:
        return Transaction.objects.filter(account=self.get_account()).select_related(
            "account"
        )

    def perform_create(self, serializer: BaseSerializer[Transaction]) -> None:
        serializer.save(account=self.get_account())


class UserTransactionViewSet(UserScopedViewSet):
    serializer_class = TransactionSerializer

    def get_queryset(self) -> QuerySet[Transaction]:
        return (
            Transaction.objects.filter(
                account__in=Account.objects.filter(user=self.user)
            )
            .select_related("account")
            .order_by("-occurred_on", "account__name", "-created_at", "-id")
        )
