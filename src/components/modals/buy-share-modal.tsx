"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { formatMoney } from "@/lib/utils";
import { purchaseShare } from "@/lib/actions/payments";
import type { Share } from "@/lib/types";

export function BuyShareModal({
  share,
  onOpenChange,
}: {
  share: Share | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (!share) return;
    setBusy(true);
    try {
      const res = await purchaseShare({ shareId: share.id, quantity });
      if (res.ok) {
        toast.success(`Purchased ${quantity} × ${share.name}.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!share}
      onOpenChange={(o) => {
        if (!o) setQuantity(1);
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader title="Confirm purchase" description="Review your order before continuing." />
        {share && (
          <div className="space-y-4 p-6 pt-3">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
              <LogoMark className="size-11" />
              <div>
                <p className="font-display font-semibold">{share.name}</p>
                <p className="text-xs text-muted-foreground">{share.description ?? "Stocks Share"}</p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <Row label="Share" value={share.name} />
              <Row label="Price" value={formatMoney(share.price)} />
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Quantity</dt>
                <dd className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Minus />
                  </Button>
                  <span className="tabular w-10 text-center font-semibold">{quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-9"
                    aria-label="Increase quantity"
                    disabled={quantity >= 99}
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    <Plus />
                  </Button>
                </dd>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="tabular font-display text-xl font-semibold">
                  {formatMoney(share.price * quantity)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Daily earnings</dt>
                <dd className="tabular font-semibold text-success">
                  {formatMoney(share.daily_earning * quantity)}/day
                </dd>
              </div>
            </dl>

            <p className="text-xs text-muted-foreground">Paid from your Stocks balance. Deposit funds first if needed.</p>

            <Button className="w-full" size="lg" onClick={confirm} disabled={busy}>
              {busy && <Loader2 className="animate-spin" />} Confirm Purchase
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-semibold">{value}</dd>
    </div>
  );
}
