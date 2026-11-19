from accounts.models import Account
from demo.seed_data import SeedAccount, SeedTransaction

DEV_DATASET = (
    SeedAccount(
        name="Amazon",
        type=Account.Type.GIFT_CARD,
        brand_domain="amazon.com",
        description="Birthday gift from Mom",
        transactions=(
            SeedTransaction("250.00", "Birthday gift", 120),
            SeedTransaction("-23.99", "Phone case", 60),
            SeedTransaction("-12.49", "Kindle book", 7),
        ),
    ),
    SeedAccount(
        name="Delta",
        type=Account.Type.FLIGHT_CREDIT,
        brand_domain="delta.com",
        expires_in_days=365,
        transactions=(
            SeedTransaction("450.00", "Cancelled flight credit", 90),
            SeedTransaction("-75.00", "Seat upgrade", 45),
            SeedTransaction("-30.00", "Checked bag fee", 45),
        ),
    ),
    SeedAccount(
        name="Starbucks",
        type=Account.Type.GIFT_CARD,
        brand_domain="starbucks.com",
        expires_in_days=-30,
        transactions=(
            SeedTransaction("200.00", "Gift card reload", 100),
            SeedTransaction("-5.45", "Latte", 3),
            SeedTransaction("-8.90", "Breakfast sandwich and coffee", 0),
        ),
    ),
    SeedAccount(
        name="Southwest Airlines",
        type=Account.Type.FLIGHT_CREDIT,
        brand_domain="southwest.com",
        description="Chase Visa companion credit from Feb trip",
        expires_in_days=300,
        transactions=(
            SeedTransaction("320.00", "Companion credit", 80),
            SeedTransaction("-75.00", "Flight change fee", 20),
        ),
    ),
    SeedAccount(
        name="Southwest Airlines",
        type=Account.Type.FLIGHT_CREDIT,
        brand_domain="southwest.com",
        expires_in_days=180,
        transactions=(
            SeedTransaction("150.00", "Cancelled flight credit", 70),
            SeedTransaction("-35.00", "Carry-on bag", 10),
        ),
    ),
    SeedAccount(
        name="starbucks",
        type=Account.Type.GIFT_CARD,
        brand_domain="starbucks.com",
        transactions=(SeedTransaction("50.00", "Holiday gift card", 40),),
    ),
)
