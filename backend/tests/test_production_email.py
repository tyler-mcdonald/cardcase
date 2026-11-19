from anymail.backends.resend import EmailBackend
from django.core.mail import mailers
from django.test import override_settings

from config.settings import production


@override_settings(MAILERS=production.MAILERS)
def test_production_email_times_out_after_5s_connect_and_10s_read() -> None:
    backend = mailers["default"]

    assert isinstance(backend, EmailBackend)
    assert backend.timeout == (5, 10)
