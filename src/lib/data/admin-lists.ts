import "server-only";
import { query } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";
import type { AdminDeposit, AdminPurchase, AdminWithdrawal } from "@/lib/types";

/** Paginated + searchable admin lists. Every export goes through `requireAdmin()` first. */

export const ADMIN_PAGE_SIZE = 15;

export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pages: number;
  q: string;
}

/** Normalises ?page= / ?q= from the URL into safe values. */
export function parseListParams(sp: { page?: string; q?: string }) {
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const q = (sp.q ?? "").trim().slice(0, 80);
  return { page, q };
}

interface ListSql {
  select: string;
  from: string;
  /** Uses $1 as the ILIKE pattern. */
  where: string;
  order: string;
}

async function paged<T>(p: { page: number; q: string }, sql: ListSql): Promise<Page<T>> {
  await requireAdmin();
  const like = `%${p.q.replace(/[\\%_]/g, "\\$&")}%`;
  const where = p.q ? `where ${sql.where}` : "";
  const args = p.q ? [like] : [];
  const [c] = await query<{ n: number }>(`select count(*)::int as n ${sql.from} ${where}`, args);
  const total = c?.n ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const page = Math.min(p.page, pages);
  const rows = await query<T>(
    `select ${sql.select} ${sql.from} ${where} order by ${sql.order} limit ${ADMIN_PAGE_SIZE} offset ${(page - 1) * ADMIN_PAGE_SIZE}`,
    args,
  );
  return { rows, total, page, pages, q: p.q };
}

type ListParams = { page: number; q: string };

export const getAdminDeposits = (p: ListParams) =>
  paged<AdminDeposit>(p, {
    select: "d.id, d.amount, d.status, d.payment_method, d.created_at, p.full_name, p.phone",
    from: "from deposits d join profiles p on p.id = d.user_id",
    where: "(p.full_name ilike $1 or p.phone ilike $1 or d.payment_method ilike $1 or d.status ilike $1)",
    order: "d.created_at desc",
  });

export const getAdminPurchases = (p: ListParams) =>
  paged<AdminPurchase>(p, {
    select: "t.id, t.amount, t.description, t.created_at, p.full_name, p.phone",
    from: "from transactions t join profiles p on p.id = t.user_id and t.type = 'share_purchase'",
    where: "(p.full_name ilike $1 or p.phone ilike $1 or t.description ilike $1)",
    order: "t.created_at desc",
  });

export const getAdminWithdrawals = (p: ListParams) =>
  paged<AdminWithdrawal & { locked: boolean }>(p, {
    select: `w.id, w.user_id, w.amount, w.status, w.bank_name, w.bank_code, w.account_number, w.account_name,
             w.payout_reference, w.payout_fee, w.created_at, w.processed_at,
             (w.locked_at is not null and w.locked_at > now() - interval '2 minutes') as locked,
             p.full_name, p.phone`,
    from: "from withdrawals w join profiles p on p.id = w.user_id",
    where: `(p.full_name ilike $1 or p.phone ilike $1 or w.account_name ilike $1 or w.account_number ilike $1
             or w.bank_name ilike $1 or w.status ilike $1)`,
    order: "(w.status = 'pending') desc, w.created_at desc",
  });

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  balance: number;
  created_at: string;
}

export const getAdminUsers = (p: ListParams) =>
  paged<AdminUser>(p, {
    select:
      "p.id, p.full_name, p.phone, p.email, p.is_admin, coalesce(pf.balance, 0) as balance, p.created_at",
    from: "from profiles p left join portfolios pf on pf.user_id = p.id",
    where: "(p.full_name ilike $1 or p.phone ilike $1 or p.email ilike $1)",
    order: "p.created_at desc",
  });
