"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { query, withTransaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/data";
import { profileSchema, supportSchema } from "@/lib/schemas";
import { BONUSES_ENABLED, DAILY_LOGIN_BONUS, PLAN_DURATION_DAYS, SHARE_EARNINGS_ENABLED, WELCOME_BONUS_AMOUNT } from "@/lib/config";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: z.infer<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };

  try {
    // Only the name is user-editable. The phone number is the login identity;
    // status/id never come from the client.
    await query("update profiles set full_name = $1 where id = $2", [
      parsed.data.full_name,
      user.id,
    ]);
  } catch {
    return { ok: false, error: "Could not save your profile. Try again." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function submitSupportTicket(
  input: z.infer<typeof supportSchema>,
): Promise<ActionResult> {
  const parsed = supportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };

  try {
    const { name, email, subject, message } = parsed.data;
    // The account phone comes from the server-side profile, never from the form.
    await query(
      `insert into support_tickets (user_id, name, email, phone, subject, message)
       values ($1, $2, $3, (select phone from profiles where id = $1), $4, $5)`,
      [user.id, name, email || null, subject, message],
    );
  } catch {
    return { ok: false, error: "Could not send your message. Try again." };
  }
  return { ok: true };
}

/**
 * Links a brand-new account to the person whose invite link it signed up
 * through. Only works for an account with no referrer yet that was created in
 * the last 15 minutes, so it can't be used later to reassign anyone, and never
 * for your own code. Tracking only — nothing is paid or credited for referrals.
 * Failures are silent to the caller on purpose (a bad link shouldn't block signup).
 */
export async function applyReferral(code: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(clean)) return { ok: false, error: "Invalid referral code." };
  try {
    const rows = await query(
      `update profiles set referred_by = r.id
         from profiles r
        where profiles.id = $1 and profiles.referred_by is null
          and r.ref_code = $2 and r.id <> $1
          and profiles.created_at > now() - interval '15 minutes'
        returning profiles.id`,
      [user.id, clean],
    );
    return rows.length > 0 ? { ok: true } : { ok: false, error: "Referral not applied." };
  } catch (e) {
    console.error("[referral]", e);
    return { ok: false, error: "Referral not applied." };
  }
}

/**
 * Records today's login: updates the streak, credits the promotional bonuses
 * (one-time welcome bonus, then the daily login bonus once per UTC day), and
 * credits today's share earnings based on holdings still inside their plan period. Safe to call any
 * number of times — each credit is claimed with a guarded UPDATE, so a repeat
 * call, a second tab, or a race credits nothing twice. Amounts are computed
 * or read from constants on the server; the client sends nothing.
 *
 * Promotional bonus money goes to `balance` and is also counted in
 * `locked_bonus` until the user's first share purchase (unless they've
 * already made one). Share earnings are never locked — they only accrue once
 * a purchase already exists — and go straight to `balance`.
 */
export async function recordLogin(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "You are signed out." };
  const userId = user.id;
  try {
    await withTransaction(async (q) => {
      await q("select record_daily_login($1)", [userId]);

      if (SHARE_EARNINGS_ENABLED) {
        await q("insert into share_earnings (user_id) values ($1) on conflict (user_id) do nothing", [userId]);
        const [due] = await q<{ amount: number }>(
          `select coalesce(sum(h.quantity * s.daily_earning), 0) as amount
             from holdings h join shares s on s.id = h.share_id
            where h.user_id = $1
              and h.created_at > now() - make_interval(days => $2::int)`,
          [userId, PLAN_DURATION_DAYS],
        );
        const amount = due?.amount ?? 0;
        if (amount > 0) {
          const credited = await q(
            `update share_earnings
                set last_earned_on = (now() at time zone 'utc')::date,
                    total_earned = total_earned + $1
              where user_id = $2 and last_earned_on is distinct from (now() at time zone 'utc')::date
              returning id`,
            [amount, userId],
          );
          if (credited.length > 0) {
            await q("update portfolios set balance = balance + $1 where user_id = $2", [amount, userId]);
            await q(
              `insert into transactions (user_id, type, amount, status, description, metadata)
               values ($1, 'reward', $2, 'completed', 'Daily share earnings', '{"share_earning": true}'::jsonb)`,
              [userId, amount],
            );
          }
        }
      }

      if (!BONUSES_ENABLED) return;

      async function credit(amount: number, type: "bonus" | "reward", description: string) {
        await q(
          `update portfolios
              set balance = balance + $1,
                  locked_bonus = locked_bonus + case
                    when exists (select 1 from transactions
                                  where user_id = $2 and type = 'share_purchase' and status = 'completed')
                    then 0 else $1 end
            where user_id = $2`,
          [amount, userId],
        );
        await q(
          `insert into transactions (user_id, type, amount, status, description, metadata)
           values ($1, $2, $3, 'completed', $4, '{"promo": true}'::jsonb)`,
          [userId, type, amount, description],
        );
      }

      const welcome = await q(
        `update welcome_bonuses set status = 'claimed', amount = $1, claimed_at = now()
          where user_id = $2 and status in ('pending', 'available') returning id`,
        [WELCOME_BONUS_AMOUNT, userId],
      );
      if (welcome.length > 0) await credit(WELCOME_BONUS_AMOUNT, "bonus", "Welcome bonus");

      const daily = await q(
        `update login_rewards
            set rewarded_on = (now() at time zone 'utc')::date, total_rewards = total_rewards + $1
          where user_id = $2 and rewarded_on is distinct from (now() at time zone 'utc')::date
          returning id`,
        [DAILY_LOGIN_BONUS, userId],
      );
      if (daily.length > 0) await credit(DAILY_LOGIN_BONUS, "reward", "Daily login bonus");
    });
  } catch (e) {
    console.error("[login]", e);
    return { ok: false, error: "Could not record login." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
