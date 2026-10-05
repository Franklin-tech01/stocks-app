"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/brand/logo";
import { StatusBadge } from "@/components/ui/status-badge";
import { useModals } from "@/components/modals/modals-provider";
import { formatMoney } from "@/lib/utils";
import { PLAN_DURATION_DAYS } from "@/lib/config";
import type { Share } from "@/lib/types";

const tierTone = { standard: "neutral", premium: "brand", vip: "navy" } as const;

/** Price list: header row on desktop, stacked rows on mobile. Data comes from the `shares` table. */
export function SharePricingTable({ shares }: { shares: Share[] }) {
  const { openBuy } = useModals();

  return (
    <Card className="overflow-hidden">
      <div
        aria-hidden
        className="hidden grid-cols-[1.6fr_1fr_1fr_1fr_auto] items-center gap-4 bg-navy px-5 py-3 text-xs font-semibold uppercase tracking-wide text-navy-foreground md:grid"
      >
        <span>Share</span>
        <span>Price</span>
        <span>Daily Earnings</span>
        <span>Status</span>
        <span className="w-24" />
      </div>

      <ul className="divide-y">
        {shares.map((s) => (
          <li
            key={s.id}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[1.6fr_1fr_1fr_1fr_auto] md:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <LogoMark className="size-10 shrink-0" />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {s.name}
                  {s.badge && <Badge tone="brand">{s.badge}</Badge>}
                </p>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge tone={tierTone[s.tier]} className="px-2 py-0 text-[10px] uppercase">
                    {s.tier}
                  </Badge>
                  {s.symbol}
                </p>
              </div>
            </div>

            <p className="tabular text-right font-display text-lg font-semibold md:text-left">
              {formatMoney(s.price)}
            </p>

            <p className="tabular text-right text-sm font-semibold text-success md:text-left">
              {formatMoney(s.daily_earning)}<span className="text-muted-foreground">/day</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {PLAN_DURATION_DAYS} days · {formatMoney(s.daily_earning * PLAN_DURATION_DAYS)}
              </span>
            </p>

            <div className="col-start-1 md:col-start-auto">
              <StatusBadge kind="share" status={s.status} />
            </div>

            <Button
              size="sm"
              className="w-24 justify-self-end"
              disabled={s.status !== "available"}
              onClick={() => openBuy(s)}
            >
              Buy
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
