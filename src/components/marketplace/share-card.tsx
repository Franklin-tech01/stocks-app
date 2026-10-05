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

export function ShareCard({ share }: { share: Share }) {
  const { openBuy } = useModals();
  return (
    <Card className="group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <LogoMark className="size-12" />
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={tierTone[share.tier]} className="uppercase">
            {share.tier}
          </Badge>
          {share.badge && <Badge tone="brand">{share.badge}</Badge>}
        </div>
      </div>

      <h3 className="mt-4 font-display text-lg font-semibold">{share.name}</h3>
      <p className="text-sm text-muted-foreground">{share.description ?? "Stocks Share"}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{share.symbol}</p>

      <p className="tabular mt-4 font-display text-2xl font-semibold">{formatMoney(share.price)}</p>
      <p className="tabular text-sm font-semibold text-success">
        {formatMoney(share.daily_earning)}<span className="font-normal text-muted-foreground"> / day · {PLAN_DURATION_DAYS} days</span>
      </p>
      <p className="tabular text-xs text-muted-foreground">
        Total return {formatMoney(share.daily_earning * PLAN_DURATION_DAYS)}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusBadge kind="share" status={share.status} />
        <Button disabled={share.status !== "available"} onClick={() => openBuy(share)}>
          Buy Share
        </Button>
      </div>
    </Card>
  );
}
