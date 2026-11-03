"use server";

import { and, eq, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { refresh } from "next/cache";
import { APIError } from "better-auth/api";
import { auth, requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { passwordProblem } from "@/lib/passwords";
import { hashed, hit, waitText } from "@/lib/rate-limit";
import { str, type FormState } from "@/lib/forms";

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(form, "name").slice(0, 80);
  if (name.length < 2) return { error: "Nama minimal 2 huruf." };
  await db.update(schema.user).set({ name }).where(eq(schema.user.id, user.id));
  refresh();
  return { ok: true };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = form.get("currentPassword")?.toString() ?? "";
  const next = form.get("newPassword")?.toString() ?? "";
  if (next !== (form.get("confirmPassword")?.toString() ?? "")) return { error: "Konfirmasi password baru tidak sama." };
  const problem = passwordProblem(next, user);
  if (problem) return { error: problem };
  if (next === current) return { error: "Password baru harus berbeda dari yang lama." };

  // A stolen session should not be able to guess the current password at full speed.
  const wait = await hit({ key: `password:user:${hashed(user.id)}`, max: 5, windowMs: 15 * 60_000 });
  if (wait) return { error: `Terlalu banyak percobaan. Coba lagi dalam ${waitText(wait)}.` };

  try {
    // Signs out every other device; this one gets a fresh session cookie.
    await auth.api.changePassword({
      body: { currentPassword: current, newPassword: next, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) return { error: "Password lama salah." };
    throw error;
  }
  refresh();
  return { ok: true };
}

export async function signOutOtherSessions() {
  const user = await requireUser();
  await db.delete(schema.session).where(and(eq(schema.session.userId, user.id), ne(schema.session.id, user.sessionId)));
  refresh();
}
