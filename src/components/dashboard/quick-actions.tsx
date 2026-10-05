"use client";

import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Receipt, ShoppingBag } from "lucide-react";
import { useModals } from "@/components/modals/modals-provider";

const base =
  "group flex flex-col items-start gap-3 glass rounded-xl p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop active:scale-[0.98]";

function Tile({ icon: Icon, label, hint }: { icon: typeof Receipt; label: string; hint: string }) {
  return (
    <>
      <span className="grid size-10 place-items-center rounded-md bg-navy text-white transition-colors group-hover:bg-primary group-hover:text-sky-300-foreground">
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </>
  );
}

export function QuickActions() {
  const { openDeposit, openWithdraw } = useModals();
  return (
    <section aria-label="Quick actions" className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <button type="button" onClick={openDeposit} className={base}>
        <Tile icon={ArrowDownToLine} label="Deposit" hint="Add funds" />
      </button>
      <button type="button" onClick={openWithdraw} className={base}>
        <Tile icon={ArrowUpFromLine} label="Withdraw" hint="Cash out" />
      </button>
      <Link href="/marketplace" className={base}>
        <Tile icon={ShoppingBag} label="Buy Shares" hint="Browse packages" />
      </Link>
      <Link href="/transactions" className={base}>
        <Tile icon={Receipt} label="Transactions" hint="View history" />
      </Link>
    </section>
  );
}
