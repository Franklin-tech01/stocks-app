import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { initials } from "@/lib/utils";

/** Sticky top bar shown on mobile only. Admins also get a shortcut to /admin. */
export function MobileHeader({
  name,
  email,
  isAdmin = false,
}: {
  name: string | null;
  email: string | null;
  isAdmin?: boolean;
}) {
  return (
    <header className="glass sticky top-2 z-30 mx-3 mt-2 flex h-14 items-center justify-between rounded-full px-4 md:hidden">
      <Logo />
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            aria-label="Admin"
            className="grid size-9 place-items-center rounded-full border bg-white/50 text-foreground transition-colors hover:bg-white/80"
          >
            <ShieldCheck className="size-4" />
          </Link>
        )}
        <Link
          href="/profile"
          aria-label="Profile"
          className="grid size-9 place-items-center rounded-full bg-navy text-xs font-semibold text-sky-300"
        >
          {initials(name, email)}
        </Link>
      </div>
    </header>
  );
}
