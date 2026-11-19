from unittest.mock import Mock, patch

from anymail.backends.resend import EmailBackend
from django.core.mail import EmailMessage, mailers
from django.test import override_settings

from config.settings import production


@override_settings(MAILERS=production.MAILERS)
def test_production_email_times_out_after_5s_connect_and_10s_read() -> None:
    backend = mailers["default"]
    assert isinstance(backend, EmailBackend)

    response = Mock(status_code=200)
    response.json.return_value = {"id": "message-id"}
    message = EmailMessage("Subject", "Body", "from@example.com", ["to@example.com"])

    with patch("requests.Session.request", return_value=response) as request:
        backend.send_messages([message])

    assert request.call_args.kwargs["timeout"] == (5, 10)
