import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/page-header";
import { Pager, SearchBox } from "@/components/admin/list-controls";
import { getAdminUsers, parseListParams } from "@/lib/data/admin-lists";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const data = await getAdminUsers(parseListParams(await searchParams));

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">Everyone who has signed up, newest first.</p>
      <div className="mt-5">
        <SearchBox q={data.q} placeholder="Search name, phone or email" />
      </div>

      {data.rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<Users />} title="No users found" description="Try a different search." />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Phone / email</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.rows.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {u.full_name ?? "—"} {u.is_admin && <Badge tone="brand">Admin</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.phone ?? u.email ?? "—"}</td>
                    <td className="tabular px-4 py-3 text-right font-semibold">{formatMoney(u.balance)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(u.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Pager data={data} basePath="/admin/users" />
    </div>
  );
}
