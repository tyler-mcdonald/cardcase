from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.account.utils import filter_users_by_email
from django.conf import settings
from django.http import HttpRequest

from users.models import User


class AccountAdapter(DefaultAccountAdapter):  # type: ignore[misc]
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return bool(settings.ALLOW_SIGNUP)

    def send_mail(
        self, template_prefix: str, email: str, context: dict[str, Any]
    ) -> None:
        if template_prefix == "account/email/login_code":
            user = self._pending_signup_user(email)
            if user is not None:
                template_prefix = "account/email/email_confirmation_signup"
                context = {**context, "user": user}
        super().send_mail(template_prefix, email, context)

    def _pending_signup_user(self, email: str) -> User | None:
        if not self.is_open_for_signup(self.request):
            return None
        users = filter_users_by_email(email, is_active=True, prefer_verified=True)
        if len(users) != 1:
            return None
        user: User = users[0]
        if EmailAddress.objects.filter(
            user=user, email__iexact=email, verified=False
        ).exists():
            return user
        return None
