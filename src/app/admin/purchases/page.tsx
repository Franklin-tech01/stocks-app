import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/page-header";
import { ShoppingBag } from "lucide-react";
import { getAdminPurchases, parseListParams } from "@/lib/data/admin-lists";
import { Pager, SearchBox } from "@/components/admin/list-controls";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Purchases" };

export default async function AdminPurchasesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const data = await getAdminPurchases(parseListParams(await searchParams));
  const purchases = data.rows;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Share Purchases</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every share purchase, newest first.</p>
      <div className="mt-5">
        <SearchBox q={data.q} placeholder="Search name, phone or stock" />
      </div>

      {purchases.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<ShoppingBag />} title="No purchases yet" description="Share purchases will appear here as users buy." />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 text-right font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{p.full_name ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.description ?? "—"}</td>
                    <td className="tabular px-4 py-3 text-right font-semibold">{formatMoney(p.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(p.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pager data={data} basePath="/admin/purchases" />
    </div>
  );
}
