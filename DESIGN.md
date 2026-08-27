##### Functional Requirements

- User can authenticate via passwordless one-time email code
- New users cannot sign up until signups are enabled
- Client authenticates via a session cookie; mutating requests require CSRF protection
- User can add, edit, or delete "accounts"
- User can add edit, or delete transactions against an account
- User can log out, ending their session

##### Non-Functional Requirements

- All accounts and transaction access is scoped to the authenticated user
- User sessions expire after 30 days
- Browser sessions are cookie-based
- Verification codes expire after a few minutes
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

##### API Surface

- Auth (cookie session-based)
  - Request login code (email)
  - Confirm login code (code)
  - Resend login code
  - Sign up (email)
  - Get session / end session (log out)
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
