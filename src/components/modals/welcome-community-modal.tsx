"use client";

import { useEffect, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";
import { COMMUNITY_POPUP_STORAGE_KEY, links } from "@/lib/config";

/** Shown after login until dismissed once (preference kept in localStorage per browser). */
export function WelcomeCommunityModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const key = `${COMMUNITY_POPUP_STORAGE_KEY}:${userId}`;

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads external localStorage once on mount
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {
      /* storage unavailable: skip the popup rather than nag every visit */
    }
  }, [key]);

  function dismiss() {
    try {
      localStorage.setItem(key, "1");
    } catch {}
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : dismiss())}>
      <DialogContent>
        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <LogoMark className="size-14" />
          <h2 className="mt-4 font-display text-xl font-semibold">Welcome to Stocks 🎉</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Stay connected with the Stocks community for updates, announcements, market information
            and support.
          </p>
          <div className="mt-6 grid w-full gap-3">
            <CommunityButton href={links.communityGroup} icon={<Users />} label="Join Community Group" />
            <CommunityButton href={links.communityChannel} icon={<Megaphone />} label="Join Channel" variant="navy" />
            <Button variant="ghost" onClick={dismiss}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommunityButton({
  href,
  icon,
  label,
  variant = "default",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "navy";
}) {
  if (!href) {
    return (
      <Button size="lg" variant={variant} disabled title="Link not configured">
        {icon} {label}
      </Button>
    );
  }
  return (
    <Button size="lg" variant={variant} asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {icon} {label}
      </a>
    </Button>
  );
}
