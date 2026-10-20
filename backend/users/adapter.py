from typing import Any

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress
from django.conf import settings
from django.http import HttpRequest


class AccountAdapter(DefaultAccountAdapter):  # type: ignore[misc]
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return bool(settings.ALLOW_SIGNUP)

    def send_mail(
        self, template_prefix: str, email: str, context: dict[str, Any]
    ) -> None:
        if template_prefix == "account/email/login_code":
            address = self._pending_signup_address(email)
            if address is not None:
                template_prefix = "account/email/email_confirmation_signup"
                context = {**context, "user": address.user}
        super().send_mail(template_prefix, email, context)

    def _pending_signup_address(self, email: str) -> EmailAddress | None:
        if not self.is_open_for_signup(self.request):
            return None
        return EmailAddress.objects.filter(email__iexact=email, verified=False).first()
