"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { query, withTransaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/data";
import { initializeCharge } from "@/lib/korapay";
import { getBanks, verifyBankAccount, type Bank } from "@/lib/otpay";
import { realEmail } from "@/lib/phone";
import { MIN_DEPOSIT_AMOUNT, MIN_WITHDRAWAL_AMOUNT, WITHDRAWALS_ENABLED } from "@/lib/config";
import { formatMoney } from "@/lib/utils";

export type PaymentResult =
  | { ok: true; checkoutUrl: string }
  | { ok: true }
  | { ok: false; error: string };

function reference(prefix: string) {
  return `NVY-${prefix}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

/**
 * Starts a real Korapay deposit: records a pending deposit + transaction,
 * then asks Korapay for a hosted checkout URL for the browser to redirect to.
 * The balance is only credited once the webhook confirms payment
 * (see `src/app/api/webhooks/korapay/route.ts`) — never from this call.
 */
export async function initiateDeposit(input: { amount: number; method: string }): Promise<PaymentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  // Mirrors depositSchema's client-side check; enforced again here since a
  // server action can be called directly, bypassing the form.
  if (!(input.amount >= MIN_DEPOSIT_AMOUNT)) {
    return { ok: false, error: `Minimum deposit is ${formatMoney(MIN_DEPOSIT_AMOUNT)}.` };
  }

  const ref = reference("DEP");

  // Split into two try/catches so Vercel's function log says which stage
  // failed (database vs Korapay) instead of one generic message for both.
  // The two inserts run in one transaction so a mid-way failure never
  // leaves a deposit row without its matching transaction row.
  try {
    await withTransaction(async (q) => {
      await q(
        "insert into deposits (user_id, amount, status, payment_reference, payment_method) values ($1, $2, 'pending', $3, $4)",
        [user.id, input.amount, ref, input.method],
      );
      await q(
        "insert into transactions (user_id, type, amount, status, reference, description) values ($1, 'deposit', $2, 'pending', $3, $4)",
        [user.id, input.amount, ref, `Deposit via ${input.method.replace("_", " ")}`],
      );
    });
  } catch (e) {
    console.error("[deposit:db]", e);
    return { ok: false, error: "Could not start the deposit (database). Please try again." };
  }

  try {
    const { checkoutUrl } = await initializeCharge({
      amount: input.amount,
      reference: ref,
      email: realEmail(user.email) ?? user.email,
      name: user.name,
      method: input.method,
    });
    return { ok: true, checkoutUrl };
  } catch (e) {
    console.error("[deposit:korapay]", e);
    return { ok: false, error: "Could not start the deposit (payment provider). Please try again." };
  }
}

/**
 * Buys a share using the user's Stocks balance only (no external payment).
 * Debit + holding + transaction happen in one DB transaction so a purchase
 * can never charge the balance without recording the holding, or vice versa.
 */
export async function purchaseShare(input: { shareId: string; quantity: number }): Promise<PaymentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  const quantity = Math.trunc(input.quantity);
  if (!(quantity >= 1 && quantity <= 99)) return { ok: false, error: "Enter a valid quantity." };

  try {
    const [share] = await query<{ id: string; name: string; price: number; status: string }>(
      "select id, name, price, status from shares where id = $1",
      [input.shareId],
    );
    if (!share || share.status !== "available") {
      return { ok: false, error: "This share is not available right now." };
    }
    const total = share.price * quantity;

    const purchased = await withTransaction(async (q) => {
      // Debit only if the balance covers it; the WHERE guard makes this
      // check-and-debit atomic even under concurrent purchases.
      const updated = await q(
        // locked_bonus = 0: a first purchase unlocks promotional bonus money.
        `update portfolios
            set balance = balance - $1, total_investment = total_investment + $1, total_value = total_value + $1,
                locked_bonus = 0
          where user_id = $2 and balance >= $1
          returning user_id`,
        [total, user.id],
      );
      if (updated.length === 0) return false;

      await q(
        "insert into holdings (user_id, share_id, quantity, purchase_price) values ($1, $2, $3, $4)",
        [user.id, share.id, quantity, share.price],
      );
      await q(
        "insert into transactions (user_id, type, amount, status, description) values ($1, 'share_purchase', $2, 'completed', $3)",
        [user.id, total, `Purchased ${quantity} × ${share.name}`],
      );
      return true;
    });

    if (!purchased) return { ok: false, error: "Insufficient balance. Deposit funds first." };
  } catch (e) {
    console.error("[purchase]", e);
    return { ok: false, error: "Could not complete the purchase. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/marketplace");
  revalidatePath("/transactions");
  return { ok: true };
}

export type BankListResult = { ok: true; banks: Bank[] } | { ok: false; error: string };

/** Feeds the bank dropdown in the withdraw form. OTPay credentials are server-only. */
export async function getWithdrawalBanks(): Promise<BankListResult> {
  try {
    return { ok: true, banks: await getBanks() };
  } catch (e) {
    console.error("[banks]", e);
    return { ok: false, error: "Could not load the bank list. Please try again." };
  }
}

export type VerifyAccountResult = { ok: true; accountName: string; bankName: string } | { ok: false; error: string };

/**
 * Resolves an account number to its registered name via OTPay before a
 * withdrawal is submitted, so a user sees whose account they're paying into
 * and can't type an arbitrary name. `requestWithdrawal` re-verifies
 * server-side regardless — this is only for the form's live feedback.
 */
export async function verifyWithdrawalAccount(input: {
  bankCode: string;
  accountNumber: string;
}): Promise<VerifyAccountResult> {
  try {
    const v = await verifyBankAccount(input.accountNumber, input.bankCode);
    return { ok: true, accountName: v.accountName, bankName: v.bankName };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not verify this account." };
  }
}

/**
 * Requests a withdrawal. The account is verified with OTPay first (the
 * resolved name is authoritative — never the client's word for it), then the
 * balance is debited immediately (atomically, like a hold), so a user can't
 * request more than they have or double-spend the same balance across two
 * pending requests. An admin pays it out and marks it done, or rejects it,
 * which refunds the hold (see `src/lib/actions/admin.ts`).
 */
export async function requestWithdrawal(input: {
  amount: number;
  bankCode: string;
  accountNumber: string;
}): Promise<PaymentResult> {
  if (!WITHDRAWALS_ENABLED) return { ok: false, error: "Withdrawals are temporarily paused." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  // Mirrors withdrawSchema's client-side check; enforced again here since a
  // server action can be called directly, bypassing the form.
  if (!(input.amount >= MIN_WITHDRAWAL_AMOUNT)) {
    return { ok: false, error: `Minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL_AMOUNT)}.` };
  }

  // No withdrawals until the user has bought at least one share.
  try {
    const [purchase] = await query<{ id: string }>(
      "select id from transactions where user_id = $1 and type = 'share_purchase' and status = 'completed' limit 1",
      [user.id],
    );
    if (!purchase) {
      return { ok: false, error: "You can only withdraw after buying a share. Buy a share to unlock withdrawals." };
    }
  } catch (e) {
    console.error("[withdrawal]", e);
    return { ok: false, error: "Could not submit the withdrawal. Please try again." };
  }

  let verified;
  try {
    verified = await verifyBankAccount(input.accountNumber, input.bankCode);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not verify this bank account." };
  }

  try {
    const outcome = await withTransaction(async (q): Promise<"ok" | "locked" | "insufficient"> => {
      // Only balance beyond the still-locked bonus is withdrawable, so a
      // user's own deposits are never locked — just promotional money.
      const updated = await q(
        `update portfolios set balance = balance - $1
          where user_id = $2 and balance - locked_bonus >= $1 returning user_id`,
        [input.amount, user.id],
      );
      if (updated.length === 0) {
        const [p] = await q<{ balance: number }>("select balance from portfolios where user_id = $1", [user.id]);
        return p && p.balance >= input.amount ? "locked" : "insufficient";
      }

      const [withdrawal] = await q<{ id: string }>(
        `insert into withdrawals (user_id, amount, status, bank_name, bank_code, account_number, account_name)
         values ($1, $2, 'pending', $3, $4, $5, $6) returning id`,
        [user.id, input.amount, verified.bankName, input.bankCode, input.accountNumber, verified.accountName],
      );
      await q(
        `insert into transactions (user_id, type, amount, status, description, metadata)
         values ($1, 'withdrawal', $2, 'pending', $3, $4)`,
        [
          user.id,
          input.amount,
          `Withdrawal to ${verified.bankName} •••${input.accountNumber.slice(-4)}`,
          JSON.stringify({ withdrawal_id: withdrawal.id }),
        ],
      );
      return "ok";
    });

    if (outcome === "locked") {
      return {
        ok: false,
        error: "Bonus money can be withdrawn after your first share purchase. Buy a share to unlock it.",
      };
    }
    if (outcome === "insufficient") return { ok: false, error: "Insufficient balance." };
  } catch (e) {
    console.error("[withdrawal]", e);
    return { ok: false, error: "Could not submit the withdrawal. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true };
}
