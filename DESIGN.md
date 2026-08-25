##### Functional Requirements

- User can authenticate via passwordless one-time email code
- New users cannot sign up until signup is explicitly enabled (`ALLOW_SIGNUP`)
- Client authenticates via a first-party session cookie; mutating requests include a CSRF token (`X-CSRFToken`)
- User can add, edit, or delete "accounts"
- User can add edit, or delete transactions against an account
- User can log out, ending their session

##### Non-Functional Requirements

- All accounts and transaction access is scoped to the authenticated user
- User sessions expire after 30 days
- User sessions are managed by django-allauth's session store via a first-party session cookie (standard Django session-key auth, not custom-hashed)
- User verification tokens expire after 3 mins (django-allauth's default)
- User email authentication will be rate-limited

##### Data Model

- User
  - id (pk): string/uuid
  - email: string
  - created_at: datetime
- Account
  - id (pk): string/uuid
  - user_id (fk): User
  - name: string
  - description: string
  - type: enum("gift_card", "flight_credit")
  - expires_at?: date
  - created_at: datetime
  - updated_at: datetime
  - deleted_at: datetime
- Transaction
  - id(pk): string/uuid
  - account(fk): Account
  - amount: numeric/decimal (always positive)
  - transaction_date: date
  - note: string
  - created_at: datetime
  - updated_at: datetime
  - type: enum("starting_balance", "redemption", "refund", "adjustment")

Email verification codes and sessions are managed internally by django-allauth
(no custom VerificationToken/UserSession models).

##### API Surface

- Auth (django-allauth headless, `browser` client; intended to be same-parent-domain with the frontend so session cookies are first-party. Only these routes are mounted -- see `users/headless_urls.py`)
  - POST /_allauth/browser/v1/auth/code/request
    - { email }
  - POST /_allauth/browser/v1/auth/code/confirm
    - { code }
  - POST /_allauth/browser/v1/auth/code/resend
  - POST /_allauth/browser/v1/auth/signup
    - { email }
  - GET /_allauth/browser/v1/auth/session
  - DELETE /_allauth/browser/v1/auth/session
- Accounts
  - POST /accounts
    - { name, description?, type, expiration_date?, starting_balance }
  - GET /accounts
  - GET /accounts/{id}
  - PATCH /accounts/{id}
    - { name?, description?, type?, expiration_date? }
  - DELETE /accounts/{id}
- Transactions
  - POST /accounts/{id}/transactions
    - { amount, note?, date, type }
  - GET /accounts/{id}/transactions
  - GET /accounts/{id}/transactions/{id}
  - PATCH /accounts/{id}/transactions/{id}
    - { amount?, note?, date?, type? }
  - DELETE /accounts/{id}/transactions/{id}
