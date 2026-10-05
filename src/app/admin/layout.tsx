import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { requireAdmin } from "@/lib/data/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-dvh bg-background">
      <header className="glass-dark sticky top-3 z-30 mx-3 mt-3 overflow-hidden rounded-3xl text-navy-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Logo tone="light" />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky-300">
              Admin
            </span>
          </div>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-navy-muted hover:text-white">
            <ArrowLeft className="size-4" /> Back to app
          </Link>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
