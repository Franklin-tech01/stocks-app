import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("glass rounded-xl text-card-foreground", className)}
      {...props}
    />
  );
}
