from typing import Any

from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress
from allauth.headless.account.views import RequestLoginCodeView
from django.db import transaction
from django.http import HttpRequest, HttpResponse

from users.models import User


class RequestLoginOrSignupCodeView(RequestLoginCodeView):  # type: ignore[misc]
    def post(self, request: HttpRequest, *args: Any, **kwargs: Any) -> HttpResponse:
        email = self.input.cleaned_data.get("email")
        if (
            email
            and self.input._user is None
            and get_adapter(request).is_open_for_signup(request)
        ):
            self.input._user = _create_unverified_user(email)
        return super().post(request, *args, **kwargs)  # type: ignore[no-any-return]


@transaction.atomic
def _create_unverified_user(email: str) -> User:
    email = email.lower()
    user = User.objects.create_user(email=email)
    EmailAddress.objects.create(user=user, email=email, primary=True, verified=False)
    return user
