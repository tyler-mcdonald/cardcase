from .base import *

# Email
# https://pypi.org/project/django-anymail/

MAILERS = {
    "default": {
        "BACKEND": "anymail.backends.resend.EmailBackend",
        "OPTIONS": {
            "api_key": RESEND_API_KEY,
        },
    },
}

# Do not change this unless you've updated the domain with the provider,
# which should happen rarely, if ever.
DEFAULT_FROM_EMAIL = "noreply@mail.cardcase.jtm-dev.com"
