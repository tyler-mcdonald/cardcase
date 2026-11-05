from typing import Any

from django.contrib.auth import login
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from demo.services import DEMO_LIFETIME, delete_expired_demo_users, start_demo
from users.models import User


class CsrfEnforcedSessionAuthentication(SessionAuthentication):
    def authenticate(self, request: Request) -> tuple[Any, None] | None:
        self.enforce_csrf(request)
        return super().authenticate(request)


class DemoStartThrottle(AnonRateThrottle):
    scope = "demo_start"

    def get_ident(self, request: Request) -> str:
        return request.META.get("HTTP_TRUE_CLIENT_IP") or super().get_ident(request)


def _signed_in_response(user: Any) -> Response:
    if isinstance(user, User) and user.is_demo:
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(status=status.HTTP_409_CONFLICT)


class DemoStartView(APIView):
    authentication_classes = (CsrfEnforcedSessionAuthentication,)
    permission_classes = (AllowAny,)
    throttle_classes = (DemoStartThrottle,)

    def post(self, request: Request) -> Response:
        if request.user.is_authenticated:
            return _signed_in_response(request.user)

        delete_expired_demo_users()
        user = start_demo()
        login(request._request, user)
        request.session.set_expiry(int(DEMO_LIFETIME.total_seconds()))
        return Response(status=status.HTTP_204_NO_CONTENT)
