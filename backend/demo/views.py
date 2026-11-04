from typing import Any

from django.contrib.auth import login
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from demo.services import DEMO_LIFETIME, start_demo
from users.models import User


class CsrfEnforcedSessionAuthentication(SessionAuthentication):
    def authenticate(self, request: Request) -> tuple[Any, None] | None:
        self.enforce_csrf(request)
        return super().authenticate(request)


class DemoStartThrottle(AnonRateThrottle):
    scope = "demo_start"


class DemoStartView(APIView):
    authentication_classes = (CsrfEnforcedSessionAuthentication,)
    permission_classes = (AllowAny,)
    throttle_classes = (DemoStartThrottle,)

    def post(self, request: Request) -> Response:
        if request.user.is_authenticated:
            if isinstance(request.user, User) and request.user.is_demo:
                return Response(status=status.HTTP_204_NO_CONTENT)
            return Response(status=status.HTTP_409_CONFLICT)

        user = start_demo()
        login(request._request, user)
        request.session.set_expiry(int(DEMO_LIFETIME.total_seconds()))
        return Response(status=status.HTTP_204_NO_CONTENT)
