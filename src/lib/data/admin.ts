import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/data";

/**
 * Admin-only reads. Unlike `@/lib/data`, these intentionally return every
 * user's rows — never import these into user-facing pages. Every exported
 * function here must go through `requireAdmin()` first.
 */

export const isCurrentUserAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  const rows = await query<{ is_admin: boolean }>("select is_admin from profiles where id = $1", [user.id]);
  return rows[0]?.is_admin ?? false;
});

/** Redirects to /dashboard if the signed-in user is not an admin. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isCurrentUserAdmin())) redirect("/dashboard");
  return user;
}

export interface AdminOverview {
  totalUsers: number;
  depositsCompletedTotal: number;
  depositsPendingCount: number;
  withdrawalsCompletedTotal: number;
  withdrawalsPendingTotal: number;
  withdrawalsPendingCount: number;
  purchasesTotal: number;
  purchasesCount: number;
  /** Promo money credited so far (welcome + daily login) — what the bonuses have cost. */
  bonusesCredited: number;
  /** Bonus money still locked on user balances (not yet withdrawable). */
  bonusesLocked: number;
}

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  const [users, deposits, withdrawals, purchases, bonuses] = await Promise.all([
    query<{ n: number }>(`select count(*)::int as n from "user"`),
    query<{ total: number; pending: number }>(
      `select coalesce(sum(amount) filter (where status = 'completed'), 0) as total,
              count(*) filter (where status = 'pending')::int as pending
         from deposits`,
    ),
    query<{ total: number; completed: number; pending: number }>(
      `select coalesce(sum(amount) filter (where status = 'pending'), 0) as total,
              coalesce(sum(amount) filter (where status = 'completed'), 0) as completed,
              count(*) filter (where status = 'pending')::int as pending
         from withdrawals`,
    ),
    query<{ total: number; n: number }>(
      `select coalesce(sum(amount), 0) as total, count(*)::int as n
         from transactions where type = 'share_purchase' and status = 'completed'`,
    ),
    query<{ credited: number; locked: number }>(
      `select
         (select coalesce(sum(amount), 0) from transactions
           where type in ('bonus', 'reward') and status = 'completed') as credited,
         (select coalesce(sum(locked_bonus), 0) from portfolios) as locked`,
    ),
  ]);
  return {
    totalUsers: users[0]?.n ?? 0,
    depositsCompletedTotal: deposits[0]?.total ?? 0,
    depositsPendingCount: deposits[0]?.pending ?? 0,
    withdrawalsCompletedTotal: withdrawals[0]?.completed ?? 0,
    withdrawalsPendingTotal: withdrawals[0]?.total ?? 0,
    withdrawalsPendingCount: withdrawals[0]?.pending ?? 0,
    purchasesTotal: purchases[0]?.total ?? 0,
    purchasesCount: purchases[0]?.n ?? 0,
    bonusesCredited: bonuses[0]?.credited ?? 0,
    bonusesLocked: bonuses[0]?.locked ?? 0,
  };
});

