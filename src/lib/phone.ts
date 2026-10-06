/**
 * Phone-number identity helpers (shared by client and server).
 *
 * Better Auth requires an email per account, and no SMS provider is connected,
 * so a phone number is mapped to a deterministic internal email:
 *   0801 234 5678  ->  2348012345678@phone.stocksusers.com
 * This address is never sent mail — it only satisfies email-shaped fields
 * (Better Auth, Korapay's customer.email). It deliberately does NOT use a
 * reserved non-deliverable TLD like `.invalid`: Korapay's own email format
 * validator rejects those outright, so deposits would fail for every user.
 * Users only ever see/type phone numbers.
 */
export const PLACEHOLDER_DOMAIN = "phone.stocksusers.com";
const DEFAULT_COUNTRY_CODE = "234"; // Nigeria

/** Returns digits in international format without "+", or null if invalid. */
export function normalizePhone(input: string): string | null {
  let d = input.trim().replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = DEFAULT_COUNTRY_CODE + d.slice(1);
  else if (/^[7-9]\d{9}$/.test(d)) d = DEFAULT_COUNTRY_CODE + d;
  return /^\d{10,15}$/.test(d) ? d : null;
}

export function phoneToEmail(digits: string) {
  return `${digits}@${PLACEHOLDER_DOMAIN}`;
}

export function formatPhone(digits: string | null | undefined) {
  return digits ? `+${digits.replace(/^\+/, "")}` : "—";
}

/** Hides the internal placeholder email from the UI. */
export function realEmail(email: string | null | undefined) {
  return email && !email.endsWith(`@${PLACEHOLDER_DOMAIN}`) ? email : null;
}
