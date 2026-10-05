import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { links } from "@/lib/config";

// Self-service reset needs an SMS provider (not connected yet), so for now
// people are pointed to support. Swap this page for an OTP flow later.
export default function ForgotPasswordPage() {
  const contact = links.whatsapp || (links.supportEmail ? `mailto:${links.supportEmail}` : "");
  return (
    <div>
      <div className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <KeyRound />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">Forgot your password?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Password resets are handled by our support team for now. Contact us from the phone number on
        your account and we will help you get back in.
      </p>
      {contact && (
        <Button asChild className="mt-6 w-full" size="lg">
          <a href={contact} target="_blank" rel="noopener noreferrer">
            Contact support
          </a>
        </Button>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
