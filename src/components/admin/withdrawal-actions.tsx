"use client";

import { useState, useTransition } from "react";
import { Banknote, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markWithdrawalPaid, payoutViaOtpay, rejectWithdrawal } from "@/lib/actions/admin";
import { formatMoney } from "@/lib/utils";
import { WITHDRAWAL_CHARGE_RATE } from "@/lib/config";

export function WithdrawalActions({
  id,
  amount,
  name,
  hasBankCode,
  locked,
}: {
  id: string;
  amount: number;
  name: string;
  hasBankCode: boolean;
  locked: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<"otpay" | "manual" | "reject" | null>(null);

  function payViaOtpay() {
    if (
      !window.confirm(
        `Pay ${formatMoney(amount * (1 - WITHDRAWAL_CHARGE_RATE))} (after the ${WITHDRAWAL_CHARGE_RATE * 100}% charge) to ${name} via OTPay right now?\n\nThis sends real money immediately and cannot be undone.`,
      )
    )
      return;
    setBusyAction("otpay");
    startTransition(async () => {
      const res = await payoutViaOtpay(id);
      if (res.ok) toast.success("Paid via OTPay.");
      else toast.error(res.error, { duration: 10000 });
    });
  }

  function payManually() {
    if (
      !window.confirm(
        `Mark ${formatMoney(amount)} to ${name} as paid?\n\nOnly do this after you have actually sent the money yourself.`,
      )
    )
      return;
    setBusyAction("manual");
    startTransition(async () => {
      const res = await markWithdrawalPaid(id);
      if (res.ok) toast.success("Marked as paid.");
      else toast.error(res.error);
    });
  }

  function reject() {
    if (!window.confirm(`Reject this withdrawal and refund ${formatMoney(amount)} to ${name}'s balance?`)) return;
    setBusyAction("reject");
    startTransition(async () => {
      const res = await rejectWithdrawal(id);
      if (res.ok) toast.success("Rejected and refunded.");
      else toast.error(res.error);
    });
  }

  if (locked) {
    return <p className="text-right text-xs font-medium text-warning">Payout in progress — refresh shortly</p>;
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button size="sm" variant="outline" onClick={reject} disabled={pending}>
        {pending && busyAction === "reject" ? <Loader2 className="animate-spin" /> : <X />} Reject
      </Button>
      <Button size="sm" variant="outline" onClick={payManually} disabled={pending}>
        {pending && busyAction === "manual" ? <Loader2 className="animate-spin" /> : <Check />} Mark Paid
      </Button>
      {hasBankCode && (
        <Button size="sm" onClick={payViaOtpay} disabled={pending}>
          {pending && busyAction === "otpay" ? <Loader2 className="animate-spin" /> : <Banknote />} Pay via OTPay
        </Button>
      )}
    </div>
  );
}
