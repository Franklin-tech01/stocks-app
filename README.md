# Stocks

Share marketplace built with Next.js (App Router), TypeScript, Tailwind v4, Better Auth and Neon (PostgreSQL).
Users sign up and log in with a **phone number + password** (no email).
No landing page: `/` sends signed-out users to `/login`, signed-in users to `/dashboard`.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and set `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET`
   (`npx @better-auth/cli secret`), and the community links.
3. `npm run db:migrate` applies any unapplied files in `db/migrations` (tracked in `schema_migrations`).
4. Fill in prices in `db/seed_shares.sql` (**taken from your reference image; none are invented**), then `npm run db:seed`.
5. Optional demo data for one account: edit the phone number in `db/seed_demo_user.sql` and run
   `node --env-file=.env.local scripts/db-apply.mjs db/seed_demo_user.sql`. Rows are marked `[Demo]`.
6. Set `KORAPAY_SECRET_KEY` (deposits won't work without it — see below).
7. Set `OTPAY_API_KEY`, `OTPAY_SECRET_KEY`, `OTPAY_BUSINESS_CODE` (needed for the withdraw form's bank list
   and account verification, and for the admin payout button — see below).
8. Grant yourself admin access: `node --env-file=.env.local scripts/set-admin.mjs +2348012345678`
   (use the phone number you registered with). Revoke with `--revoke`.
9. `npm run dev`

## Where things live

- Design tokens: `src/app/globals.css`
- Links/config: `src/lib/config.ts` (env-driven community/support links, daily reward amounts,
  `WITHDRAWALS_ENABLED`, `MIN_DEPOSIT_AMOUNT`)
- Auth: `src/lib/auth.ts` (server), `src/lib/auth-client.ts` (browser), `src/proxy.ts` (optimistic redirect)
- Data access: `src/lib/data/index.ts` (cached server reads, all scoped by the signed-in user);
  `src/lib/data/admin.ts` is the one place that intentionally reads across all users — never import it
  into user-facing pages
- Payments: `src/lib/actions/payments.ts`, `src/lib/korapay.ts` (deposits in), `src/lib/otpay.ts`
  (withdrawal payouts out). Deposits, share purchases, withdrawal requests and payout are all live.

## Admin (`/admin`)

Gated by `profiles.is_admin` (`requireAdmin()` in `src/lib/data/admin.ts`), checked server-side on every
admin page — there's no client-side-only gate to bypass. Grant it with `scripts/set-admin.mjs`.

- **Overview** — totals: users, deposits completed, deposits pending, withdrawals awaiting payout, share
  purchases.
- **Deposits** / **Purchases** — read-only history across all users.
- **Withdrawals** — every request with the user's bank details (verified account name, account number,
  bank). Pending ones get up to three buttons:
  - **Pay via OTPay**: calls OTPay's real payout API for this exact amount/account, then marks the
    withdrawal `completed` with the returned reference and fee. Only shown when the request has a
    `bank_code` on file. **This moves real money immediately and cannot be undone** — the button has a
    confirm dialog for that reason.
  - **Mark Paid**: flips status to `completed` without calling OTPay. Use this only after paying the user
    yourself some other way (e.g. your own bank transfer) — it moves no money itself.
  - **Reject**: flips status to `failed` and refunds the held amount back to the user's balance.

The balance is held (debited) the moment a user **requests** a withdrawal, not when it's paid out — so a
user can never request more than they have or double-spend a pending request across two withdrawals.

**Double-payout protection**: OTPay's payout API accepts no idempotency key, so nothing about the request
itself protects against calling it twice for the same withdrawal. Instead, `payoutViaOtpay` claims a
short-lived lock (`withdrawals.locked_at`) *before* calling OTPay at all; a second click or a second admin
sees it locked and is refused immediately, without OTPay ever being called twice. If OTPay's response is
unreadable or the request times out — a genuinely unknown outcome, not a confirmed failure — the lock is
deliberately left in place rather than cleared, and the admin is told to check OTPay's own dashboard before
touching that withdrawal again. The lock expires after 2 minutes as a last resort, not as an invitation to
retry blindly. `markWithdrawalPaid` and `rejectWithdrawal` also refuse to run while a withdrawal is locked.

