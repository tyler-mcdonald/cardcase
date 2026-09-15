from typing import Any

from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.serializers import BaseSerializer

from users.models import User

from .models import Account, Transaction
from .serializers import AccountSerializer, TransactionSerializer


class UserScopedViewSet(viewsets.ModelViewSet[Any]):
    @property
    def user(self) -> User:
        if not isinstance(self.request.user, User):
            raise TypeError(
                f"Expected request.user to be a User, got {type(self.request.user).__name__}."
            )
        return self.request.user


class AccountViewSet(UserScopedViewSet):
    serializer_class = AccountSerializer
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self) -> QuerySet[Account]:
        return Account.objects.filter(user=self.user)

    def perform_create(self, serializer: BaseSerializer[Account]) -> None:
        serializer.save(user=self.user)

    def perform_destroy(self, instance: Account) -> None:
        instance.soft_delete()


class TransactionViewSet(UserScopedViewSet):
    serializer_class = TransactionSerializer

    def get_account(self) -> Account:
        return get_object_or_404(Account, id=self.kwargs["account_id"], user=self.user)

    def get_queryset(self) -> QuerySet[Transaction]:
        return Transaction.objects.filter(account=self.get_account())

    def perform_create(self, serializer: BaseSerializer[Transaction]) -> None:
        serializer.save(account=self.get_account())
