from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from allauth.account.utils import filter_users_by_email
from allauth.headless.adapter import DefaultHeadlessAdapter
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.http import HttpRequest

from users.models import User

LOGIN_CODE_EMAIL_TEMPLATE = "account/email/login_code"
SIGNUP_WELCOME_EMAIL_TEMPLATE = "account/email/email_confirmation_signup"
UNDELIVERABLE_EMAIL_SUFFIX = ".invalid"


class AccountAdapter(DefaultAccountAdapter):  # type: ignore[misc]
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return bool(settings.ALLOW_SIGNUP)

    def send_mail(
        self, template_prefix: str, email: str, context: dict[str, Any]
    ) -> None:
        if email.lower().endswith(UNDELIVERABLE_EMAIL_SUFFIX):
            return
        if template_prefix == LOGIN_CODE_EMAIL_TEMPLATE:
            template_prefix, context = self._login_code_or_welcome_email(email, context)
        super().send_mail(template_prefix, email, context)

    def _login_code_or_welcome_email(
        self, email: str, context: dict[str, Any]
    ) -> tuple[str, dict[str, Any]]:
        user = self._unverified_new_user(email)
        if user is None:
            return LOGIN_CODE_EMAIL_TEMPLATE, context
        return SIGNUP_WELCOME_EMAIL_TEMPLATE, {**context, "user": user}

    def _unverified_new_user(self, email: str) -> User | None:
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


class HeadlessAdapter(DefaultHeadlessAdapter):  # type: ignore[misc]
    def serialize_user(self, user: AbstractBaseUser) -> dict[str, Any]:
        data: dict[str, Any] = super().serialize_user(user)
        return {**data, "is_demo": isinstance(user, User) and user.is_demo}
