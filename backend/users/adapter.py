from allauth.account.adapter import DefaultAccountAdapter
from django.conf import settings
from django.http import HttpRequest


class AccountAdapter(DefaultAccountAdapter):  # type: ignore[misc]
    def is_open_for_signup(self, request: HttpRequest) -> bool:
        return bool(settings.ALLOW_SIGNUP)
