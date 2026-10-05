import { Check, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BONUSES_ENABLED, WELCOME_BONUS_AMOUNT } from "@/lib/config";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import type { WelcomeBonus } from "@/lib/types";

const steps = ["Joined", "Credited", "Withdrawable"] as const;

/** The welcome bonus is credited automatically on the first login; this card just reports its state. */
export function WelcomeBonusCard({
  bonus,
  hasPurchased = false,
}: {
  bonus: WelcomeBonus | null;
  /** True once the user has completed a share purchase, which unlocks bonus money. */
  hasPurchased?: boolean;
}) {
  if (!bonus) return null;
  const claimed = bonus.status === "claimed";
  // 0 = joined, 1 = credited (locked), 2 = withdrawable
  const current = claimed ? (hasPurchased ? 2 : 1) : 0;
  const badge = !claimed
    ? { label: BONUSES_ENABLED ? "On first login" : "Paused", tone: "warning" as const }
    : hasPurchased
      ? { label: "Withdrawable", tone: "success" as const }
      : { label: "Credited", tone: "brand" as const };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-navy text-sky-300">
            <Gift className="size-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Welcome Bonus</h2>
            <p className="text-sm text-muted-foreground">Get rewarded for joining Stocks.</p>
          </div>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>

      <div className="px-5">
        <p className="text-xs text-muted-foreground">Bonus amount</p>
        <p className="tabular font-display text-3xl font-semibold">
          {formatMoney(claimed && bonus.amount > 0 ? bonus.amount : WELCOME_BONUS_AMOUNT)}
        </p>
      </div>

      <ol className="mt-5 grid grid-cols-3 gap-2 px-5" aria-label="Bonus progress">
        {steps.map((s, i) => (
          <li key={s} className="space-y-1.5">
            <div className={cn("h-1.5 rounded-full", i <= current ? "bg-primary" : "bg-muted")} />
            <p className={cn("flex items-center gap-1 text-xs", i <= current ? "font-medium" : "text-muted-foreground")}>
              {i < current && <Check className="size-3 text-success" />} {s}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {!claimed
            ? "Credited to your balance automatically when you first log in."
            : hasPurchased
              ? `Credited ${formatDate(bonus.claimed_at)}. You can withdraw it.`
              : `Credited ${formatDate(bonus.claimed_at)}. Withdrawable after your first share purchase.`}
        </p>
      </div>
    </Card>
  );
}
