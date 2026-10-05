import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Lock, ShoppingBag, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/data/admin";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  const o = await getAdminOverview();

  const stats = [
    { label: "Total users", value: String(o.totalUsers), icon: Users },
    {
      label: "Total deposits",
      value: formatMoney(o.depositsCompletedTotal),
      hint: `${o.depositsPendingCount} pending`,
      icon: ArrowDownToLine,
    },
    {
      label: "Total withdrawals",
      value: formatMoney(o.withdrawalsCompletedTotal),
      hint: "Paid out so far",
      icon: ArrowUpFromLine,
    },
    {
      label: "Withdrawals awaiting payout",
      value: formatMoney(o.withdrawalsPendingTotal),
      hint: `${o.withdrawalsPendingCount} request${o.withdrawalsPendingCount === 1 ? "" : "s"}`,
      icon: ArrowUpFromLine,
    },
    {
      label: "Share purchases",
      value: formatMoney(o.purchasesTotal),
      hint: `${o.purchasesCount} purchase${o.purchasesCount === 1 ? "" : "s"}`,
      icon: ShoppingBag,
    },
    {
      label: "Bonuses credited",
      value: formatMoney(o.bonusesCredited),
      hint: "Promo spend so far (welcome + daily login)",
      icon: Gift,
    },
    {
      label: "Bonus money still locked",
      value: formatMoney(o.bonusesLocked),
      hint: "Becomes withdrawable after each user's first purchase",
      icon: Lock,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live totals from deposits, purchases and withdrawals.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                <s.icon className="size-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            </div>
            <p className="tabular mt-3 font-display text-2xl font-semibold">{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>}
          </Card>
        ))}
      </div>

      {o.withdrawalsPendingCount > 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          {o.withdrawalsPendingCount} withdrawal{o.withdrawalsPendingCount === 1 ? "" : "s"} waiting for payout —
          see the <a href="/admin/withdrawals" className="font-semibold text-primary hover:underline">Withdrawals</a> tab.
        </p>
      )}
    </div>
  );
}
