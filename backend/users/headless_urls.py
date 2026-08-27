from allauth.headless.account import views
from allauth.headless.constants import Client
from django.urls import include, path

urlpatterns = [
    path(
        "browser/v1/",
        include(
            [
                path(
                    "auth/session",
                    views.SessionView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/code/request",
                    views.RequestLoginCodeView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/code/confirm",
                    views.ConfirmLoginCodeView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/code/resend",
                    views.ResendLoginCodeView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/signup",
                    views.SignupView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/email/verify",
                    views.VerifyEmailView.as_api_view(client=Client.BROWSER),
                ),
                path(
                    "auth/email/verify/resend",
                    views.ResendEmailVerificationCodeView.as_api_view(
                        client=Client.BROWSER
                    ),
                ),
            ]
        ),
    ),
]
