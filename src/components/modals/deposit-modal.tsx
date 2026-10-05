"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { depositSchema } from "@/lib/schemas";
import { initiateDeposit } from "@/lib/actions/payments";
import { MIN_DEPOSIT_AMOUNT } from "@/lib/config";

type Values = z.infer<typeof depositSchema>;

export function DepositModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(depositSchema), defaultValues: { method: "" } });

  async function onSubmit(v: Values) {
    const res = await initiateDeposit({ amount: Number(v.amount), method: v.method });
    if (res.ok && "checkoutUrl" in res) {
      // Full navigation: Korapay's checkout is a separate site, not an in-app route.
      setRedirecting(true);
      window.location.assign(res.checkoutUrl);
      return;
    }
    toast.error(!res.ok ? res.error : "Could not start the deposit.");
  }

  const busy = isSubmitting || redirecting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title="Deposit Funds" description="Add money to your Stocks balance." />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 pt-3">
          <Field label="Amount (₦)" htmlFor="dep-amount" error={errors.amount?.message}>
            <Input
              id="dep-amount"
              inputMode="decimal"
              placeholder={`Minimum ₦${MIN_DEPOSIT_AMOUNT.toLocaleString("en-NG")}`}
              disabled={busy}
              aria-invalid={!!errors.amount}
              {...register("amount")}
            />
          </Field>
          <Field label="Payment method" htmlFor="dep-method" error={errors.method?.message}>
            <Select id="dep-method" disabled={busy} {...register("method")}>
              <option value="">Select a method</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Debit card</option>
            </Select>
          </Field>
          <div className="flex gap-2.5 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <p>You&apos;ll be redirected to Korapay to complete payment securely.</p>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Landmark />}
            {redirecting ? "Redirecting…" : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
