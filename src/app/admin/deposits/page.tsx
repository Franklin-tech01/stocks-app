import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/layout/page-header";
import { Inbox } from "lucide-react";
import { getAdminDeposits, parseListParams } from "@/lib/data/admin-lists";
import { Pager, SearchBox } from "@/components/admin/list-controls";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Deposits" };

export default async function AdminDepositsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const data = await getAdminDeposits(parseListParams(await searchParams));
  const deposits = data.rows;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Deposits</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every deposit, newest first.</p>
      <div className="mt-5">
        <SearchBox q={data.q} placeholder="Search name, phone, method or status" />
      </div>

      {deposits.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Inbox />} title="No deposits yet" description="Deposits will appear here as users make them." />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{d.full_name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{d.phone ?? "—"}</td>
                    <td className="tabular px-4 py-3 text-right font-semibold">{formatMoney(d.amount)}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {d.payment_method?.replace("_", " ") ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(d.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pager data={data} basePath="/admin/deposits" />
    </div>
  );
}
