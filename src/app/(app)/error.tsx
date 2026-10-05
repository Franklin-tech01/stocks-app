"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center glass rounded-xl px-6 py-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle />
      </div>
      <h2 className="mt-4 font-display text-lg font-semibold">Something went wrong</h2>
      <p className="mt-1 text-sm text-muted-foreground">We could not load this page. Please try again.</p>
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
