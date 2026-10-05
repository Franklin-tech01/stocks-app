import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-xl border border-input bg-white/60 backdrop-blur-md shadow-[0_1px_0_rgb(255_255_255/0.8)_inset] px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:bg-muted aria-[invalid=true]:border-danger";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(field, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(field, "min-h-28 py-3", className)} {...props} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select className={cn(field, "h-11", className)} {...props} />;
}
