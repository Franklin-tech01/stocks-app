import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@/lib/db";
import { siteUrl } from "@/lib/config";

export const auth = betterAuth({
  database: pool,
  baseURL: siteUrl(),
  // Allow local development even when BETTER_AUTH_URL points at production.
  trustedOrigins:
    process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Accounts are identified by phone number (see `@/lib/phone`), and there's
    // no SMS/email provider connected, so nothing is actually delivered to the
    // user — this callback exists only because Better Auth disables the whole
    // reset-password API when it's absent. Support/admin can still complete a
    // reset by reading the token straight out of the `verification` table for
    // this identifier and calling POST /api/auth/reset-password with it.
    sendResetPassword: async ({ user, url, token }) => {
      console.log(`[auth] password reset requested for ${user.email} — token: ${token} — url: ${url}`);
    },
  },
  plugins: [nextCookies()], // must stay last
});
