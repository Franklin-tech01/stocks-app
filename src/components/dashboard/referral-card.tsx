"use client";

import { Copy, Send, Share2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatMoney } from "@/lib/utils";
import type { ReferralEarnings } from "@/lib/types";

export function ReferralCard({
  code,
  baseUrl,
  count,
  earnings,
}: {
  code: string;
  baseUrl: string;
  count: number;
  earnings: ReferralEarnings;
}) {
  const link = `${baseUrl}/register?ref=${code}`;
  const message = `Join me on Stocks: ${link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Invite link copied.");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-md bg-navy text-sky-300">
              <Share2 className="size-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold">Your Invite Link</h2>
              <p className="text-sm text-muted-foreground">
                Earn 20% of every deposit made by people you refer.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold">
            <Users className="size-3.5" /> {count} {count === 1 ? "signup" : "signups"}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-md border bg-muted/50 p-1.5 pl-3">
          <p className="min-w-0 flex-1 truncate font-mono text-xs sm:text-sm" title={link}>
            {link}
          </p>
          <Button size="sm" onClick={copy}>
            <Copy /> Copy
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer">
              <Send /> WhatsApp
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join me on Stocks")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send /> Telegram
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Your code: <span className="font-mono font-semibold text-foreground">{code}</span>
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-navy text-sky-300">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h2 className="font-display font-semibold">Referral Earnings</h2>
            <p className="text-sm text-muted-foreground">20% commission on every deposit by your referrals.</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-xl font-semibold">{formatMoney(earnings.total)}</p>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </div>
        </div>

        {earnings.transactions.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No referral earnings yet. Share your link to start earning.
          </p>
        ) : (
          <div className="mt-4 divide-y rounded-md border">
            {earnings.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium">Referral commission</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.created_at, true)}</p>
                </div>
                <span className="font-semibold text-green-600">+{formatMoney(tx.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
