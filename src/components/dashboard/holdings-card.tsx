import Link from "next/link";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/brand/logo";
import { formatMoney } from "@/lib/utils";
import type { Holding, ShareTier } from "@/lib/types";

const tierTone = { standard: "neutral", premium: "brand", vip: "navy" } as const;

interface Row {
  shareId: string;
  name: string;
  symbol: string;
  tier: ShareTier;
  quantity: number;
  invested: number;
}

/** One row per purchase in `holdings` — group into one row per share owned. */
function groupByShare(holdings: Holding[]): Row[] {
  const byShare = new Map<string, Row>();
  for (const h of holdings) {
    const existing = byShare.get(h.share_id);
    if (existing) {
      existing.quantity += h.quantity;
      existing.invested += h.quantity * h.purchase_price;
    } else {
      byShare.set(h.share_id, {
        shareId: h.share_id,
        name: h.shares?.name ?? "Stocks Share",
        symbol: h.shares?.symbol ?? "",
        tier: h.shares?.tier ?? "standard",
        quantity: h.quantity,
        invested: h.quantity * h.purchase_price,
      });
    }
  }
  return [...byShare.values()];
}

export function HoldingsCard({ holdings }: { holdings: Holding[] }) {
  const rows = groupByShare(holdings);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold">Your Shares</h2>
        {rows.length > 0 && (
          <Link href="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Buy more
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-md border border-dashed py-8 text-center">
          <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
            <Layers className="size-5" />
          </div>
          <p className="mt-3 text-sm font-medium">You don&apos;t own any shares yet</p>
          <Link href="/marketplace" className="mt-1 text-sm font-semibold text-primary hover:underline">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y">
          {rows.map((r) => (
            <li key={r.shareId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <LogoMark className="size-9 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {r.name}
                  <Badge tone={tierTone[r.tier]} className="px-2 py-0 text-[10px] uppercase">
                    {r.tier}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.quantity} {r.quantity === 1 ? "share" : "shares"} · {r.symbol}
                </p>
              </div>
              <p className="tabular shrink-0 text-right text-sm font-semibold">{formatMoney(r.invested)}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
