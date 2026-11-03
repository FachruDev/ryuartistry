import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const ACCOUNT_DISABLED = "ACCOUNT_DISABLED";

export const auth = betterAuth({
  // BETTER_AUTH_URL wins when set; otherwise use the site's own URL (Vercel production domain in deploys).
  baseURL: process.env.BETTER_AUTH_URL || siteUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // Accounts are created by an admin (CMS → Pengguna, or scripts/seed.ts), never by public sign-up.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  // Signing in only goes through the login Server Action, which is rate limited (lib/actions/auth.ts).
  // The matching HTTP endpoints stay closed so they cannot be used to get around that limit.
  disabledPaths: ["/sign-in/email", "/sign-up/email", "/request-password-reset", "/reset-password", "/change-password", "/change-email", "/update-user", "/delete-user"],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "editor", input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // A disabled account keeps its password but can no longer open a session.
        async before(session) {
          const [row] = await db.select({ disabledAt: schema.user.disabledAt }).from(schema.user).where(eq(schema.user.id, session.userId));
          if (row?.disabledAt) throw new APIError("FORBIDDEN", { message: "Akun ini dinonaktifkan.", code: ACCOUNT_DISABLED });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type SessionUser = { id: string; name: string; email: string; role: string; sessionId: string };

/** Returns the signed-in CMS user, or null. Deduplicated per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email, role } = session.user as typeof session.user & { role?: string };
  return { id, name, email, role: role ?? "editor", sessionId: session.session.id };
});

/** Use at the top of every admin page and Server Action. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/admin");
  return user;
}