## Payments (Korapay)

Deposits use Korapay's hosted checkout. The flow:

1. `initiateDeposit` (server action) records a **pending** `deposits` + `transactions` row, then asks
   Korapay for a checkout URL. The browser is redirected there — no balance is touched yet.
2. Korapay calls `POST /api/webhooks/korapay` when the charge succeeds or fails. That route verifies
   `x-korapay-signature` (HMAC-SHA256 of the `data` object, signed with `KORAPAY_SECRET_KEY`) and is the
   **only** place a deposit ever credits `portfolios.balance`. It's idempotent: a retried webhook for an
   already-completed deposit updates nothing.
3. In the Korapay dashboard, set the webhook URL to `<your deployed URL>/api/webhooks/korapay`.

Share purchases spend the user's Stocks balance directly (no external payment): `purchaseShare` debits the
balance, inserts the holding, and inserts the transaction in one DB transaction
(`src/lib/db.ts:withTransaction`), so a purchase can't charge without recording it or vice versa. It
fails cleanly on insufficient balance.

Withdrawal *requests* are real (see Admin below for payout); `WITHDRAWALS_ENABLED` in `src/lib/config.ts`
is a kill switch to pause new requests without a code change if needed.

`KORAPAY_PUBLIC_KEY` and `KORAPAY_ENCRYPTION_KEY` are captured in `.env.local` but unused — they're only
needed for an inline widget or direct card charges, neither implemented here.

## Security model

Neon has no per-user RLS, so authorization lives in server code:

- The database is only reachable from the server (`DATABASE_URL` is never `NEXT_PUBLIC_`).
- Every user-owned query filters by the authenticated user id; `requireUser()` validates the session in the app layout.
- Users can only edit their `full_name` (the phone number is their login). Balances, transactions, bonuses and status are never writable from the browser.
- Phone login: Better Auth needs an email, so a phone maps to an internal `<digits>@phone.stocksusers.com` address (`src/lib/phone.ts`) that is never sent mail — it only satisfies email-shaped fields (Better Auth, Korapay's `customer.email`). It intentionally isn't on a reserved TLD like `.invalid`: Korapay's own email validator rejects those. Numbers are normalized (default country code +234). Self-service password reset needs an SMS provider (not connected); until then support resets passwords and `/forgot-password` points to support.

## Promotional bonuses

A ₦700 welcome bonus (once, on first login) and a ₦200 daily login bonus (once per UTC day) are credited by
`recordLogin` in `src/lib/actions/account.ts`. Amounts and the `BONUSES_ENABLED` kill switch live in
`src/lib/config.ts`. They're paid from the **operator's own funds** — never from user deposits — so keep the
OTPay payout wallet funded separately.

- Credited money goes into the normal `balance` and is also counted in `portfolios.locked_bonus`. Withdrawable
  = `balance - locked_bonus`, so a user's **own deposits are never locked**, only bonus money. The user's first
  completed share purchase sets `locked_bonus` to 0.
- Each credit is claimed with a guarded UPDATE inside one DB transaction, so repeat calls / two tabs / races
  credit nothing twice. The client sends no amounts.
- `/admin` shows **Bonuses credited** (total promo spend) and **Bonus money still locked**.
- Nothing about a balance is stored in the browser.

## Referral links

Every profile has a unique `ref_code` (8 characters, created by the database). The dashboard's **Your Invite
Link** card shows `<site>/register?ref=CODE` and how many accounts signed up through it. On signup, the
register page calls `applyReferral`, which sets `referred_by` — only for an account with no referrer that is
under 15 minutes old, and never for your own code. **Tracking only: no rewards, commissions or payouts are
attached to referrals anywhere in the app**, and the count shows no names or numbers.
