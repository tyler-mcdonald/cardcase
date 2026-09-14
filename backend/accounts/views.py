from django.db.models import QuerySet
from rest_framework import viewsets
from rest_framework.serializers import BaseSerializer

from users.models import User

from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(viewsets.ModelViewSet[Account]):
    serializer_class = AccountSerializer
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    @property
    def user(self) -> User:
        if not isinstance(self.request.user, User):
            raise TypeError(
                f"Expected request.user to be a User, got {type(self.request.user).__name__}."
            )
        return self.request.user

    def get_queryset(self) -> QuerySet[Account]:
        return Account.objects.filter(user=self.user)

    def perform_create(self, serializer: BaseSerializer[Account]) -> None:
        serializer.save(user=self.user)

    def perform_destroy(self, instance: Account) -> None:
        instance.soft_delete()
