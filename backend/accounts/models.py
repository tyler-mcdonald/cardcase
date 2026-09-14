import uuid
from typing import ClassVar

from django.conf import settings
from django.db import models
from django.utils import timezone


class AccountManager(models.Manager["Account"]):
    def get_queryset(self) -> models.QuerySet["Account"]:
        return super().get_queryset().filter(deleted_at__isnull=True)


class Account(models.Model):
    class Type(models.TextChoices):
        GIFT_CARD = "gift_card", "Gift card"
        FLIGHT_CREDIT = "flight_credit", "Flight credit"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="accounts"
    )
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=1000, blank=True, default="")
    type = models.CharField(max_length=20, choices=Type.choices)
    expires_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects: ClassVar[AccountManager] = AccountManager()
    all_objects: ClassVar[models.Manager["Account"]] = models.Manager()

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.name

    def soft_delete(self) -> None:
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])
