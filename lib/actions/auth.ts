"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { ACCOUNT_DISABLED, auth } from "@/lib/auth";
import { safeAdminPath } from "@/lib/admin-path";
import { blocked, clientIp, hashed, hit, reset, waitText, type Limit } from "@/lib/rate-limit";
import { str, type FormState } from "@/lib/forms";

const WINDOW = 15 * 60_000;

// Per email stops guessing one account's password; per IP stops one machine trying many accounts.
const loginLimits = (ip: string, email: string): Limit[] => [
  { key: `login:email:${hashed(email)}`, max: 5, windowMs: WINDOW },
  { key: `login:ip:${hashed(ip)}`, max: 20, windowMs: WINDOW },
];

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = form.get("password")?.toString() ?? "";
  // Honeypot: people never see this field, so anything in it is a bot.
  if (str(form, "website")) return { error: "Email atau password salah." };
  if (!email || !password) return { error: "Isi email dan password." };

  const h = await headers();
  const limits = loginLimits(clientIp(h), email);
  const wait = await blocked(...limits);
  if (wait) return { error: `Terlalu banyak percobaan masuk. Coba lagi dalam ${waitText(wait)}.` };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: h });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    // The password was right; only then is it safe to say the account is off.
    if (error.body?.code === ACCOUNT_DISABLED) return { error: "Akun ini dinonaktifkan. Hubungi admin CMS." };
    const after = await hit(...limits);
    console.warn(`login failed for ${email}`);
    return { error: after ? `Terlalu banyak percobaan masuk. Coba lagi dalam ${waitText(after)}.` : "Email atau password salah." };
  }
  await reset(limits[0].key);
  redirect(safeAdminPath(str(form, "next")));
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/admin/login");
}
