import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/korapay";
import { REFERRAL_RATE } from "@/lib/config";

export const runtime = "nodejs";

interface KorapayChargeData {
  reference?: string;
  payment_reference?: string;
  status?: string;
}

/**
 * Korapay webhook: the only place a deposit ever credits a balance.
 * https://developers.korapay.com/docs/webhooks
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 });

  const signature = request.headers.get("x-korapay-signature");
  if (!verifyWebhookSignature((body as Record<string, unknown>).data, signature)) {
    console.warn("[korapay webhook] invalid or missing signature");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const event = (body as Record<string, unknown>).event as string | undefined;
  const data = (body as Record<string, unknown>).data as KorapayChargeData | undefined;
  const ref = data?.reference ?? data?.payment_reference;
  if (!ref) return NextResponse.json({ ok: true });

  try {
    if (event === "charge.success" && data?.status === "success") {
      // The WHERE status='pending' makes this idempotent: a retried webhook
      // for an already-completed deposit updates zero rows and credits nothing twice.
      await withTransaction(async (q) => {
        const [deposit] = await q<{ user_id: string; amount: number }>(
          "update deposits set status = 'completed' where payment_reference = $1 and status = 'pending' returning user_id, amount",
          [ref],
        );
        if (!deposit) return;
        await q("update portfolios set balance = balance + $1 where user_id = $2", [
          deposit.amount,
          deposit.user_id,
        ]);
        await q("update transactions set status = 'completed' where reference = $1", [ref]);

        // Credit REFERRAL_RATE of the deposit to whoever referred this user.
        const [profile] = await q<{ referred_by: string | null }>(
          "select referred_by from profiles where id = $1",
          [deposit.user_id],
        );
        if (profile?.referred_by) {
          const commission = Math.floor(deposit.amount * REFERRAL_RATE);
          if (commission > 0) {
            await q("update portfolios set balance = balance + $1 where user_id = $2", [
              commission,
              profile.referred_by,
            ]);
            await q(
              `insert into transactions (user_id, type, amount, status, description, metadata)
               values ($1, 'reward', $2, 'completed', 'Referral commission', $3::jsonb)`,
              [profile.referred_by, commission, JSON.stringify({ referral: true, from_user: deposit.user_id })],
            );
          }
        }
      });
    } else if (event === "charge.failed") {
      await query("update deposits set status = 'failed' where payment_reference = $1 and status = 'pending'", [ref]);
      await query(
        "update transactions set status = 'failed' where reference = $1 and status = 'pending'",
        [ref],
      );
    }
  } catch (e) {
    console.error("[korapay webhook]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
