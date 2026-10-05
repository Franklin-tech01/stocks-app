"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { useModals } from "@/components/modals/modals-provider";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { sidebarNav, type NavItem } from "./nav";

/** Rail (icons only) on tablet, full sidebar on desktop, hidden on mobile. */
export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { openDeposit, openWithdraw } = useModals();

  const itemClass = (active: boolean) =>
    cn(
      "group relative flex h-11 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition-colors md:justify-center lg:justify-start",
      active
        ? "bg-white/15 text-white shadow-[0_1px_0_rgb(255_255_255/0.25)_inset]"
        : "text-navy-muted hover:bg-white/5 hover:text-white",
    );

  function renderItem(item: NavItem) {
    const active = !!item.href && pathname.startsWith(item.href);
    const content = (
      <>
        {active && <span className="absolute left-1 h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_2px_rgb(125_211_252/0.8)] lg:hidden" />}
        <item.icon className={cn("size-[18px] shrink-0", active && "text-sky-300")} />
        <span className="md:hidden lg:inline">{item.label}</span>
      </>
    );
    if (item.href) {
      return (
        <Link key={item.label} href={item.href} title={item.label} className={itemClass(active)} aria-current={active ? "page" : undefined}>
          {content}
        </Link>
      );
    }
    return (
      <button
        key={item.label}
        type="button"
        title={item.label}
        onClick={item.action === "deposit" ? openDeposit : openWithdraw}
        className={cn(itemClass(false), "w-full text-left")}
      >
        {content}
      </button>
    );
  }

  return (
    <aside className="glass-dark sticky top-3 m-3 mr-0 hidden h-[calc(100dvh-1.5rem)] w-[76px] shrink-0 flex-col rounded-3xl p-3 text-navy-foreground md:flex lg:w-64 lg:p-4">
      <div className="flex h-12 items-center justify-center px-1 lg:justify-start lg:px-2">
        <Logo tone="light" className="hidden lg:inline-flex" />
        <LogoMark className="lg:hidden" />
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1" aria-label="Main">
        {sidebarNav.map(renderItem)}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
        {isAdmin && (
          <Link href="/admin" title="Admin" className={itemClass(pathname.startsWith("/admin"))}>
            <ShieldCheck className="size-[18px]" />
            <span className="md:hidden lg:inline">Admin</span>
          </Link>
        )}
        <Link href="/settings" title="Settings" className={itemClass(pathname.startsWith("/settings"))}>
          <Settings className="size-[18px]" />
          <span className="md:hidden lg:inline">Settings</span>
        </Link>
        <form action={signOut}>
          <button type="submit" title="Logout" className={cn(itemClass(false), "w-full text-left")}>
            <LogOut className="size-[18px]" />
            <span className="md:hidden lg:inline">Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
