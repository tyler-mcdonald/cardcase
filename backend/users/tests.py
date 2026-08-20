import json

from django.core import mail
from django.test import Client, TestCase, override_settings

from users.adapter import AccountAdapter
from users.models import User


class AccountAdapterTests(TestCase):
    def setUp(self):
        self.adapter = AccountAdapter()

    @override_settings(ALLOW_SIGNUP=True)
    def test_open_for_signup_when_flag_enabled(self):
        self.assertTrue(self.adapter.is_open_for_signup(None))

    @override_settings(ALLOW_SIGNUP=False)
    def test_closed_for_signup_when_flag_disabled(self):
        self.assertFalse(self.adapter.is_open_for_signup(None))


class LoginByCodeFlowTests(TestCase):
    def setUp(self):
        self.client = Client(headers={"content-type": "application/json"})
        self.user = User.objects.create_user(email="existing@example.com")

    def post(self, path, data, session_token=None):
        extra = {}
        if session_token:
            extra["HTTP_X_SESSION_TOKEN"] = session_token
        return self.client.post(
            f"/_allauth/app/v1{path}",
            data=json.dumps(data),
            content_type="application/json",
            **extra,
        )

    def test_request_code_for_unknown_email_does_not_create_user_or_send_code(self):
        response = self.post("/auth/code/request", {"email": "new@example.com"})

        self.assertFalse(User.objects.filter(email="new@example.com").exists())
        self.assertEqual(len(mail.outbox), 1)
        self.assertNotIn("code", mail.outbox[0].body.lower())
        self.assertIn(response.status_code, (200, 401))

    def test_request_and_confirm_code_for_existing_user_creates_session(self):
        request_response = self.post("/auth/code/request", {"email": self.user.email})
        session_token = request_response.json()["meta"]["session_token"]

        self.assertEqual(len(mail.outbox), 1)
        code = mail.outbox[0].body.split("\n\n")[2].strip()

        response = self.post(
            "/auth/code/confirm", {"code": code}, session_token=session_token
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertTrue(payload["data"]["user"]["id"])
        self.assertIn("session_token", payload["meta"])

    @override_settings(ALLOW_SIGNUP=False)
    def test_signup_endpoint_forbidden_when_signup_disabled(self):
        response = self.post(
            "/auth/signup",
            {"email": "new@example.com", "password": "a-strong-password-123"},
        )

        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.filter(email="new@example.com").exists())
