from .base import *

DEBUG = False

# Security
# https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])  # pyright: ignore[reportArgumentType]

# https://render.com/docs/deploy-django#creating-a-new-django-project
RENDER_EXTERNAL_HOSTNAME = env.str("RENDER_EXTERNAL_HOSTNAME", default=None)  # pyright: ignore[reportArgumentType]
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

SECURE_SSL_REDIRECT = True

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# The frontend and API are deployed on separate subdomains, so cookies must
# be scoped to the parent domain for the frontend to read the CSRF cookie
# and send both cookies back to the API.
SESSION_COOKIE_DOMAIN = ".cardcase.jtm-dev.com"
CSRF_COOKIE_DOMAIN = ".cardcase.jtm-dev.com"

# Start as short as possible and ramp up to the standard 31536000 (1 year)
# once HTTPS is confirmed stable in production.
SECURE_HSTS_SECONDS = 60
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

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
