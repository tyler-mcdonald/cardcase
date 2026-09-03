from typing import Any

from django.conf import settings
from django.core.checks import Error, register


@register()
def check_frontend_url_configured_for_signup(
    app_configs: Any, **kwargs: Any
) -> list[Error]:
    """Ensure that a non-local frontend url is provided when user signup is live."""
    if settings.ALLOW_SIGNUP and settings.FRONTEND_URL.startswith("http://localhost"):
        return [
            Error(
                "ALLOW_SIGNUP is on but FRONTEND_URL is still a localhost "
                "placeholder -- the signup-invite email sent to unknown "
                "addresses will link nowhere.",
                hint="Set the FRONTEND_URL environment variable to the real "
                "frontend origin before enabling signups.",
                id="users.E001",
            )
        ]
    return []
