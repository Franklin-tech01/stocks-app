/**
 * Central app configuration. External links can be overridden per environment
 * with env vars without touching components. The Telegram community links are
 * public invite links (not secrets), so they're the defaults; `||` (not `??`)
 * so an env var set to an empty string still falls back to them.
 */
export const links = {
  communityGroup:
    process.env.NEXT_PUBLIC_COMMUNITY_GROUP_URL || "https://t.me/+l7M2nPYgLN1hN2E0",
  communityChannel:
    process.env.NEXT_PUBLIC_COMMUNITY_CHANNEL_URL || "https://t.me/+04W6roYLCgcxN2Vk",
  whatsapp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_URL ?? "",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "",
};

/**
 * Promotional bonuses (NGN), paid from the operator's own funds — not from
 * user deposits. Credited to the balance on the server, but locked until the
 * user's first share purchase (see migration 0006). BONUSES_ENABLED is the
 * kill switch: false stops all new bonus credits immediately.
 */
export const BONUSES_ENABLED = true;
export const WELCOME_BONUS_AMOUNT = 600;
export const DAILY_LOGIN_BONUS = 200;

/**
 * Daily share earnings: a fixed payout per share held (see `shares.daily_earning`,
 * migration 0008), credited straight to `balance` once per UTC day — not a
 * promotional bonus, so it has its own kill switch independent of BONUSES_ENABLED.
 */
export const SHARE_EARNINGS_ENABLED = true;

export const COMMUNITY_POPUP_STORAGE_KEY = "stocks:community-popup-dismissed";

/**
 * Deposits (Korapay), share purchases and withdrawal requests are all live.
 * Withdrawals still have no automated payout provider — an admin reviews
 * and pays each one out manually (see /admin/withdrawals).
 */
export const WITHDRAWALS_ENABLED = true;

/** Smallest amount a user can deposit in one go (NGN). Enforced client + server side. */
export const MIN_DEPOSIT_AMOUNT = 3000;

/** Smallest withdrawal request (NGN). Enforced client + server side. */
export const MIN_WITHDRAWAL_AMOUNT = 800;

/** Share of each withdrawal kept as a charge; the user receives the rest. */
export const WITHDRAWAL_CHARGE_RATE = 0.2;

/** Share of every referred user's deposit credited to their referrer. */
export const REFERRAL_RATE = 0.2;

/** Length of every share plan, in days. */
export const PLAN_DURATION_DAYS = 38;
