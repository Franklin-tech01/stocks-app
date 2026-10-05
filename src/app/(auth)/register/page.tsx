"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { applyReferral } from "@/lib/actions/account";
import { registerSchema } from "@/lib/schemas";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

type Values = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(v: Values) {
    const { error } = await authClient.signUp.email({
      name: v.full_name,
      email: phoneToEmail(normalizePhone(v.phone)!),
      password: v.password,
    });
    if (error) {
      toast.error(
        /exist/i.test(error.message ?? "") || error.code === "USER_ALREADY_EXISTS"
          ? "An account with this phone number already exists."
          : error.message || "Could not create your account.",
      );
      return;
    }
    // Attribute the signup to the invite link it came from (/register?ref=CODE).
    // Read from the URL here rather than useSearchParams to avoid a Suspense
    // boundary; a bad or missing code never blocks signup.
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) await applyReferral(ref).catch(() => undefined);
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Join Stocks in under a minute.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <Input id="full_name" autoComplete="name" aria-invalid={!!errors.full_name} {...register("full_name")} />
        </Field>
        <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0801 234 5678" aria-invalid={!!errors.phone} {...register("phone")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <Input id="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
