import "server-only";
import crypto from "node:crypto";
import { siteUrl } from "@/lib/config";

/**
 * Korapay standard (hosted) checkout — server-initiated, browser redirected.
 * https://developers.korapay.com/docs/checkout-redirect
 * https://developers.korapay.com/docs/webhooks
 */
const API_BASE = "https://api.korapay.com/merchant/api/v1";
const CHANNELS = new Set(["bank_transfer", "card"]);

function appUrl() {
  return siteUrl() ?? "http://localhost:3000";
}

export function webhookUrl() {
  return `${appUrl()}/api/webhooks/korapay`;
}

interface InitializeChargeInput {
  amount: number;
  reference: string;
  email: string;
  name: string;
  method: string;
}

export async function initializeCharge(input: InitializeChargeInput) {
  const secretKey = process.env.KORAPAY_SECRET_KEY;
  if (!secretKey) throw new Error("KORAPAY_SECRET_KEY is not configured");

  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: "NGN",
    reference: input.reference,
    customer: { email: input.email, name: input.name },
    redirect_url: `${appUrl()}/dashboard?deposit=${input.reference}`,
    notification_url: webhookUrl(),
    narration: "Stocks wallet deposit",
  };
  if (CHANNELS.has(input.method)) {
    body.channels = [input.method];
    body.default_channel = input.method;
  }

  const res = await fetch(`${API_BASE}/charges/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secretKey}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.status || !json?.data?.checkout_url) {
    throw new Error(json?.message ?? `Korapay initialize failed (${res.status})`);
  }
  return { checkoutUrl: json.data.checkout_url as string, reference: (json.data.reference as string) ?? input.reference };
}

/**
 * Verifies the `x-korapay-signature` header: HMAC-SHA256 of the `data` object
 * (re-serialized as received), hex-encoded, signed with the secret key.
 */
export function verifyWebhookSignature(data: unknown, signature: string | null): boolean {
  const secretKey = process.env.KORAPAY_SECRET_KEY;
  if (!secretKey || !signature || data === undefined) return false;
  const expected = crypto.createHmac("sha256", secretKey).update(JSON.stringify(data)).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
