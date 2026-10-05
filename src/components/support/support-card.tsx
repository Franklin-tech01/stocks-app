import { ExternalLink, Mail, Megaphone, MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { links } from "@/lib/config";

const options = [
  { label: "WhatsApp", hint: "Chat with support", icon: MessageCircle, href: links.whatsapp },
  { label: "Email", hint: links.supportEmail || "Send us an email", icon: Mail, href: links.supportEmail ? `mailto:${links.supportEmail}` : "" },
  { label: "Community Group", hint: "Talk with members", icon: Users, href: links.communityGroup },
  { label: "Channel", hint: "News & announcements", icon: Megaphone, href: links.communityChannel },
];

export function SupportCard() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const inner = (
          <>
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-navy text-sky-300">
              <o.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{o.label}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {o.href ? o.hint : "Not configured yet"}
              </span>
            </span>
            {o.href && <ExternalLink className="size-4 text-muted-foreground" />}
          </>
        );
        return o.href ? (
          <a key={o.label} href={o.href} target="_blank" rel="noopener noreferrer" className="block">
            <Card className="flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-pop">{inner}</Card>
          </a>
        ) : (
          <Card key={o.label} className="flex items-center gap-3 p-4 opacity-60">
            {inner}
          </Card>
        );
      })}
    </div>
  );
}
