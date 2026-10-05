"use server";

import { revalidatePath } from "next/cache";
import { query, withTransaction } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";
import { payout, OtpayAmbiguousError } from "@/lib/otpay";
import { WITHDRAWAL_CHARGE_RATE } from "@/lib/config";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

// A withdrawal being actively worked on (an OTPay call in flight) is "locked"
// for this long. Guards markWithdrawalPaid/rejectWithdrawal/payoutViaOtpay
// against racing each other — see migration 0005 for why.
const LOCK_CLAUSE = "and (locked_at is null or locked_at < now() - interval '2 minutes')";

/**
 * Marks a pending withdrawal as paid out. The balance was already debited
 * when the user requested it, so this only flips status — it never touches
 * the balance. Use this when you paid the user yourself outside OTPay
 * (e.g. your own bank transfer); if you used OTPay, use `payoutViaOtpay`
 * instead, which calls the payout API for you.
 */
export async function markWithdrawalPaid(withdrawalId: string): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const updated = await withTransaction(async (q) => {
      const rows = await q(
        `update withdrawals set status = 'completed', processed_at = now()
          where id = $1 and status = 'pending' ${LOCK_CLAUSE} returning id`,
        [withdrawalId],
      );
      if (rows.length === 0) return false;
      await q(
        `update transactions set status = 'completed'
          where type = 'withdrawal' and (metadata ->> 'withdrawal_id') = $1`,
        [withdrawalId],
      );
      return true;
    });
    if (!updated) return { ok: false, error: "This withdrawal was already processed, or is currently locked." };
  } catch (e) {
    console.error("[admin:payout]", e);
    return { ok: false, error: "Could not mark this withdrawal as paid." };
  }
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true };
}

/** Rejects a pending withdrawal and refunds the held amount back to the user's balance. */
export async function rejectWithdrawal(withdrawalId: string): Promise<AdminActionResult> {
  await requireAdmin();
  try {
    const refunded = await withTransaction(async (q) => {
      const rows = await q<{ user_id: string; amount: number }>(
        `update withdrawals set status = 'failed', processed_at = now()
          where id = $1 and status = 'pending' ${LOCK_CLAUSE} returning user_id, amount`,
        [withdrawalId],
      );
      const withdrawal = rows[0];
      if (!withdrawal) return false;
      await q("update portfolios set balance = balance + $1 where user_id = $2", [
        withdrawal.amount,
        withdrawal.user_id,
      ]);
      await q(
        `update transactions set status = 'failed'
          where type = 'withdrawal' and (metadata ->> 'withdrawal_id') = $1`,
        [withdrawalId],
      );
      return true;
    });
    if (!refunded) return { ok: false, error: "This withdrawal was already processed, or is currently locked." };
  } catch (e) {
    console.error("[admin:reject]", e);
    return { ok: false, error: "Could not reject this withdrawal." };
  }
  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Pays a withdrawal out for real via OTPay, then marks it paid.
 *
 * Safety model (OTPay's payout API accepts no idempotency key, so this is
 * the only protection against a double payout):
 *  1. Atomically CLAIM the withdrawal (set locked_at) before calling OTPay at
 *     all. A second click, or another admin, sees it locked and is refused
 *     immediately — OTPay is never called twice for one request.
 *  2. OTPay confirms success  -> close the withdrawal out (status, reference, fee).
 *  3. OTPay confirms failure  -> release the lock; safe to retry or pay manually.
 *  4. Outcome is unknown (timeout/bad response) -> the lock is LEFT IN PLACE.
 *     The caller must check OTPay's own dashboard before doing anything else
 *     with this withdrawal; the lock expires after 2 minutes as a last resort,
 *     not as an invitation to retry blindly.
 */
export async function payoutViaOtpay(withdrawalId: string): Promise<AdminActionResult> {
  await requireAdmin();

  const claimed = await query<{ id: string }>(
    `update withdrawals set locked_at = now()
      where id = $1 and status = 'pending' ${LOCK_CLAUSE} returning id`,
    [withdrawalId],
  );
  if (claimed.length === 0) {
    return { ok: false, error: "This withdrawal is already being processed, or was already handled." };
  }

  const [w] = await query<{ amount: number; bank_code: string | null; account_number: string | null }>(
    "select amount, bank_code, account_number from withdrawals where id = $1",
    [withdrawalId],
  );
  if (!w?.bank_code || !w.account_number) {
    await query("update withdrawals set locked_at = null where id = $1", [withdrawalId]);
    return { ok: false, error: "This request has no OTPay bank code on file — use Mark Paid after paying manually." };
  }

  let result;
  try {
    result = await payout({ bankAccountNo: w.account_number, bankCode: w.bank_code, amount: Math.round(w.amount * (1 - WITHDRAWAL_CHARGE_RATE) * 100) / 100 });
  } catch (e) {
    console.error("[admin:otpay-payout]", e);
    if (e instanceof OtpayAmbiguousError) {
      // Deliberately do NOT clear the lock here — see the function doc above.
      return {
        ok: false,
        error:
          "Could not confirm whether OTPay processed this payout — check your OTPay dashboard before doing anything else with this request. Do not click this again yet.",
      };
    }
    await query("update withdrawals set locked_at = null where id = $1", [withdrawalId]);
    return { ok: false, error: e instanceof Error ? e.message : "OTPay payout failed." };
  }

  const closed = await withTransaction(async (q) => {
    const rows = await q(
      `update withdrawals
          set status = 'completed', processed_at = now(), payout_reference = $1, payout_fee = $2, locked_at = null
        where id = $3 and status = 'pending' returning id`,
      [result.reference, result.fee, withdrawalId],
    );
    if (rows.length === 0) return false;
    await q(
      `update transactions set status = 'completed' where type = 'withdrawal' and (metadata ->> 'withdrawal_id') = $1`,
      [withdrawalId],
    );
    return true;
  });

  if (!closed) {
    // OTPay says the money moved but our own record couldn't be closed —
    // this must never be silent. Surfaced to the admin and the server log.
    console.error(
      `[admin:otpay-payout] CRITICAL: OTPay confirmed payout (ref ${result.reference}) for withdrawal ${withdrawalId} but it could not be marked completed — check for a duplicate.`,
    );
    return {
      ok: false,
      error: `OTPay confirmed the payout (ref ${result.reference}) but this request could not be closed cleanly. Check it manually before touching it again.`,
    };
  }

  revalidatePath("/admin/withdrawals");
  revalidatePath("/admin");
  return { ok: true };
}
