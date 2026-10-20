from typing import Any

from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from allauth.headless.account.views import RequestLoginCodeView
from django.db import IntegrityError, transaction
from django.http import HttpRequest, HttpResponse

from users.models import User


class RequestLoginOrSignupCodeView(RequestLoginCodeView):  # type: ignore[misc]
    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        email = self.input.cleaned_data.get("email")
        if (
            email
            and self.input._user is None
            and get_adapter(request).is_open_for_signup(request)
            and not User.objects.filter(email__iexact=email).exists()
        ):
            try:
                self.input._user = _create_unverified_user(request, email)
            except IntegrityError:
                pass
        return super().post(request, *args, **kwargs)  # type: ignore[no-any-return]


@transaction.atomic
def _create_unverified_user(request: HttpRequest, email: str) -> User:
    user = User.objects.create_user(email=email.lower())
    setup_user_email(request, user, [])
    return user
