from typing import cast

from django.db.models import QuerySet
from rest_framework import permissions, viewsets
from rest_framework.serializers import BaseSerializer

from users.models import User

from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(viewsets.ModelViewSet[Account]):
    serializer_class = AccountSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ("get", "post", "patch", "delete", "head", "options")

    def get_queryset(self) -> QuerySet[Account]:
        user = cast(User, self.request.user)
        return Account.objects.filter(user=user)

    def perform_create(self, serializer: BaseSerializer[Account]) -> None:
        user = cast(User, self.request.user)
        serializer.save(user=user)

    def perform_destroy(self, instance: Account) -> None:
        instance.soft_delete()
