"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNav } from "./nav";

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom glass fixed inset-x-3 bottom-3 z-40 rounded-3xl md:hidden"
    >
      <ul className="grid grid-cols-5">
        {mobileNav.map((item) => {
          const active = pathname.startsWith(item.href!);
          return (
            <li key={item.label}>
              <Link
                href={item.href!}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-colors",
                    active && "bg-primary text-white shadow-[0_6px_16px_-4px_rgb(26_98_214/0.7)]",
                  )}
                >
                  <item.icon className="size-[20px]" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
