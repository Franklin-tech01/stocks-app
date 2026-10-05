import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SupportCard } from "@/components/support/support-card";
import { SupportForm } from "@/components/support/support-form";
import { getCurrentUser, getProfile } from "@/lib/data";
import { realEmail } from "@/lib/phone";

export const metadata: Metadata = { title: "Customer Service" };

export default async function SupportPage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getProfile()]);
  return (
    <div className="space-y-6">
      <PageHeader title="Need help?" description="Reach the Stocks team or the community." />
      <SupportCard />
      <SupportForm defaultName={profile.data?.full_name ?? ""} defaultEmail={realEmail(user?.email) ?? ""} />
    </div>
  );
}
