##### Functional Requirements

- User can authenticate via passwordless one-time email code
- New users cannot sign up until signups are enabled
- Client authenticates via a session cookie; mutating requests require CSRF protection
- User can add, edit, or delete "accounts"
- User can add edit, or delete transactions against an account
- User can log out, ending their session

##### Non-Functional Requirements

- All accounts and transaction access is scoped to the authenticated user
- A user can have up to 250 accounts (soft-deleted accounts don't count)
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
  - expires_on?: date
  - created_at: datetime
  - updated_at: datetime
  - deleted_at: datetime
- Transaction
  - id(pk): string/uuid
  - account(fk): Account
  - amount: numeric/decimal (signed; positive = credit, negative = spend)
  - occurred_on: date
  - description: string
  - created_at: datetime
  - updated_at: datetime

##### API Surface

- Auth (cookie session-based)
  - Request login code (email)
  - Confirm login code (code)
  - Resend login code
  - Sign up (email)
  - Get session / end session (log out)
- Accounts
  - POST /accounts
    - { name, description?, type, expires_on?, initial_balance }
    - initial_balance is write-only: a decimal >= 0; when > 0 it is saved as an "Initial balance" inflow transaction dated today
  - GET /accounts
    - ?page (default 1), ?page_size (default 50, max 250; larger values are clamped)
  - GET /accounts/{id}
  - PATCH /accounts/{id}
    - { name?, description?, type?, expires_on? }
  - DELETE /accounts/{id}
  - Every account response includes a read-only balance: the sum of its transactions' amounts
- Transactions
  - GET /transactions
    - All of the user's transactions across their non-deleted accounts
    - Ordered by occurred_on (newest first), then account name (A→Z), then newest created
    - ?page (default 1)
  - POST /accounts/{id}/transactions
    - { amount, description?, occurred_on }
  - GET /accounts/{id}/transactions
  - GET /accounts/{id}/transactions/{id}
  - PATCH /accounts/{id}/transactions/{id}
    - { amount?, description?, occurred_on? }
  - DELETE /accounts/{id}/transactions/{id}
  - Every transaction response includes a read-only account: { id, name, type }
