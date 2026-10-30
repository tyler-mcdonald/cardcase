from typing import Any

from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from allauth.headless.account.views import RequestLoginCodeView
from django.db import IntegrityError, transaction
from django.http import HttpRequest, HttpResponse

from users.models import User


class RequestLoginOrSignupCodeView(RequestLoginCodeView):  # type: ignore[misc]
    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        if self._is_signup(request):
            self._sign_up(request, self.input.cleaned_data["email"])
        return super().post(request, *args, **kwargs)  # type: ignore[no-any-return]

    def _is_signup(self, request: HttpRequest) -> bool:
        return bool(
            self.input.cleaned_data.get("email")
            and self.input._user is None
            and get_adapter(request).is_open_for_signup(request)
        )

    def _sign_up(self, request: HttpRequest, email: str) -> None:
        user = _find_or_create_unverified_user(request, email)
        if user is not None and user.is_active:
            self.input._user = user


def _find_or_create_unverified_user(request: HttpRequest, email: str) -> User | None:
    user = _find_user(email)
    if user is not None:
        return user
    try:
        return _create_unverified_user(request, email)
    except IntegrityError:
        # A concurrent request created this user between the lookup and insert.
        return _find_user(email)


def _find_user(email: str) -> User | None:
    return User.objects.filter(email__iexact=email).first()


@transaction.atomic
def _create_unverified_user(request: HttpRequest, email: str) -> User:
    user = User.objects.create_user(email=email)
    setup_user_email(request, user, [])
    return user
