"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;

/** Bottom sheet on mobile, centered modal from sm up. */
export function DialogContent({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { hideClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-md" />
      <DialogPrimitive.Content
        className={cn(
          "safe-bottom fixed z-50 flex max-h-[92dvh] w-full flex-col overflow-y-auto border border-white bg-white shadow-pop outline-none",
          "bottom-0 left-0 rounded-t-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1 px-6 pb-2 pr-14 pt-6">
      <DialogPrimitive.Title className="font-display text-lg font-semibold">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Description className="text-sm text-muted-foreground">
        {description ?? "Stocks"}
      </DialogPrimitive.Description>
    </div>
  );
}
