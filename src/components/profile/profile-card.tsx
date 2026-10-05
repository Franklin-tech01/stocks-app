"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/account";
import { profileSchema } from "@/lib/schemas";
import { formatDate, initials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

type Values = z.infer<typeof profileSchema>;

const statusTone = { active: "success", pending: "warning", suspended: "danger" } as const;

export function ProfileCard({ profile }: { profile: Profile }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: profile.full_name ?? "" },
  });

  async function onSubmit(v: Values) {
    const res = await updateProfile(v);
    if (res.ok) toast.success("Profile updated.");
    else toast.error(res.error);
  }

  const details = [
    ["Phone", profile.phone ?? "—"],
    ["Account ID", profile.id.slice(0, 8).toUpperCase()],
    ["Date joined", formatDate(profile.created_at)],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="flex flex-col items-center p-6 text-center">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="size-24 rounded-full object-cover" />
        ) : (
          <div className="grid size-24 place-items-center rounded-full bg-navy font-display text-3xl font-semibold text-sky-300">
            {initials(profile.full_name, profile.email)}
          </div>
        )}
        <p className="mt-4 font-display text-lg font-semibold">{profile.full_name ?? "Stocks member"}</p>
        <Badge tone={statusTone[profile.account_status]} className="mt-2 capitalize">
          {profile.account_status}
        </Badge>
        <dl className="mt-6 w-full space-y-3 border-t pt-4 text-left text-sm">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="font-display text-lg font-semibold">Personal information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
          <Field label="Full name" htmlFor="p-name" error={errors.full_name?.message}>
            <Input id="p-name" autoComplete="name" aria-invalid={!!errors.full_name} {...register("full_name")} />
          </Field>
          <Field label="Phone number" htmlFor="p-phone">
            <Input id="p-phone" value={profile.phone ?? ""} disabled readOnly />
          </Field>
          <p className="-mt-2 text-xs text-muted-foreground">
            Your phone number is your login. Contact support to change it.
          </p>
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
