"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowUpFromLine, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { withdrawSchema } from "@/lib/schemas";
import { getWithdrawalBanks, requestWithdrawal, verifyWithdrawalAccount } from "@/lib/actions/payments";
import { MIN_WITHDRAWAL_AMOUNT, WITHDRAWAL_CHARGE_RATE, WITHDRAWALS_ENABLED } from "@/lib/config";
import type { Bank } from "@/lib/otpay";

type Values = z.infer<typeof withdrawSchema>;

export function WithdrawModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [verify, setVerify] = useState<
    { state: "idle" } | { state: "checking" } | { state: "ok"; name: string } | { state: "error"; message: string }
  >({ state: "idle" });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(withdrawSchema) });
  const bankCode = useWatch({ control, name: "bankCode" });
  const accountNumber = useWatch({ control, name: "accountNumber" });

  // Load the bank list once per time the modal opens.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sets a loading flag before an external fetch, standard pattern
    setBanksLoading(true);
    getWithdrawalBanks().then((res) => {
      if (res.ok) setBanks(res.banks);
      else toast.error(res.error);
      setBanksLoading(false);
    });
  }, [open]);

  // Resolve the account name as soon as a bank + full account number are entered.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets verification state when its inputs change, before a debounced external fetch
    setVerify({ state: "idle" });
    if (!bankCode || !/^\d{10}$/.test(accountNumber ?? "")) return;
    let cancelled = false;
    setVerify({ state: "checking" });
    const t = setTimeout(async () => {
      const res = await verifyWithdrawalAccount({ bankCode, accountNumber });
      if (cancelled) return;
      setVerify(res.ok ? { state: "ok", name: res.accountName } : { state: "error", message: res.error });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [bankCode, accountNumber]);

  async function onSubmit(v: Values) {
    if (verify.state !== "ok") {
      toast.error("Enter a bank and account number that verify successfully first.");
      return;
    }
    const res = await requestWithdrawal({ amount: Number(v.amount), bankCode: v.bankCode, accountNumber: v.accountNumber });
    if (res.ok) {
      toast.success("Withdrawal request submitted. It will be reviewed and paid out.");
      reset();
      setVerify({ state: "idle" });
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title="Withdraw Funds" description="Move money out of your Stocks balance." />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-3">
          <Field label="Amount (₦)" htmlFor="wd-amount" error={errors.amount?.message}>
            <Input
              id="wd-amount"
              inputMode="decimal"
              placeholder={`Minimum ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString("en-NG")}`}
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
          </Field>
          <Field label="Bank" htmlFor="wd-bank" error={errors.bankCode?.message}>
            <Select id="wd-bank" disabled={banksLoading} {...register("bankCode")}>
              <option value="">{banksLoading ? "Loading banks…" : "Select your bank"}</option>
              {banks.map((b) => (
                <option key={b.bank_code} value={b.bank_code}>
                  {b.bank_name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Account number" htmlFor="wd-acct-no" error={errors.accountNumber?.message}>
            <Input
              id="wd-acct-no"
              inputMode="numeric"
              maxLength={10}
              placeholder="0123456789"
              aria-invalid={!!errors.accountNumber}
              {...register("accountNumber")}
            />
          </Field>

          {verify.state === "checking" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Verifying account…
            </p>
          )}
          {verify.state === "ok" && (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> {verify.name}
            </p>
          )}
          {verify.state === "error" && (
            <p className="flex items-center gap-2 text-sm text-danger">
              <XCircle className="size-4" /> {verify.message}
            </p>
          )}

          <div className="flex gap-2.5 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Withdrawals unlock after you buy your first share. The amount is held from your balance immediately
              and paid out after review. A {WITHDRAWAL_CHARGE_RATE * 100}% withdrawal charge applies — you receive
              the rest.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || verify.state !== "ok" || !WITHDRAWALS_ENABLED}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowUpFromLine />}
            {WITHDRAWALS_ENABLED ? "Request Withdrawal" : "Withdrawals paused"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
