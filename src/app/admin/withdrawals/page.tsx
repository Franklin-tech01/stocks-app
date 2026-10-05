import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/page-header";
import { WithdrawalActions } from "@/components/admin/withdrawal-actions";
import { Banknote } from "lucide-react";
import { getAdminWithdrawals, parseListParams } from "@/lib/data/admin-lists";
import { Pager, SearchBox } from "@/components/admin/list-controls";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Withdrawals" };

export default async function AdminWithdrawalsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const data = await getAdminWithdrawals(parseListParams(await searchParams));
  const withdrawals = data.rows;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Withdrawals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pay each request from your own bank/Korapay dashboard, then mark it paid here. The user&apos;s
        balance was already held when they requested it.
      </p>
      <div className="mt-5">
        <SearchBox q={data.q} placeholder="Search name, phone, account or bank" />
      </div>

      {withdrawals.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Banknote />} title="No withdrawal requests" description="Requests will appear here as users submit them." />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Bank details</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Requested</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{w.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{w.phone ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{w.account_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {w.bank_name} · {w.account_number}
                      </p>
                    </td>
                    <td className="tabular px-4 py-3 text-right font-semibold">{formatMoney(w.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(w.created_at, true)}</td>
                    <td className="px-4 py-3">
                      {w.status === "pending" ? (
                        <WithdrawalActions
                          id={w.id}
                          amount={w.amount}
                          name={w.full_name ?? "this user"}
                          hasBankCode={!!w.bank_code}
                          locked={w.locked}
                        />
                      ) : (
                        <div className="text-right text-xs text-muted-foreground">
                          <p>
                            {w.status === "completed" ? "Paid" : "Rejected"} {formatDate(w.processed_at, true)}
                          </p>
                          {w.payout_reference && <p className="font-mono">{w.payout_reference}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pager data={data} basePath="/admin/withdrawals" />
    </div>
  );
}
