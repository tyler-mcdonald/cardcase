from datetime import date, timedelta
from typing import Any

from accounts.models import Account


def sample_accounts(today: date) -> dict[str, dict[str, Any]]:
    return {
        "Amazon": {
            "type": Account.Type.GIFT_CARD,
            "description": "Birthday gift from Mom",
        },
        "Delta": {
            "type": Account.Type.FLIGHT_CREDIT,
            "expires_on": today + timedelta(days=365),
        },
        "Starbucks": {
            "type": Account.Type.GIFT_CARD,
            "expires_on": today - timedelta(days=30),
        },
    }
