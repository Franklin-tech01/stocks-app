import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SHARE_EARNINGS_ENABLED } from "@/lib/config";
import { formatMoney } from "@/lib/utils";
import type { Holding, ShareEarnings } from "@/lib/types";

const todayUtc = () => new Date().toISOString().slice(0, 10);

/**
 * Shows the fixed daily payout the user's current holdings earn. Credited
 * automatically (see `recordLogin` in `src/lib/actions/account.ts`) once per
 * UTC day — this card only reports state, it doesn't trigger the credit
 * itself (the daily login card already does that on every dashboard visit).
 */
export function ShareEarningsCard({
  holdings,
  earnings,
}: {
  holdings: Holding[];
  earnings: ShareEarnings | null;
}) {
  const dailyRate = holdings.reduce((sum, h) => sum + h.quantity * (h.shares?.daily_earning ?? 0), 0);
  const creditedToday = earnings?.last_earned_on === todayUtc();
  const totalEarned = earnings?.total_earned ?? 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-navy text-sky-300">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Daily Share Earnings</h2>
            <p className="text-sm text-muted-foreground">
              Every share you hold pays out daily, straight to your balance.
            </p>
          </div>
        </div>
        {dailyRate > 0 && (
          <Badge tone={creditedToday ? "success" : "warning"}>
            {creditedToday ? "Credited today" : "Not yet today"}
          </Badge>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-md bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">Daily rate</p>
          <p className="tabular font-display text-xl font-semibold">
            {SHARE_EARNINGS_ENABLED ? formatMoney(dailyRate) : "Paused"}
          </p>
        </div>
        <div className="rounded-md bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">Total earned</p>
          <p className="tabular font-display text-xl font-semibold">{formatMoney(totalEarned)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {dailyRate > 0
          ? "Credited automatically once a day — no action needed."
          : "Buy a share to start earning a daily payout."}
      </p>
    </Card>
  );
}
