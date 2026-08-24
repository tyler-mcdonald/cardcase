##### Functional Requirements

- User can authenticate via passwordless one-time email code
- New users cannot sign up until signup is explicitly enabled (`ALLOW_SIGNUP`)
- Client includes Bearer token on requests for session auth
- User can add, edit, or delete "accounts"
- User can add edit, or delete transactions against an account
- User can log out, ending their session

##### Non-Functional Requirements

- All accounts and transaction access is scoped to the authenticated user
- User sessions expire after 30 days
- User session tokens are opaque, high-entropy identifiers managed by django-allauth's session store (standard Django session-key auth, not custom-hashed)
- User verification tokens expire after 15 mins
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

- Auth (django-allauth headless, `app` client)
  - POST /_allauth/app/v1/auth/code/request
    - { email }
  - POST /_allauth/app/v1/auth/code/confirm
    - { code }
  - GET /_allauth/app/v1/auth/session
  - DELETE /_allauth/app/v1/auth/session
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
