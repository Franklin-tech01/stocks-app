import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getCurrentUser } from "@/lib/data";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Validates the session against the database (not just the cookie).
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="glass-dark relative m-4 mr-0 hidden overflow-hidden rounded-3xl p-12 text-navy-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute -right-32 -top-32 size-[28rem] rounded-full border border-white/10 bg-sky-400/10 blur-sm"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 size-[34rem] rounded-full border border-white/5"
        />
        <Logo tone="light" />
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Your Stocks shares, all in one place.
          </h1>
          <p className="mt-4 text-navy-muted">
            Browse share packages, track your portfolio and stay connected with the Stocks
            community.
          </p>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-navy-muted">
          <ShieldCheck className="size-4 text-sky-300" /> Your account is protected by
          server-side access checks.
        </p>
      </aside>
      <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}
