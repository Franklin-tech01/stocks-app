"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Layers, List } from "lucide-react";
import { EmptyState } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import type { Share, ShareTier } from "@/lib/types";
import { ShareCard } from "./share-card";
import { SharePricingTable } from "./share-pricing-table";

const filters: { label: string; value: "all" | ShareTier }[] = [
  { label: "All", value: "all" },
  { label: "Standard", value: "standard" },
  { label: "Premium", value: "premium" },
  { label: "VIP", value: "vip" },
];

export function MarketplaceView({ shares }: { shares: Share[] }) {
  const [tier, setTier] = useState<"all" | ShareTier>("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const visible = useMemo(
    () => (tier === "all" ? shares : shares.filter((s) => s.tier === tier)),
    [shares, tier],
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter by tier"
          className="-ml-4 flex gap-2 overflow-x-auto pl-4 md:ml-0 md:pl-0"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={tier === f.value}
              onClick={() => setTier(f.value)}
              className={cn(
                "h-10 shrink-0 rounded-full border px-5 text-sm font-semibold transition-colors",
                tier === f.value
                  ? "border-navy bg-navy text-navy-foreground"
                  : "glass text-muted-foreground hover:bg-white/80",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="hidden shrink-0 glass rounded-full p-1 sm:flex" role="group" aria-label="View">
          {(
            [
              ["table", List, "Table view"],
              ["cards", LayoutGrid, "Card view"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              aria-label={label}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "grid size-8 place-items-center rounded-full transition-colors",
                view === v ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="No shares here yet"
          description={tier === "all" ? "Packages will appear as soon as they are published." : "No packages in this tier right now."}
        />
      ) : view === "table" ? (
        <SharePricingTable shares={visible} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <ShareCard key={s.id} share={s} />
          ))}
        </div>
      )}
    </div>
  );
}
