import Image from "next/image";
import { cn } from "@/lib/utils";

/** The Stocks "S" mark, on a white rounded tile so it reads on any background. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="Stocks"
      width={128}
      height={128}
      className={cn("size-8 shrink-0 rounded-lg bg-white object-contain", className)}
    />
  );
}

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        Stocks
      </span>
    </span>
  );
}
